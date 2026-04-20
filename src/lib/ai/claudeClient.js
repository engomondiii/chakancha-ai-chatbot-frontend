/**
 * src/lib/ai/claudeClient.js — Integration Phase 2
 *
 * What changed from the original:
 *  - The Anthropic SDK is REMOVED entirely. The frontend never calls Anthropic directly.
 *    All AI calls go through the Django backend (POST /api/v1/ai/stream/).
 *  - streamMessage() now calls the backend SSE endpoint via createSSEStream()
 *    from client.js, yielding the exact event types the backend emits:
 *      token | products | image | done | error | metadata
 *  - sendMessage() calls POST /api/v1/ai/chat/ (non-streaming fallback)
 *  - chat() is the high-level wrapper used by aiSlice.js — unchanged API surface
 *  - checkHealth() calls GET /api/v1/ai/health/ instead of pinging Anthropic
 *  - ClaudeError kept for backward compatibility with error handling in aiSlice.js
 *  - generateFollowUpSuggestions() kept — used as fallback when backend follow_ups is empty
 *  - The session_id is automatically injected by createSSEStream() from client.js
 *    (via X-Session-Id header and in the POST body)
 */

import { api, createSSEStream, getSessionId, ApiError } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { detectIntent } from './intentDetection';
import { buildConversationContext } from './conversationManager';

// ─── Error class (kept for backward compat) ───────────────────────────────────

export class ClaudeError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name    = 'ClaudeError';
    this.code    = code;
    this.details = details;
  }
}

// ─── Message format converter ─────────────────────────────────────────────────
// Internal format: { id, type: 'user'|'ai'|'system', content, ... }
// Backend format:  { role: 'user'|'assistant', content }

function toBackendHistory(messages) {
  return messages
    .filter((m) => m.type === 'user' || m.type === 'ai')
    .map((m) => ({
      role:    m.type === 'user' ? 'user' : 'assistant',
      content: m.content || '',
    }));
}

// ─── sendMessage — non-streaming (POST /api/v1/ai/chat/) ─────────────────────

/**
 * Send a message and get a complete (non-streaming) response.
 * Used as a fallback and for intent detection in tests.
 *
 * @param {string} userMessage
 * @param {Array}  history      - Internal message format
 * @param {object} options      - { language, cartContext }
 * @returns {Promise<{content, intent, followUps, usage}>}
 */
export async function sendMessage(userMessage, history = [], options = {}) {
  const {
    language    = 'en',
    cartContext  = {},
  } = options;

  try {
    const data = await api.post(ENDPOINTS.AI.CHAT, {
      message:              userMessage,
      session_id:           getSessionId(),
      language,
      cart_context:         cartContext,
      conversation_history: toBackendHistory(history),
    });

    // Backend response: { response, intent, follow_ups, tokens, latency_ms, session_id }
    return {
      content:    data.response   || '',
      intent:     data.intent     || 'general',
      followUps:  data.follow_ups || [],
      usage:      { total_tokens: data.tokens || 0 },
      latency_ms: data.latency_ms || 0,
    };
  } catch (err) {
    throw normalizeError(err);
  }
}

// ─── streamMessage — SSE streaming (POST /api/v1/ai/stream/) ─────────────────

/**
 * Send a message and stream the response token-by-token via SSE.
 * This is the primary function used by aiSlice.js → chat().
 *
 * The backend emits these SSE event types:
 *   {"type": "token",    "content": "Hello"}           → text delta
 *   {"type": "products", "products": [...]}             → product cards
 *   {"type": "image",    "url": "https://..."}          → generated image
 *   {"type": "metadata", "intent": "...", ...}          → post-stream metadata
 *   {"type": "done",     "session_id": "...", ...}      → stream complete
 *   {"type": "error",    "message": "..."}              → stream error
 *
 * @param {string}   userMessage
 * @param {Array}    history      - Internal message format
 * @param {object}   callbacks    - { onToken, onProducts, onImage, onComplete, onError }
 * @param {object}   options      - { language, cartContext, conversationContext }
 */
export async function streamMessage(userMessage, history = [], callbacks = {}, options = {}) {
  const {
    onToken    = () => {},
    onProducts = () => {},
    onImage    = () => {},
    onComplete = () => {},
    onError    = () => {},
  } = callbacks;

  const {
    language           = 'en',
    cartContext         = {},
    conversationContext = null,
  } = options;

  const payload = {
    message:              userMessage,
    session_id:           getSessionId(),
    language,
    cart_context:         cartContext,
    conversation_history: toBackendHistory(history),
  };

  let fullContent  = '';
  let intent       = 'general';
  let followUps    = [];
  let totalTokens  = 0;
  let generatedImage = null;
  let products     = [];

  try {
    for await (const event of createSSEStream(payload)) {
      switch (event.type) {

        case 'token':
          fullContent += event.content || '';
          onToken(event.content || '', fullContent);
          break;

        case 'products':
          products = event.products || [];
          onProducts(products);
          break;

        case 'image':
          generatedImage = event.url;
          onImage(event.url);
          break;

        case 'metadata':
          intent      = event.intent      || intent;
          followUps   = event.follow_ups  || [];
          totalTokens = event.tokens_used || 0;
          break;

        case 'done':
          // done carries the final metadata too
          intent    = event.intent      || intent;
          followUps = event.follow_ups  || followUps;
          onComplete({
            content:        fullContent,
            intent,
            followUps,
            products,
            generatedImage,
            usage:          { total_tokens: event.tokens || totalTokens },
            latency_ms:     event.latency_ms || 0,
            session_id:     event.session_id,
            message_id:     event.message_id,
          });
          return { content: fullContent, intent, followUps, products, generatedImage };

        case 'error':
          const streamErr = new ClaudeError('STREAM_ERROR', event.message || 'Stream error');
          onError(streamErr);
          throw streamErr;

        default:
          break;
      }
    }

    // Stream ended without 'done' event — treat as complete
    onComplete({
      content:        fullContent,
      intent,
      followUps:      followUps.length ? followUps : generateFollowUpSuggestions(intent),
      products,
      generatedImage,
      usage:          { total_tokens: totalTokens },
    });

    return { content: fullContent, intent, followUps, products, generatedImage };

  } catch (err) {
    if (err instanceof ClaudeError) {
      onError(err);
      throw err;
    }
    const normalized = normalizeError(err);
    onError(normalized);
    throw normalized;
  }
}

// ─── chat — high-level wrapper used by aiSlice.js ────────────────────────────

/**
 * High-level conversational function.
 * Builds context and delegates to streamMessage.
 * API surface identical to the original — aiSlice.js calls this unchanged.
 *
 * @param {string} userMessage
 * @param {Array}  history        - Internal message format
 * @param {object} callbacks      - { onToken, onProducts, onImage, onComplete, onError }
 * @param {object} metadata       - { conversationId, userId, cartContext, language }
 */
export async function chat(userMessage, history = [], callbacks = {}, metadata = {}) {
  const conversationContext = buildConversationContext(history);

  return streamMessage(userMessage, history, callbacks, {
    conversationContext,
    language:    metadata.language    || 'en',
    cartContext: metadata.cartContext || {},
  });
}

// ─── checkHealth ─────────────────────────────────────────────────────────────

/**
 * Verify the backend AI endpoint is reachable.
 * Calls GET /api/v1/ai/health/ — much cheaper than a real message.
 */
export async function checkHealth() {
  try {
    await api.get(ENDPOINTS.AI.HEALTH);
    return { healthy: true };
  } catch (err) {
    return { healthy: false, error: normalizeError(err) };
  }
}

// ─── generateImage ───────────────────────────────────────────────────────────

/**
 * Request a DALL-E 3 image from the backend.
 * POST /api/v1/ai/generate-image/
 *
 * @param {string} prompt        - Product name or mood description
 * @param {string} [style]       - 'product_photography' | 'lifestyle'
 * @param {string} [productSlug] - Used for backend Redis caching
 * @returns {Promise<{image_url, prompt_used, cached, model}>}
 */
export async function generateImage(prompt, style = 'product_photography', productSlug = null) {
  return api.post(ENDPOINTS.AI.GENERATE_IMAGE, {
    prompt,
    style,
    ...(productSlug && { product_slug: productSlug }),
  });
}

// ─── sendFeedback ─────────────────────────────────────────────────────────────

/**
 * Send thumbs up/down feedback on a message.
 * POST /api/v1/ai/feedback/
 *
 * @param {number} messageId - Backend message DB id
 * @param {number} rating    - +1 or -1
 * @param {string} [comment]
 */
export async function sendFeedback(messageId, rating, comment = '') {
  return api.post(ENDPOINTS.AI.FEEDBACK, {
    message: messageId,
    rating,
    comment,
  });
}

// ─── Follow-up suggestions (client-side fallback) ────────────────────────────

function generateFollowUpSuggestions(intent) {
  const map = {
    discovery:   ['Tell me more about the tasting notes', 'How do I brew this?', 'What makes Nandi Hills special?'],
    origin:      ['How is the tea harvested?', 'What elevation are the gardens?', 'Who picks the tea?'],
    impact:      ['How does Chakan Tree work?', 'What percentage goes to pickers?', 'How can I support the community?'],
    brewing:     ['What water temperature?', 'Can I reuse the leaves?', 'What food pairs well?'],
    products:    ['What are the shipping options?', 'Do you offer subscriptions?', 'Tell me about the black tea'],
    chakanTree:  ['How do I join Chakan Tree?', 'What rewards do participants get?', 'How does referral work?'],
    general:     ['Tell me about your teas', 'Where does Chakancha come from?', 'How does Chakancha support pickers?'],
  };
  return (map[intent] || map.general).slice(0, 3);
}

// ─── Error normalizer ─────────────────────────────────────────────────────────

function normalizeError(err) {
  if (err instanceof ClaudeError) return err;

  if (err instanceof ApiError) {
    const codeMap = {
      401: 'AUTH_ERROR',
      403: 'PERMISSION_DENIED',
      429: 'RATE_LIMIT',
      500: 'SERVER_ERROR',
      503: 'OVERLOADED',
    };
    const code = codeMap[err.status] || 'API_ERROR';
    return new ClaudeError(code, err.message, { status: err.status });
  }

  if (!err?.status && err?.message?.toLowerCase().includes('fetch')) {
    return new ClaudeError('NETWORK_ERROR', 'Network error — please check your connection.');
  }

  return new ClaudeError('UNKNOWN_ERROR', err?.message || 'An unexpected error occurred.');
}

export default { sendMessage, streamMessage, chat, checkHealth, generateImage, sendFeedback, ClaudeError };