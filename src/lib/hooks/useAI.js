/**
 * src/lib/hooks/useAI.js — Integration Phase 2
 *
 * What changed from the original:
 *  - productCards and generatedImages added to state reads (from aiSlice)
 *  - sendFeedback added to actions
 *  - showProductSuggestions now also checks productCards from the backend
 *    (not just intent-based detection)
 *  - Everything else unchanged
 */

'use client';

import { useCallback } from 'react';
import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { assessChakanTreeReadiness, shouldShowProductSuggestions } from '@/lib/ai/intentDetection';

// ─── Primary hook ──────────────────────────────────────────────────────────────

export function useAI() {
  const messages                = useStore((s) => s.messages);
  const isStreaming             = useStore((s) => s.isStreaming);
  const currentStreamingMessage  = useStore((s) => s.currentStreamingMessage);
  const currentIntent           = useStore((s) => s.currentIntent);
  const suggestedFollowUps      = useStore((s) => s.suggestedFollowUps);
  const conversationId          = useStore((s) => s.conversationId);
  const error                   = useStore((s) => s.error);
  // Phase 2 additions
  const productCards            = useStore((s) => s.productCards    || []);
  const generatedImages         = useStore((s) => s.generatedImages || {});

  const {
    sendMessage,
    clearConversation,
    retryLastMessage,
    selectFollowUp,
    setConversationId,
    deleteMessage,
    editMessage,
    getConversationContext,
    initFromQuery,
    sendFeedback,
  } = useStore(
    useShallow((s) => ({
      sendMessage:            s.sendMessage,
      clearConversation:      s.clearConversation,
      retryLastMessage:       s.retryLastMessage,
      selectFollowUp:         s.selectFollowUp,
      setConversationId:      s.setConversationId,
      deleteMessage:          s.deleteMessage,
      editMessage:            s.editMessage,
      getConversationContext: s.getConversationContext,
      initFromQuery:          s.initFromQuery,
      sendFeedback:           s.sendFeedback,
    }))
  );

  const hasMessages      = messages.length > 0;
  const lastMessage      = messages[messages.length - 1] ?? null;
  const lastUserMessage  = [...messages].reverse().find((m) => m.type === 'user') ?? null;
  const lastAIMessage    = [...messages].reverse().find((m) => m.type === 'ai') ?? null;
  const userMessageCount = messages.filter((m) => m.type === 'user').length;

  const canRetry = useCallback(
    () => !isStreaming && error !== null,
    [isStreaming, error]
  );

  const getMessageById = useCallback(
    (id) => messages.find((m) => m.id === id) ?? null,
    [messages]
  );

  const getMessagesByType = useCallback(
    (type) => messages.filter((m) => m.type === type),
    [messages]
  );

  const getConversationSummary = useCallback(
    () => ({
      totalMessages:  messages.length,
      userMessages:   messages.filter((m) => m.type === 'user').length,
      aiMessages:     messages.filter((m) => m.type === 'ai').length,
      systemMessages: messages.filter((m) => m.type === 'system').length,
      hasError:       error !== null,
      isActive:       isStreaming,
      conversationId,
    }),
    [messages, error, isStreaming, conversationId]
  );

  const chakanTreeReadiness = useCallback(
    () => assessChakanTreeReadiness(messages, currentIntent),
    [messages, currentIntent]
  );

  // Phase 2: show product suggestions if backend sent product cards OR intent signals it
  const showProductSuggestions =
    productCards.length > 0 ||
    shouldShowProductSuggestions(currentIntent, messages);

  return {
    // State
    messages,
    isStreaming,
    currentStreamingMessage,
    currentIntent,
    suggestedFollowUps,
    conversationId,
    error,
    productCards,
    generatedImages,

    // Computed
    hasMessages,
    lastMessage,
    lastUserMessage,
    lastAIMessage,
    userMessageCount,
    showProductSuggestions,

    // Actions
    sendMessage,
    clearConversation,
    retryLastMessage,
    selectFollowUp,
    setConversationId,
    deleteMessage,
    editMessage,
    initFromQuery,
    sendFeedback,

    // Helpers
    canRetry,
    getMessageById,
    getMessagesByType,
    getConversationContext,
    getConversationSummary,
    chakanTreeReadiness,
  };
}

// ─── Sub-hooks ─────────────────────────────────────────────────────────────────

export function useAIStreaming() {
  return useStore(
    useShallow((s) => ({
      isStreaming:             s.isStreaming,
      currentStreamingMessage: s.currentStreamingMessage,
    }))
  );
}

export function useAIMessages() {
  return useStore((s) => s.messages);
}

export function useAIActions() {
  return useStore(
    useShallow((s) => ({
      sendMessage:       s.sendMessage,
      clearConversation: s.clearConversation,
      retryLastMessage:  s.retryLastMessage,
      selectFollowUp:    s.selectFollowUp,
      initFromQuery:     s.initFromQuery,
      sendFeedback:      s.sendFeedback,
    }))
  );
}

export function useCurrentIntent() {
  return useStore((s) => s.currentIntent);
}

export function useSuggestedFollowUps() {
  return useStore((s) => s.suggestedFollowUps);
}

export function useConversationError() {
  return useStore((s) => s.error);
}

// Phase 2: hook for product cards from backend
export function useProductCards() {
  return useStore((s) => s.productCards || []);
}

export default useAI;