/**
 * src/lib/ai/conversationManager.js — Integration Phase 2
 *
 * What changed from the original:
 *  - getSessionId() imported and used in createUserMessage() metadata
 *    so every message carries the session_id for the backend
 *  - saveConversation() now also stores the backend session_id mapping
 *  - loadConversation() restores the session_id from storage
 *  - Everything else unchanged — the context building and history trimming
 *    logic remains identical
 */

import { nanoid } from 'nanoid';
import { getSessionId } from '@/lib/api/client';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHARS_PER_TOKEN        = 4;
const MAX_CONTEXT_TOKENS     = 80_000;
const SYSTEM_PROMPT_TOKENS   = 1_500;
const RESPONSE_BUFFER_TOKENS = 1_500;
const MAX_HISTORY_TOKENS     =
  MAX_CONTEXT_TOKENS - SYSTEM_PROMPT_TOKENS - RESPONSE_BUFFER_TOKENS;

// ─── ID generators ────────────────────────────────────────────────────────────

export function generateConversationId() {
  return `conv_${nanoid(12)}`;
}

export function generateMessageId() {
  return `msg_${nanoid(10)}`;
}

// ─── Message factories ────────────────────────────────────────────────────────

/**
 * Create a user message.
 * Attaches the current session_id for backend correlation.
 */
export function createUserMessage(content, metadata = {}) {
  return {
    id:        generateMessageId(),
    type:      'user',
    content:   content.trim(),
    timestamp: Date.now(),
    session_id: getSessionId(), // ← Phase 2 addition
    ...metadata,
  };
}

/**
 * Create an AI message placeholder (filled as tokens stream in).
 */
export function createAIMessage(content = '', metadata = {}) {
  return {
    id:             generateMessageId(),
    type:           'ai',
    content,
    timestamp:      Date.now(),
    isStreaming:    false,
    intent:         null,
    followUps:      [],
    generatedImage: null,  // ← Phase 2 addition (from 'image' SSE event)
    backendId:      null,  // ← Phase 2 addition (backend DB message id for feedback)
    ...metadata,
  };
}

/**
 * Create a system/status message.
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

export function buildConversationContext(messages) {
  if (!messages || messages.length === 0) {
    return { isEmpty: true, topics: [], lastIntent: null, messageCount: 0 };
  }

  const userMessages = messages.filter((m) => m.type === 'user');
  const aiMessages   = messages.filter((m) => m.type === 'ai');

  const intentHistory = aiMessages
    .map((m) => m.intent)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  const lastIntent   = intentHistory[intentHistory.length - 1] || null;
  const firstMessage = userMessages[0]?.content || '';

  const chakanTreeMentioned = messages.some(
    (m) => m.content && m.content.toLowerCase().includes('chakan tree')
  );

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
    // Phase 2 addition: pass session_id for backend reference
    session_id:           getSessionId(),
  };
}

// ─── History trimmer ──────────────────────────────────────────────────────────

export function trimHistoryToContextWindow(messages) {
  if (!messages || messages.length === 0) return [];

  const eligible = messages.filter((m) => m.type === 'user' || m.type === 'ai');
  if (eligible.length === 0) return [];

  const totalChars  = eligible.reduce((sum, m) => sum + (m.content?.length || 0), 0);
  const totalTokens = Math.ceil(totalChars / CHARS_PER_TOKEN);

  if (totalTokens <= MAX_HISTORY_TOKENS) return eligible;

  const tokenBudget = MAX_HISTORY_TOKENS * CHARS_PER_TOKEN;
  const first       = eligible.slice(0, 2);
  const rest        = eligible.slice(2);

  let accumulated = first.reduce((sum, m) => sum + (m.content?.length || 0), 0);
  const kept = [...first];

  for (let i = rest.length - 1; i >= 0; i--) {
    const msgLen = rest[i].content?.length || 0;
    if (accumulated + msgLen > tokenBudget) break;
    accumulated += msgLen;
    kept.splice(2, 0, rest[i]);
  }

  return kept;
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'chakancha_conv_';

export function saveConversation(conversationId, messages) {
  if (typeof window === 'undefined') return;
  try {
    const toSave = messages
      .filter((m) => m.type !== 'system')
      .map(({ id, type, content, timestamp, intent, followUps, backendId, generatedImage }) => ({
        id,
        type,
        content,
        timestamp,
        intent,
        followUps,
        backendId,        // Phase 2: persist backend id for feedback
        generatedImage,   // Phase 2: persist generated image URL
      }));

    window.localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${conversationId}`,
      JSON.stringify({
        id:         conversationId,
        session_id: getSessionId(), // Phase 2: persist session mapping
        messages:   toSave,
        savedAt:    Date.now(),
      })
    );
  } catch {
    // Storage quota — fail silently
  }
}

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

export function deleteConversation(conversationId) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(`${STORAGE_KEY_PREFIX}${conversationId}`);
  } catch { /* ignore */ }
}

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