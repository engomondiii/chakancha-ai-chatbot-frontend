/**
 * src/store/slices/aiSlice.js — Integration Phase 2
 *
 * What changed from the original:
 *  - sendMessage() now calls chat() from claudeClient.js which hits
 *    POST /api/v1/ai/stream/ via SSE — not the Anthropic SDK directly
 *  - onComplete callback handles the new 'products' and 'generatedImage' fields
 *    from the backend response
 *  - generatedImages state added to store product images from the SSE stream
 *  - productCards state added — populated from the 'products' SSE event
 *  - backend message_id stored on AI messages for feedback (thumbs up/down)
 *  - onProducts callback fires before onComplete to immediately show cards
 *  - onImage callback stores the generated image URL inline in the message
 *  - sendFeedback action added — calls POST /api/v1/ai/feedback/
 *  - Streamed tokens are applied at most once per animation frame
 *  - All other actions (clearConversation, retryLastMessage, etc.) unchanged
 */

import { chat, sendFeedback as apiFeedback } from '@/lib/ai/claudeClient';
import {
  createUserMessage,
  createAIMessage,
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
  // Phase 2 additions
  productCards:           [],   // Products from the last 'products' SSE event
  generatedImages:        {},   // { [messageId]: imageUrl } from 'image' SSE event

  // ── sendMessage ─────────────────────────────────────────────────────────────
  /**
   * Send a user message and stream the AI response from the Django backend.
   * Handles all 5 SSE event types: token, products, image, metadata/done, error.
   */
  sendMessage: async (content) => {
    const state = get();
    if (state.isStreaming || !content?.trim()) return;

    const conversationId = state.conversationId || generateConversationId();
    const userMsg        = createUserMessage(content);
    const aiMsg          = createAIMessage('', { isStreaming: true });

    set((s) => ({
      conversationId,
      messages:               [...s.messages, userMsg, aiMsg],
      isStreaming:            true,
      currentStreamingMessage: '',
      error:                  null,
      productCards:           [],
    }));

    // Build history for the backend (exclude the empty placeholder AI message)
    const historyForAPI = trimHistoryToContextWindow(
      get().messages.filter((m) => m.id !== aiMsg.id)
    );

    // Pull cart context from cartSlice if available
    const cartContext = {
      item_count: get().cartItemCount || 0,
      subtotal:   get().cartSubtotal  || 0,
      items:      (get().cartItems    || []).map((i) => ({
        name:     i.name,
        quantity: i.quantity,
        price:    i.price,
      })),
    };

    // Tokens arrive many times a second. Updating the store for each one
    // re-renders the conversation constantly and makes the page drag, so
    // only the latest text is applied, at most once per animation frame.
    const hasAnimationFrame =
      typeof window !== 'undefined' &&
      typeof window.requestAnimationFrame === 'function';
    let pendingText = null;
    let frameId     = null;

    const flushTokens = () => {
      frameId = null;
      if (pendingText === null) return;
      const text  = pendingText;
      pendingText = null;
      set((s) => ({
        currentStreamingMessage: text,
        messages: s.messages.map((m) =>
          m.id === aiMsg.id ? { ...m, content: text } : m
        ),
      }));
    };

    // Drops any queued update and returns its text so a final state can use it.
    const takePendingTokens = () => {
      if (frameId !== null) {
        if (hasAnimationFrame) window.cancelAnimationFrame(frameId);
        else clearTimeout(frameId);
        frameId = null;
      }
      const text  = pendingText;
      pendingText = null;
      return text;
    };

    try {
      await chat(
        content,
        historyForAPI,
        {
          // ── Token arrives ────────────────────────────────────────────────
          onToken: (delta, accumulated) => {
            pendingText = accumulated;
            if (frameId === null) {
              frameId = hasAnimationFrame
                ? window.requestAnimationFrame(flushTokens)
                : setTimeout(flushTokens, 16);
            }
          },

          // ── Product cards from backend ───────────────────────────────────
          onProducts: (products) => {
            set({ productCards: products });
          },

          // ── Generated image from DALL-E 3 ────────────────────────────────
          onImage: (imageUrl) => {
            set((s) => ({
              generatedImages: { ...s.generatedImages, [aiMsg.id]: imageUrl },
              messages: s.messages.map((m) =>
                m.id === aiMsg.id ? { ...m, generatedImage: imageUrl } : m
              ),
            }));
          },

          // ── Stream complete ───────────────────────────────────────────────
          onComplete: ({
            content: finalContent,
            intent,
            followUps,
            products,
            generatedImage,
            message_id: backendMessageId,
          }) => {
            takePendingTokens();

            set((s) => ({
              isStreaming:            false,
              currentStreamingMessage: '',
              currentIntent:          intent,
              suggestedFollowUps:     followUps || [],
              productCards:           products   || s.productCards,
              messages: s.messages.map((m) =>
                m.id === aiMsg.id
                  ? {
                      ...m,
                      content:         finalContent,
                      isStreaming:     false,
                      intent,
                      followUps:       followUps || [],
                      generatedImage:  generatedImage || m.generatedImage || null,
                      backendId:       backendMessageId || null,
                    }
                  : m
              ),
            }));

            // Chakan Tree readiness signal
            const finalMessages = get().messages;
            const readiness     = assessChakanTreeReadiness(finalMessages, intent);
            if (readiness.ready && readiness.layer >= 2) {
              get().setChakanTreeSignal?.(readiness);
            }

            // Persist conversation locally
            saveConversation(conversationId, get().messages);
          },

          // ── Stream error ─────────────────────────────────────────────────
          onError: (err) => {
            const partialText = takePendingTokens();

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
                        partialText ||
                        m.content ||
                        "I'm having trouble right now. Please try again in a moment.",
                    }
                  : m
              ),
            }));
          },
        },
        {
          conversationId,
          cartContext,
          language: 'en',
        }
      );
    } catch (err) {
      takePendingTokens();
      set({
        isStreaming:            false,
        currentStreamingMessage: '',
        error:                  err.message || 'Failed to send message',
      });
    }
  },

  // ── clearConversation ──────────────────────────────────────────────────────
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
      productCards:           [],
      generatedImages:        {},
    });
  },

  // ── retryLastMessage ───────────────────────────────────────────────────────
  retryLastMessage: () => {
    const { messages, isStreaming } = get();
    if (isStreaming) return;

    const lastUserMsg = [...messages].reverse().find((m) => m.type === 'user');
    if (!lastUserMsg) return;

    // Remove the last AI message (failed response)
    const lastAIIndex = messages.length - 1 -
      [...messages].reverse().findIndex((m) => m.type === 'ai');
    const trimmed = messages.filter((_, i) => i !== lastAIIndex);

    set({ messages: trimmed, error: null, productCards: [] });
    get().sendMessage(lastUserMsg.content);
  },

  // ── selectFollowUp ────────────────────────────────────────────────────────
  selectFollowUp: (followUpText) => {
    get().sendMessage(followUpText);
  },

  // ── setConversationId ─────────────────────────────────────────────────────
  setConversationId: (id) => set({ conversationId: id }),

  // ── deleteMessage ─────────────────────────────────────────────────────────
  deleteMessage: (messageId) => {
    set((s) => ({
      messages: s.messages.filter((m) => m.id !== messageId),
    }));
  },

  // ── editMessage ────────────────────────────────────────────────────────────
  editMessage: (messageId, newContent) => {
    const { messages } = get();
    const index = messages.findIndex((m) => m.id === messageId);
    if (index === -1) return;
    const trimmed = messages.slice(0, index);
    set({ messages: trimmed, error: null, productCards: [] });
    get().sendMessage(newContent);
  },

  // ── getConversationContext ─────────────────────────────────────────────────
  getConversationContext: () => {
    const { messages, currentIntent, conversationId } = get();
    return {
      messages,
      currentIntent,
      conversationId,
      messageCount:     messages.length,
      userMessageCount: messages.filter((m) => m.type === 'user').length,
    };
  },

  // ── initFromQuery ──────────────────────────────────────────────────────────
  initFromQuery: (queryText) => {
    const text = queryText?.trim();
    if (!text) return;

    // Shortcut chips and the hero input always ask the AI, even when a
    // conversation is already open: the question becomes the next message.
    // If a reply is still streaming, wait for it (up to a minute) rather than
    // dropping the question.
    const sendWhenIdle = (attemptsLeft) => {
      if (!get().isStreaming) {
        get().sendMessage(text);
      } else if (attemptsLeft > 0) {
        setTimeout(() => sendWhenIdle(attemptsLeft - 1), 250);
      }
    };
    sendWhenIdle(240);
  },

  // ── sendFeedback (Phase 2 addition) ───────────────────────────────────────
  /**
   * Send thumbs up/down to POST /api/v1/ai/feedback/
   * @param {string} messageId - Internal Zustand message id
   * @param {number} rating    - +1 or -1
   * @param {string} [comment]
   */
  sendFeedback: async (messageId, rating, comment = '') => {
    const msg = get().messages.find((m) => m.id === messageId);
    if (!msg?.backendId) return { success: false, error: 'No backend message ID' };

    try {
      await apiFeedback(msg.backendId, rating, comment);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
});

export default createAISlice;
