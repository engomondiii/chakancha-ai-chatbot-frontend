'use client';

import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import styles from './PromptInput.module.css';

export function PromptInput({ onSubmit, placeholder }) {
  const [value,     setValue]     = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const defaultPlaceholder = placeholder || 'What makes Chakancha different?';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={`${styles.inputWrapper} ${isFocused ? styles.focused : ''}`}>

        {/* Sparkle icon — hardcoded colors, no CSS vars */}
        <div className={styles.iconLeft}>
          <Sparkles
            size={20}
            style={{
              color: value.trim() ? '#2D5016' : '#B8C5D6',
              transition: 'color 150ms ease',
              flexShrink: 0,
            }}
          />
        </div>

        {/* Textarea */}
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={defaultPlaceholder}
          className={styles.textarea}
          rows={1}
          maxLength={500}
          aria-label="Ask about Chakancha tea"
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={!value.trim()}
          className={`${styles.submitButton} ${value.trim() ? styles.submitActive : ''}`}
          aria-label="Submit"
        >
          <Send
            size={17}
            style={{
              transform: value.trim() ? 'translateX(1px)' : 'none',
              transition: 'transform 150ms ease',
            }}
          />
        </button>
      </div>

      <p className={styles.helperText}>
        Ask about our teas, origin story, brewing tips, or anything else
      </p>
    </form>
  );
}