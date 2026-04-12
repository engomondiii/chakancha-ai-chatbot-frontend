/**
 * claudeClient.js
 * Anthropic Claude API client for Chakancha Global
 * Handles all AI communication — streaming, single-shot, and conversation-aware requests
 */

import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPTS, buildContextualSystemPrompt } from './prompts';
import { detectIntent } from './intentDetection';
import { buildConversationContext } from './conversationManager';

// ─── Constants ────────────────────────────────────────────────────────────────

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const MAX_TOKENS     = 1024;
const TEMPERATURE    = 0.7;
const MAX_RETRIES    = 2;
const RETRY_DELAY_MS = 1000;

// ─── Client singleton ─────────────────────────────────────────────────────────

let _client = null;

function getClient() {
  if (_client) return _client;

  const apiKey =
    process.env.NEXT_PUBLIC_CLAUDE_API_KEY ||
    process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new ClaudeError(
      'MISSING_API_KEY',
      'Anthropic API key is not configured. Please set ANTHROPIC_API_KEY in your environment.'
    );
  }

  _client = new Anthropic({
    apiKey,
    // Required for browser-side streaming with Next.js
    dangerouslyAllowBrowser: true,
  });

  return _client;
}

// ─── Error class ──────────────────────────────────────────────────────────────

export class ClaudeError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name    = 'ClaudeError';
    this.code    = code;
    this.details = details;
  }
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

async function withRetry(fn, retries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry on client errors (4xx), only server errors (5xx) or network
      if (err?.status && err.status >= 400 && err.status < 500) break;

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

// ─── Message helpers ──────────────────────────────────────────────────────────

/**
 * Convert internal message format → Anthropic API format
 * Internal: { id, type: 'user'|'ai'|'system', content, timestamp }
 * Anthropic: { role: 'user'|'assistant', content: string }
 */
function toAnthropicMessages(messages) {
  return messages
    .filter((m) => m.type === 'user' || m.type === 'ai')
    .map((m) => ({
      role:    m.type === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));
}

// ─── Core: send a single message (non-streaming) ──────────────────────────────

/**
 * Send a message and get a complete response.
 * Useful for intent detection and short non-streamed calls.
 *
 * @param {string}   userMessage - The user's message
 * @param {Array}    history     - Previous messages in internal format
 * @param {object}   options     - { systemPrompt, maxTokens, temperature }
 * @returns {Promise<{content: string, intent: string|null, usage: object}>}
 */
export async function sendMessage(userMessage, history = [], options = {}) {
  const client = getClient();

  const {
    systemPrompt = SYSTEM_PROMPTS.base,
    maxTokens    = MAX_TOKENS,
    temperature  = TEMPERATURE,
  } = options;

  const messages = [
    ...toAnthropicMessages(history),
    { role: 'user', content: userMessage },
  ];

  const response = await withRetry(() =>
    client.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: maxTokens,
      system:     systemPrompt,
      messages,
      temperature,
    })
  );

  const content = response.content?.[0]?.text ?? '';
  const intent  = await detectIntent(userMessage, content);

  return {
    content,
    intent,
    usage: response.usage,
    stopReason: response.stop_reason,
  };
}

// ─── Core: streaming message ──────────────────────────────────────────────────

/**
 * Send a message and stream the response token-by-token.
 *
 * @param {string}   userMessage  - The user's message
 * @param {Array}    history      - Previous messages in internal format
 * @param {object}   callbacks    - { onToken, onComplete, onError }
 * @param {object}   options      - { systemPrompt, maxTokens, temperature, conversationContext }
 */
export async function streamMessage(userMessage, history = [], callbacks = {}, options = {}) {
  const {
    onToken    = () => {},
    onComplete = () => {},
    onError    = () => {},
  } = callbacks;

  const {
    maxTokens           = MAX_TOKENS,
    temperature         = TEMPERATURE,
    conversationContext = null,
  } = options;

  const client = getClient();

  // Build a contextual system prompt based on conversation history + current intent
  const systemPrompt = buildContextualSystemPrompt(
    history,
    conversationContext
  );

  const messages = [
    ...toAnthropicMessages(history),
    { role: 'user', content: userMessage },
  ];

  try {
    let fullContent = '';

    const stream = client.messages.stream({
      model:      CLAUDE_MODEL,
      max_tokens: maxTokens,
      system:     systemPrompt,
      messages,
      temperature,
    });

    // Stream tokens as they arrive
    stream.on('text', (delta) => {
      fullContent += delta;
      onToken(delta, fullContent);
    });

    // Wait for stream to complete
    const finalMessage = await stream.finalMessage();

    const intent    = await detectIntent(userMessage, fullContent);
    const followUps = generateFollowUpSuggestions(intent, fullContent);

    onComplete({
      content:     fullContent,
      intent,
      followUps,
      usage:       finalMessage.usage,
      stopReason:  finalMessage.stop_reason,
    });

    return { content: fullContent, intent, followUps };

  } catch (err) {
    const claudeError = normalizeError(err);
    onError(claudeError);
    throw claudeError;
  }
}

// ─── Conversational wrapper ───────────────────────────────────────────────────

/**
 * High-level function used by the AI store.
 * Builds full context, streams, handles Chakan Tree signals.
 *
 * @param {string} userMessage
 * @param {Array}  history
 * @param {object} callbacks   - { onToken, onComplete, onError }
 * @param {object} metadata    - { conversationId, userId }
 */
export async function chat(userMessage, history = [], callbacks = {}, metadata = {}) {
  const conversationContext = buildConversationContext(history);

  return streamMessage(userMessage, history, callbacks, {
    conversationContext,
    ...metadata,
  });
}

// ─── Follow-up suggestions ────────────────────────────────────────────────────

/**
 * Generate contextual follow-up questions based on detected intent.
 */
function generateFollowUpSuggestions(intent, _responseContent) {
  const suggestions = {
    discovery: [
      'Tell me more about the tasting notes',
      'How do I brew this tea perfectly?',
      'What makes Nandi Hills special for growing tea?',
    ],
    origin: [
      'How is the tea harvested?',
      'What elevation are the tea gardens at?',
      'Can I trace my specific batch?',
    ],
    impact: [
      'How does Chakan Tree work?',
      'What percentage goes to tea pickers?',
      'How can I support the community?',
    ],
    brewing: [
      'What water temperature works best?',
      'Can I reuse the tea leaves?',
      'What food pairs well with this tea?',
    ],
    products: [
      'What are your shipping options?',
      'Do you offer subscriptions?',
      'Tell me about the black tea',
    ],
    chakanTree: [
      'How do I join Chakan Tree?',
      'What rewards do participants get?',
      'How does the referral system work?',
    ],
    general: [
      'Tell me about your teas',
      'Where does Chakancha tea come from?',
      'How does Chakancha support tea pickers?',
    ],
  };

  return (suggestions[intent] || suggestions.general).slice(0, 3);
}

// ─── Error normalizer ─────────────────────────────────────────────────────────

function normalizeError(err) {
  if (err instanceof ClaudeError) return err;

  // Anthropic SDK errors
  if (err?.status) {
    const map = {
      400: ['INVALID_REQUEST',   'Invalid request sent to Claude API.'],
      401: ['AUTH_ERROR',        'Claude API authentication failed. Check your API key.'],
      403: ['PERMISSION_DENIED', 'Permission denied by Claude API.'],
      429: ['RATE_LIMIT',        'Claude API rate limit exceeded. Please try again shortly.'],
      500: ['SERVER_ERROR',      'Claude API server error. Please try again.'],
      529: ['OVERLOADED',        'Claude API is temporarily overloaded. Please try again.'],
    };

    const [code, message] = map[err.status] || ['API_ERROR', err.message];
    return new ClaudeError(code, message, { status: err.status });
  }

  // Network errors
  if (err?.code === 'ECONNREFUSED' || err?.message?.includes('fetch')) {
    return new ClaudeError('NETWORK_ERROR', 'Network error — please check your connection.');
  }

  return new ClaudeError('UNKNOWN_ERROR', err?.message || 'An unexpected error occurred.');
}

// ─── Health check ─────────────────────────────────────────────────────────────

/**
 * Quick sanity check — send a 1-token ping to verify the API key works.
 * Used by the ConversationView on mount in development.
 */
export async function checkHealth() {
  try {
    const client = getClient();
    await client.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: 1,
      messages:   [{ role: 'user', content: 'hi' }],
    });
    return { healthy: true };
  } catch (err) {
    return { healthy: false, error: normalizeError(err) };
  }
}

export default { sendMessage, streamMessage, chat, checkHealth, ClaudeError };