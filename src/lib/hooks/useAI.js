/**
 * useAI.js
 * Custom hook for AI conversation functionality.
 * Fully wired to the Zustand store created in Phase 2.
 * Replaces the Phase 1 stub that referenced @/store before it existed.
 */

'use client';

import { useCallback } from 'react';
import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { assessChakanTreeReadiness, shouldShowProductSuggestions } from '@/lib/ai/intentDetection';

// ─── Primary hook ──────────────────────────────────────────────────────────────

/**
 * useAI
 * Full-featured hook for the AI conversation.
 * Provides state, actions, computed values, and UI helpers.
 */
export function useAI() {
  // ── State (individual selectors — always stable references) ──────────────
  const messages               = useStore((s) => s.messages);
  const isStreaming            = useStore((s) => s.isStreaming);
  const currentStreamingMessage = useStore((s) => s.currentStreamingMessage);
  const currentIntent          = useStore((s) => s.currentIntent);
  const suggestedFollowUps     = useStore((s) => s.suggestedFollowUps);
  const conversationId         = useStore((s) => s.conversationId);
  const error                  = useStore((s) => s.error);

  // ── Actions (grouped with useShallow — prevents new object each render) ──
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
    }))
  );

  // ── Computed values ────────────────────────────────────────────────────────
  const hasMessages      = messages.length > 0;
  const lastMessage      = messages[messages.length - 1] ?? null;
  const lastUserMessage  = [...messages].reverse().find((m) => m.type === 'user') ?? null;
  const lastAIMessage    = [...messages].reverse().find((m) => m.type === 'ai') ?? null;
  const userMessageCount = messages.filter((m) => m.type === 'user').length;

  // ── Helper callbacks ───────────────────────────────────────────────────────

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

  // ── Chakan Tree readiness (computed from intent history) ──────────────────
  const chakanTreeReadiness = useCallback(
    () => assessChakanTreeReadiness(messages, currentIntent),
    [messages, currentIntent]
  );

  // ── Product suggestion visibility ─────────────────────────────────────────
  const showProductSuggestions = shouldShowProductSuggestions(
    currentIntent,
    messages
  );

  return {
    // State
    messages,
    isStreaming,
    currentStreamingMessage,
    currentIntent,
    suggestedFollowUps,
    conversationId,
    error,

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

    // Helpers
    canRetry,
    getMessageById,
    getMessagesByType,
    getConversationContext,
    getConversationSummary,
    chakanTreeReadiness,
  };
}

// ─── Focused sub-hooks ─────────────────────────────────────────────────────────

/**
 * useAIStreaming — streaming state only.
 * Use in StreamingText and TypingIndicator to minimise re-renders.
 */
export function useAIStreaming() {
  return useStore(
    useShallow((s) => ({
      isStreaming:             s.isStreaming,
      currentStreamingMessage: s.currentStreamingMessage,
    }))
  );
}

/**
 * useAIMessages — message array only.
 */
export function useAIMessages() {
  return useStore((s) => s.messages);
}

/**
 * useAIActions — actions only (zero re-renders from state changes).
 */
export function useAIActions() {
  return useStore(
    useShallow((s) => ({
      sendMessage:       s.sendMessage,
      clearConversation: s.clearConversation,
      retryLastMessage:  s.retryLastMessage,
      selectFollowUp:    s.selectFollowUp,
      initFromQuery:     s.initFromQuery,
    }))
  );
}

/**
 * useCurrentIntent — current detected intent only.
 */
export function useCurrentIntent() {
  return useStore((s) => s.currentIntent);
}

/**
 * useSuggestedFollowUps — follow-up questions only.
 */
export function useSuggestedFollowUps() {
  return useStore((s) => s.suggestedFollowUps);
}

/**
 * useConversationError — error state only.
 */
export function useConversationError() {
  return useStore((s) => s.error);
}

export default useAI;