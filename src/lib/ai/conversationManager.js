/**
 * conversationManager.js
 * Manages conversation context, history trimming, and context window budgeting.
 * Ensures each API call gets the right amount of history without exceeding token limits.
 */

import { nanoid } from 'nanoid';

// ─── Constants ─────────────────────────────────────────────────────────────────

// Rough estimate: 1 token ≈ 4 characters
const CHARS_PER_TOKEN        = 4;
const MAX_CONTEXT_TOKENS     = 80_000; // Leave headroom under claude-sonnet's 200k
const SYSTEM_PROMPT_TOKENS   = 1_500;  // Approx size of our system prompt
const RESPONSE_BUFFER_TOKENS = 1_500;  // Space reserved for the response

const MAX_HISTORY_TOKENS =
  MAX_CONTEXT_TOKENS - SYSTEM_PROMPT_TOKENS - RESPONSE_BUFFER_TOKENS;

// ─── Conversation ID ──────────────────────────────────────────────────────────

export function generateConversationId() {
  return `conv_${nanoid(12)}`;
}

export function generateMessageId() {
  return `msg_${nanoid(10)}`;
}

// ─── Message factory ──────────────────────────────────────────────────────────

/**
 * Create a standardised user message object.
 */
export function createUserMessage(content, metadata = {}) {
  return {
    id:        generateMessageId(),
    type:      'user',
    content:   content.trim(),
    timestamp: Date.now(),
    ...metadata,
  };
}

/**
 * Create a standardised AI message object.
 */
export function createAIMessage(content = '', metadata = {}) {
  return {
    id:         generateMessageId(),
    type:       'ai',
    content,
    timestamp:  Date.now(),
    isStreaming: false,
    intent:     null,
    followUps:  [],
    ...metadata,
  };
}

/**
 * Create a system/status message (e.g. "Conversation cleared").
 */
export function createSystemMessage(content, metadata = {}) {
  return {
    id:        generateMessageId(),
    type:      'system',
    content,
    timestamp: Date.now(),
    ...metadata,
  };
}

// ─── Context builder ──────────────────────────────────────────────────────────

/**
 * Build a conversation context summary from message history.
 * Used by buildContextualSystemPrompt in prompts.js.
 *
 * @param {Array} messages - Full message history
 * @returns {object}       - Context summary for system prompt injection
 */
export function buildConversationContext(messages) {
  if (!messages || messages.length === 0) {
    return { isEmpty: true, topics: [], lastIntent: null, messageCount: 0 };
  }

  const userMessages = messages.filter((m) => m.type === 'user');
  const aiMessages   = messages.filter((m) => m.type === 'ai');

  // Gather unique intents to understand conversation arc
  const intentHistory = aiMessages
    .map((m) => m.intent)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i); // unique

  const lastIntent   = intentHistory[intentHistory.length - 1] || null;
  const firstMessage = userMessages[0]?.content || '';

  // Detect if Chakan Tree has been introduced in this conversation
  const chakanTreeMentioned = messages.some(
    (m) =>
      m.content &&
      m.content.toLowerCase().includes('chakan tree')
  );

  // Detect if a product has been discussed
  const productsMentioned = messages.some(
    (m) =>
      m.content &&
      (m.content.toLowerCase().includes('nandi hills') ||
        m.content.toLowerCase().includes('black tea') ||
        m.content.toLowerCase().includes('green tea') ||
        m.content.toLowerCase().includes('purple peak') ||
        m.content.toLowerCase().includes('silver needle'))
  );

  return {
    isEmpty:              false,
    messageCount:         messages.length,
    userMessageCount:     userMessages.length,
    intentHistory,
    lastIntent,
    firstMessage,
    chakanTreeMentioned,
    productsMentioned,
    topics:               intentHistory,
  };
}

// ─── History trimmer ──────────────────────────────────────────────────────────

/**
 * Trim message history to fit within context window limits.
 * Always keeps the first message (for context continuity) and
 * prioritises the most recent messages.
 *
 * @param {Array} messages - Full message history (internal format)
 * @returns {Array}        - Trimmed history safe for API submission
 */
export function trimHistoryToContextWindow(messages) {
  if (!messages || messages.length === 0) return [];

  // Only include user/ai messages in the API call
  const eligible = messages.filter((m) => m.type === 'user' || m.type === 'ai');

  if (eligible.length === 0) return [];

  // Estimate total token count
  const totalChars  = eligible.reduce((sum, m) => sum + (m.content?.length || 0), 0);
  const totalTokens = Math.ceil(totalChars / CHARS_PER_TOKEN);

  if (totalTokens <= MAX_HISTORY_TOKENS) {
    return eligible;
  }

  // Trim from the middle: keep first 1 exchange + most recent N exchanges
  const tokenBudget = MAX_HISTORY_TOKENS * CHARS_PER_TOKEN;

  // Always include first user message for context
  const first   = eligible.slice(0, 2);
  const rest    = eligible.slice(2);

  let accumulated = first.reduce((sum, m) => sum + (m.content?.length || 0), 0);
  const kept = [...first];

  // Walk backwards from the end, adding messages until budget is spent
  for (let i = rest.length - 1; i >= 0; i--) {
    const msgLen = rest[i].content?.length || 0;
    if (accumulated + msgLen > tokenBudget) break;
    accumulated += msgLen;
    kept.splice(2, 0, rest[i]); // Insert after the first pair
  }

  return kept;
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'chakancha_conv_';

/**
 * Persist a conversation to localStorage.
 * Only saves user/ai messages (not system).
 *
 * @param {string} conversationId
 * @param {Array}  messages
 */
export function saveConversation(conversationId, messages) {
  if (typeof window === 'undefined') return;

  try {
    const toSave = messages
      .filter((m) => m.type !== 'system')
      .map(({ id, type, content, timestamp, intent, followUps }) => ({
        id,
        type,
        content,
        timestamp,
        intent,
        followUps,
      }));

    window.localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${conversationId}`,
      JSON.stringify({ id: conversationId, messages: toSave, savedAt: Date.now() })
    );
  } catch {
    // Storage quota exceeded — fail silently
  }
}

/**
 * Load a conversation from localStorage.
 *
 * @param {string} conversationId
 * @returns {Array|null}
 */
export function loadConversation(conversationId) {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${conversationId}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed.messages || null;
  } catch {
    return null;
  }
}

/**
 * Delete a saved conversation.
 *
 * @param {string} conversationId
 */
export function deleteConversation(conversationId) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(`${STORAGE_KEY_PREFIX}${conversationId}`);
  } catch {
    // Fail silently
  }
}

/**
 * List all saved conversation IDs.
 *
 * @returns {string[]}
 */
export function listSavedConversations() {
  if (typeof window === 'undefined') return [];

  const ids = [];

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      ids.push(key.replace(STORAGE_KEY_PREFIX, ''));
    }
  }

  return ids;
}

export default {
  generateConversationId,
  generateMessageId,
  createUserMessage,
  createAIMessage,
  createSystemMessage,
  buildConversationContext,
  trimHistoryToContextWindow,
  saveConversation,
  loadConversation,
  deleteConversation,
  listSavedConversations,
};