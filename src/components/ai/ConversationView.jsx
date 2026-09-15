/**
 * src/components/ai/ConversationView.jsx — Integration Phase 2
 *
 * What changed from the original:
 *  - Uses productCards from aiSlice (backend SSE 'products' event)
 *    instead of useFeaturedProducts() hook for suggestion cards
 *  - SuggestionCards receives both backend productCards and followUps
 *  - Error display improved to show ClaudeError codes from backend
 *  - The waiting animation is rendered by MessageBubble itself
 *  - Streaming replies are followed with instant scroll jumps, and only while
 *    the reader is at the bottom
 */

"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { RotateCcw, Trash2, ChevronDown } from "lucide-react";
import { useAI } from "@/lib/hooks/useAI";
import { MessageBubble } from "./MessageBubble";
import { SuggestionCards } from "./SuggestionCards";
import { PromptInput } from "@/components/hero/PromptInput";
import styles from "./ConversationView.module.css";

const CHAKANCHA_MARK = "/images/icons/chakancha-mark-white.svg";

// How close to the bottom (px) still counts as "reading the latest message".
const STICK_THRESHOLD = 80;

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onChipClick }) {
  const chips = [
    {
      text: "Find my tea",
      prompt: "Help me find the perfect tea for my taste preferences",
    },
    {
      text: "Origin story",
      prompt: "Tell me about Nandi Hills and where Chakancha tea comes from",
    },
    {
      text: "Living wage",
      prompt: "How does Chakancha ensure living wages for tea pickers?",
    },
    {
      text: "Brewing tips",
      prompt: "What are the best practices for brewing premium tea?",
    },
    {
      text: "What teas?",
      prompt: "What teas do you currently have available?",
    },
    {
      text: "Chakan Tree",
      prompt: "What is the Chakan Tree and how does it work?",
    },
  ];

  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyMark}>
        <Image
          src={CHAKANCHA_MARK}
          alt=""
          width={28}
          height={28}
          aria-hidden="true"
        />
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

// ─── Scroll button ────────────────────────────────────────────────────────────

function ScrollToBottomBtn({ onClick, visible }) {
  return (
    <button
      className={`${styles.scrollBtn} ${visible ? styles.scrollBtnVisible : ""}`}
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
    productCards, // Phase 2: from SSE 'products' event
    sendMessage,
    clearConversation,
    retryLastMessage,
    selectFollowUp,
    deleteMessage,
    initFromQuery,
    showProductSuggestions,
  } = useAI();

  const messagesAreaRef = useRef(null);
  const messagesListRef = useRef(null);
  const hasInitialised = useRef(false);
  const stickToBottom = useRef(true);
  const lastMessageCount = useRef(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // ── Init from ?q= ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasInitialised.current) return;
    hasInitialised.current = true;
    const query = searchParams?.get("q");
    if (query) initFromQuery(decodeURIComponent(query));
  }, [searchParams, initFromQuery]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    const el = messagesAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // A new message always brings the view down. While a reply streams in, keep
  // following it unless the reader has scrolled up. Jump instantly: starting
  // a fresh smooth scroll on every update is what made the page drag.
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      stickToBottom.current = true;
    }
    lastMessageCount.current = messages.length;

    if (messages.length > 0 && stickToBottom.current) {
      scrollToBottom(false);
    }
  }, [messages, scrollToBottom]);

  // Replies are revealed gradually between store updates, so also follow the
  // list's height as it grows.
  useEffect(() => {
    const list = messagesListRef.current;
    if (!list || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      if (stickToBottom.current) scrollToBottom(false);
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, [hasMessages, scrollToBottom]);

  // ── Scroll position tracking ───────────────────────────────────────────────
  useEffect(() => {
    const el = messagesAreaRef.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottom.current = distance < STICK_THRESHOLD;
      setShowScrollBtn(distance > 200);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // ── Clear with confirm ─────────────────────────────────────────────────────
  const handleClear = () => {
    if (confirmClear) {
      clearConversation();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  // ── Show suggestion cards ─────────────────────────────────────────────────
  const lastAIMessage = [...messages]
    .reverse()
    .find((m) => m.type === "ai" && !m.isStreaming);
  // Phase 2: show if backend sent product cards OR intent warrants it
  const showSuggestions =
    lastAIMessage && (productCards.length > 0 || showProductSuggestions);

  return (
    <div className={styles.container}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Image
            src={CHAKANCHA_MARK}
            alt=""
            width={16}
            height={16}
            aria-hidden="true"
          />
          <span className={styles.topBarTitle}>Chakancha AI</span>
          {currentIntent && (
            <span className={styles.intentBadge}>{currentIntent}</span>
          )}
        </div>
        {hasMessages && (
          <div className={styles.topBarActions}>
            <button
              className={`${styles.topBtn} ${confirmClear ? styles.topBtnDanger : ""}`}
              onClick={handleClear}
              type="button"
              title={
                confirmClear ? "Click again to confirm" : "Clear conversation"
              }
            >
              <Trash2 size={14} />
              {confirmClear ? "Confirm?" : "Clear"}
            </button>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className={styles.messagesArea} ref={messagesAreaRef}>
        {!hasMessages ? (
          <EmptyState onChipClick={sendMessage} />
        ) : (
          <div className={styles.messagesList} ref={messagesListRef}>
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

            {/* Product + follow-up suggestions */}
            {showSuggestions && (
              <SuggestionCards
                products={productCards}
                followUps={suggestedFollowUps}
                onFollowUp={selectFollowUp}
              />
            )}

            {/* Error bar */}
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
          </div>
        )}
      </div>

      <ScrollToBottomBtn
        visible={showScrollBtn}
        onClick={() => scrollToBottom()}
      />

      {/* Input bar */}
      <div className={styles.inputBar}>
        <div
          className={styles.inputWrap}
          data-loading={isStreaming ? "true" : "false"}
        >
          <PromptInput
            onSubmit={sendMessage}
            placeholder="Ask about our teas, origin, impact…"
            isLoading={isStreaming}
            chat
          />
        </div>
      </div>
    </div>
  );
}

export default ConversationView;
