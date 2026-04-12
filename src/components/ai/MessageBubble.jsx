/**
 * MessageBubble.jsx
 * Renders a single message in the conversation.
 * Handles user, ai, and system message types with distinct visual treatment.
 */

'use client';

import React, { useState } from 'react';
import { RotateCcw, Copy, Check, Trash2 } from 'lucide-react';
import { AIAvatar } from './AIAvatar';
import { StreamingText } from './StreamingText';
import styles from './MessageBubble.module.css';

export function MessageBubble({
  message,
  isLast       = false,
  onRetry      = null,
  onDelete     = null,
  onCopyText   = null,
}) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const { type, content, isStreaming, timestamp } = message;

  // ── System message ─────────────────────────────────────────────────────────
  if (type === 'system') {
    return (
      <div className={styles.systemMessage}>
        <span className={styles.systemText}>{content}</span>
      </div>
    );
  }

  // ── Copy handler ───────────────────────────────────────────────────────────
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopyText?.(content);
    } catch {
      // Fallback: select text
    }
  };

  // ── Format timestamp ───────────────────────────────────────────────────────
  const timeLabel = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  // ── User message ───────────────────────────────────────────────────────────
  if (type === 'user') {
    return (
      <div
        className={styles.userRow}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Action buttons */}
        {hovered && (
          <div className={styles.userActions}>
            <button
              className={styles.actionBtn}
              onClick={handleCopy}
              title="Copy message"
              type="button"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            {onDelete && (
              <button
                className={styles.actionBtn}
                onClick={() => onDelete(message.id)}
                title="Delete message"
                type="button"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}

        <div className={styles.userBubble}>
          <p className={styles.userText}>{content}</p>
        </div>
      </div>
    );
  }

  // ── AI message ─────────────────────────────────────────────────────────────
  return (
    <div
      className={styles.aiRow}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AIAvatar size="sm" isStreaming={isStreaming} />

      <div className={styles.aiContent}>
        <StreamingText
          content={content}
          isStreaming={isStreaming}
          className={styles.aiText}
        />

        {/* Action bar — shown on hover or after streaming */}
        {!isStreaming && (
          <div className={`${styles.aiActions} ${hovered ? styles.aiActionsVisible : ''}`}>
            <span className={styles.timestamp}>{timeLabel}</span>

            <div className={styles.aiActionBtns}>
              <button
                className={styles.actionBtn}
                onClick={handleCopy}
                title="Copy response"
                type="button"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>

              {isLast && onRetry && (
                <button
                  className={styles.actionBtn}
                  onClick={onRetry}
                  title="Regenerate response"
                  type="button"
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;