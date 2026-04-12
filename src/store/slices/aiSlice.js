/**
 * aiSlice.js
 * Zustand slice for AI conversation state.
 * Handles messages, streaming, intents, and follow-up suggestions.
 */

import { chat } from '@/lib/ai/claudeClient';
import {
  createUserMessage,
  createAIMessage,
  createSystemMessage,
  generateConversationId,
  trimHistoryToContextWindow,
  saveConversation,
  deleteConversation,
} from '@/lib/ai/conversationManager';
import { assessChakanTreeReadiness } from '@/lib/ai/intentDetection';

export const createAISlice = (set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  messages:               [],
  isStreaming:            false,
  currentStreamingMessage: '',
  currentIntent:          null,
  suggestedFollowUps:     [],
  conversationId:         null,
  error:                  null,

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Send a user message and stream the AI response.
   */
  sendMessage: async (content) => {
    const state = get();
    if (state.isStreaming || !content?.trim()) return;

    // Ensure we have a conversation ID
    const conversationId = state.conversationId || generateConversationId();

    // Create user message
    const userMsg = createUserMessage(content);

    // Create a placeholder AI message (will be updated as tokens arrive)
    const aiMsg = createAIMessage('', { isStreaming: true });

    set((s) => ({
      conversationId,
      messages:               [...s.messages, userMsg, aiMsg],
      isStreaming:            true,
      currentStreamingMessage: '',
      error:                  null,
    }));

    // Build history (exclude the empty placeholder)
    const historyForAPI = trimHistoryToContextWindow(
      get().messages.filter((m) => m.id !== aiMsg.id)
    );

    try {
      await chat(
        content,
        historyForAPI,
        {
          // Called for each streaming token
          onToken: (delta, accumulated) => {
            set((s) => ({
              currentStreamingMessage: accumulated,
              messages: s.messages.map((m) =>
                m.id === aiMsg.id ? { ...m, content: accumulated } : m
              ),
            }));
          },

          // Called when streaming completes
          onComplete: ({ content: finalContent, intent, followUps }) => {
            set((s) => ({
              isStreaming:            false,
              currentStreamingMessage: '',
              currentIntent:          intent,
              suggestedFollowUps:     followUps || [],
              messages: s.messages.map((m) =>
                m.id === aiMsg.id
                  ? { ...m, content: finalContent, isStreaming: false, intent, followUps }
                  : m
              ),
            }));

            // Check Chakan Tree readiness and surface in uiSlice if ready
            const finalMessages = get().messages;
            const readiness     = assessChakanTreeReadiness(finalMessages, intent);
            if (readiness.ready && readiness.layer >= 2) {
              get().setChakanTreeSignal?.(readiness);
            }

            // Persist conversation
            saveConversation(conversationId, get().messages);
          },

          // Called on streaming error
          onError: (err) => {
            set((s) => ({
              isStreaming:            false,
              currentStreamingMessage: '',
              error:                  err.message || 'An error occurred',
              messages: s.messages.map((m) =>
                m.id === aiMsg.id
                  ? {
                      ...m,
                      isStreaming: false,
                      content:
                        m.content ||
                        'I apologize — something went wrong. Please try again.',
                    }
                  : m
              ),
            }));
          },
        },
        { conversationId }
      );
    } catch (err) {
      set({
        isStreaming:            false,
        currentStreamingMessage: '',
        error:                  err.message || 'Failed to send message',
      });
    }
  },

  /**
   * Clear all messages and start fresh.
   */
  clearConversation: () => {
    const { conversationId } = get();
    if (conversationId) deleteConversation(conversationId);

    set({
      messages:               [],
      isStreaming:            false,
      currentStreamingMessage: '',
      currentIntent:          null,
      suggestedFollowUps:     [],
      conversationId:         null,
      error:                  null,
    });
  },

  /**
   * Retry the last failed/empty AI message.
   */
  retryLastMessage: () => {
    const { messages, isStreaming } = get();
    if (isStreaming) return;

    const lastUserMsg = [...messages].reverse().find((m) => m.type === 'user');
    if (!lastUserMsg) return;

    // Remove the failed AI response (last ai message)
    const lastAIIndex = messages.length - 1 - [...messages].reverse().findIndex((m) => m.type === 'ai');
    const trimmed = messages.filter((_, i) => i !== lastAIIndex);

    set({ messages: trimmed, error: null });
    get().sendMessage(lastUserMsg.content);
  },

  /**
   * Use a suggested follow-up question.
   */
  selectFollowUp: (followUpText) => {
    get().sendMessage(followUpText);
  },

  /**
   * Set conversation ID (used when restoring a saved conversation).
   */
  setConversationId: (id) => set({ conversationId: id }),

  /**
   * Delete a specific message by ID.
   */
  deleteMessage: (messageId) => {
    set((s) => ({
      messages: s.messages.filter((m) => m.id !== messageId),
    }));
  },

  /**
   * Edit a user message content (clears subsequent messages).
   */
  editMessage: (messageId, newContent) => {
    const { messages } = get();
    const index = messages.findIndex((m) => m.id === messageId);
    if (index === -1) return;

    // Keep messages up to and including the edited one, then resend
    const trimmed = messages.slice(0, index);
    set({ messages: trimmed, error: null });
    get().sendMessage(newContent);
  },

  /**
   * Get structured context from current conversation (used by prompts.js).
   */
  getConversationContext: () => {
    const { messages, currentIntent, conversationId } = get();
    return {
      messages,
      currentIntent,
      conversationId,
      messageCount:    messages.length,
      userMessageCount: messages.filter((m) => m.type === 'user').length,
    };
  },

  /**
   * Pre-populate a message from the ?q= query param (used by chat/page.jsx).
   */
  initFromQuery: (queryText) => {
    if (!queryText?.trim()) return;
    const { messages } = get();
    if (messages.length > 0) return; // Don't override existing conversation
    get().sendMessage(queryText.trim());
  },
});

export default createAISlice;