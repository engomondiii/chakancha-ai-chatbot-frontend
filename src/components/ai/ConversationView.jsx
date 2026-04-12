/**
 * ConversationView.jsx
 * The complete AI conversation interface for /chat page.
 * Reads ?q= query param, manages message list, input, and suggestion rendering.
 */

'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Leaf, RotateCcw, Trash2, ChevronDown } from 'lucide-react';
import { useAI } from '@/lib/hooks/useAI';
import { useFeaturedProducts } from '@/lib/hooks/useProducts';
import { MessageBubble }   from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { SuggestionCards } from './SuggestionCards';
import { PromptInput }     from '@/components/hero/PromptInput';
import { shouldShowProductSuggestions } from '@/lib/ai/intentDetection';
import styles from './ConversationView.module.css';

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onChipClick }) {
  const chips = [
    { text: 'Find my tea',     prompt: 'Help me find the perfect tea for my taste preferences' },
    { text: 'Origin story',    prompt: 'Tell me about Nandi Hills and where Chakancha tea comes from' },
    { text: 'Living wage',     prompt: 'How does Chakancha ensure living wages for tea pickers?' },
    { text: 'Brewing tips',    prompt: 'What are the best practices for brewing premium tea?' },
    { text: 'What teas?',      prompt: 'What teas do you currently have available?' },
    { text: 'Chakan Tree',     prompt: 'What is the Chakan Tree and how does it work?' },
  ];

  return (
    <div className={styles.emptyState}>
      {/* Logo mark */}
      <div className={styles.emptyMark}>
        <Leaf size={28} color="var(--color-tea-green)" />
      </div>

      <h2 className={styles.emptyTitle}>Ask anything about Chakancha</h2>
      <p className={styles.emptySubtitle}>
        Tea discovery · Origin · Impact · Brewing · Orders
      </p>

      <div className={styles.emptyChips}>
        {chips.map((c) => (
          <button
            key={c.text}
            className={styles.emptyChip}
            onClick={() => onChipClick(c.prompt)}
            type="button"
          >
            {c.text}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Scroll-to-bottom button ──────────────────────────────────────────────────

function ScrollToBottomBtn({ onClick, visible }) {
  return (
    <button
      className={`${styles.scrollBtn} ${visible ? styles.scrollBtnVisible : ''}`}
      onClick={onClick}
      type="button"
      aria-label="Scroll to latest message"
    >
      <ChevronDown size={18} />
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ConversationView() {
  const searchParams = useSearchParams();

  const {
    messages,
    isStreaming,
    currentIntent,
    suggestedFollowUps,
    error,
    hasMessages,
    sendMessage,
    clearConversation,
    retryLastMessage,
    selectFollowUp,
    deleteMessage,
    initFromQuery,
    showProductSuggestions,
  } = useAI();

  const { products: featuredProducts } = useFeaturedProducts(3);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const messagesEndRef    = useRef(null);
  const messagesAreaRef   = useRef(null);
  const hasInitialised    = useRef(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [confirmClear,  setConfirmClear]  = useState(false);

  // ── Initialise from ?q= query param ────────────────────────────────────────
  useEffect(() => {
    if (hasInitialised.current) return;
    hasInitialised.current = true;

    const query = searchParams?.get('q');
    if (query) {
      initFromQuery(decodeURIComponent(query));
    }
  }, [searchParams, initFromQuery]);

  // ── Auto-scroll to bottom ───────────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'instant',
    });
  }, []);

  useEffect(() => {
    if (isStreaming || messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, isStreaming, scrollToBottom]);

  // ── Scroll button visibility ────────────────────────────────────────────────
  useEffect(() => {
    const el = messagesAreaRef.current;
    if (!el) return;

    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 200);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // ── Clear conversation with confirm ────────────────────────────────────────
  const handleClear = () => {
    if (confirmClear) {
      clearConversation();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  // ── Determine if we should show product suggestions ────────────────────────
  const lastAIMessage = [...messages].reverse().find((m) => m.type === 'ai' && !m.isStreaming);
  const showSuggestions =
    lastAIMessage &&
    shouldShowProductSuggestions(currentIntent, messages) &&
    featuredProducts.length > 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Leaf size={16} color="var(--color-tea-green)" />
          <span className={styles.topBarTitle}>Chakancha AI</span>
          {currentIntent && (
            <span className={styles.intentBadge}>{currentIntent}</span>
          )}
        </div>

        {hasMessages && (
          <div className={styles.topBarActions}>
            <button
              className={`${styles.topBtn} ${confirmClear ? styles.topBtnDanger : ''}`}
              onClick={handleClear}
              type="button"
              title={confirmClear ? 'Click again to confirm' : 'Clear conversation'}
            >
              <Trash2 size={14} />
              {confirmClear ? 'Confirm?' : 'Clear'}
            </button>
          </div>
        )}
      </div>

      {/* ── Messages area ────────────────────────────────────────────────── */}
      <div className={styles.messagesArea} ref={messagesAreaRef}>
        {!hasMessages ? (
          <EmptyState onChipClick={sendMessage} />
        ) : (
          <div className={styles.messagesList}>
            {messages.map((msg, idx) => {
              const isLast = idx === messages.length - 1;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isLast={isLast}
                  onRetry={isLast && !isStreaming ? retryLastMessage : null}
                  onDelete={deleteMessage}
                />
              );
            })}

            {/* Typing indicator — shown when waiting for first token */}
            {isStreaming && messages[messages.length - 1]?.content === '' && (
              <TypingIndicator />
            )}

            {/* Product + follow-up suggestions */}
            {showSuggestions && (
              <SuggestionCards
                products={featuredProducts.slice(0, 2)}
                followUps={suggestedFollowUps}
                onFollowUp={selectFollowUp}
              />
            )}

            {/* Error message */}
            {error && !isStreaming && (
              <div className={styles.errorBar}>
                <span className={styles.errorText}>{error}</span>
                <button
                  className={styles.retryBtn}
                  onClick={retryLastMessage}
                  type="button"
                >
                  <RotateCcw size={13} /> Retry
                </button>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} style={{ height: 1 }} />
          </div>
        )}
      </div>

      {/* Scroll-to-bottom FAB */}
      <ScrollToBottomBtn
        visible={showScrollBtn}
        onClick={() => scrollToBottom()}
      />

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <div className={styles.inputBar}>
        <div className={styles.inputWrap}>
          <PromptInput
            onSubmit={sendMessage}
            placeholder="Ask about our teas, origin, impact…"
          />
        </div>
      </div>

    </div>
  );
}

export default ConversationView;