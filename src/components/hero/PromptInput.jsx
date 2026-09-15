/**
 * src/components/hero/PromptInput.jsx — Integration Phase 2
 *
 * What changed from the original:
 *  - isLoading prop added — disables input and pulses the logo on the submit
 *    button while backend is processing (streaming or search)
 *  - chat prop added — when true, switches from glass-morphism (white text on
 *    dark hero background) to solid white card (dark text on white chat background)
 *    so typed text is visible in the ConversationView input bar
 *  - Everything else unchanged
 */

"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import styles from "./PromptInput.module.css";
import Image from "next/image";

export function PromptInput({
  onSubmit,
  placeholder,
  isLoading = false,
  chat = false,
}) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const defaultPlaceholder = placeholder || "What makes Chakancha different?";
  const isDisabled = isLoading;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || isDisabled) return;
    onSubmit(value.trim());
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div
        className={[
          styles.inputWrapper,
          isFocused ? styles.focused : "",
          isLoading ? styles.loading : "",
          chat ? styles.chatMode : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={styles.iconLeft}>
          <Sparkles
            size={16}
            style={{
              color: chat
                ? value.trim()
                  ? "var(--color-accent-dark-olive)"
                  : "var(--color-accent-muted-gold)"
                : value.trim()
                  ? "#2D5016"
                  : "rgba(255,255,255,0.6)",
              transition: "color 150ms ease",
              flexShrink: 0,
            }}
          />
        </div>

        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isLoading ? "Thinking…" : defaultPlaceholder}
          className={`${styles.textarea} ${chat ? styles.textareaChat : ""}`}
          rows={1}
          maxLength={500}
          disabled={isDisabled}
          aria-label="Ask about Chakancha tea"
        />

        <button
          type="submit"
          disabled={!value.trim() || isDisabled}
          className={[
            styles.submitButton,
            value.trim() && !isDisabled ? styles.submitActive : "",
            chat ? styles.submitChat : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label={isLoading ? "Waiting for a reply" : "Submit"}
        >
          <Image
            src="/images/icons/chakancha-mark-white.svg"
            alt="Chakancha logo"
            width={10}
            height={10}
            style={{
              transform: value.trim() && !isLoading ? "translateX(1px)" : "none",
              transition: "transform 150ms ease",
              animation: isLoading ? "pulse 1.2s ease-in-out infinite" : "none",
            }}
          />
        </button>
      </div>

      {/* Helper text only shown in hero mode, not in chat */}
      {/* {!chat && (
        <p className={styles.helperText}>
          Ask about our teas, origin story, brewing tips, or anything else
        </p>
      )} */}
    </form>
  );
}
