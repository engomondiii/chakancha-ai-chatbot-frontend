/**
 * src/components/ai/MessageBubble.jsx — Integration Phase 2
 *
 * What changed from the original:
 *  - Renders generatedImage from the SSE 'image' event inline below AI text
 *  - Feedback buttons (thumbs up/down) added to AI messages
 *    calling sendFeedback from aiSlice via useAIActions()
 *  - feedbackState tracks which messages have been rated
 *  - Everything else unchanged
 */

'use client';

import React, { useState } from 'react';
import { RotateCcw, Copy, Check, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { AIAvatar } from './AIAvatar';
import { StreamingText } from './StreamingText';
import { useAIActions } from '@/lib/hooks/useAI';
import styles from './MessageBubble.module.css';

export function MessageBubble({
  message,
  isLast     = false,
  onRetry    = null,
  onDelete   = null,
  onCopyText = null,
}) {
  const [copied,        setCopied]        = useState(false);
  const [hovered,       setHovered]       = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(null); // +1 | -1 | null

  const { sendFeedback } = useAIActions();

  const { type, content, isStreaming, timestamp, generatedImage, backendId } = message;

  // ── System message ─────────────────────────────────────────────────────────
  if (type === 'system') {
    return (
      <div className={styles.systemMessage}>
        <span className={styles.systemText}>{content}</span>
      </div>
    );
  }

  // ── Copy ───────────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopyText?.(content);
    } catch { /* fallback: ignore */ }
  };

  // ── Feedback ───────────────────────────────────────────────────────────────
  const handleFeedback = async (rating) => {
    if (feedbackGiven !== null) return; // Only once per message
    setFeedbackGiven(rating);
    if (sendFeedback) {
      await sendFeedback(message.id, rating);
    }
  };

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
        {hovered && (
          <div className={styles.userActions}>
            <button className={styles.actionBtn} onClick={handleCopy} title="Copy" type="button">
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            {onDelete && (
              <button className={styles.actionBtn} onClick={() => onDelete(message.id)} title="Delete" type="button">
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

        {/* Phase 2: Generated image from DALL-E 3 via 'image' SSE event */}
        {generatedImage && !isStreaming && (
          <div style={{ marginTop: 12 }}>
            <img
              src={generatedImage}
              alt="AI-generated product image"
              style={{
                width:        '100%',
                maxWidth:     320,
                borderRadius: 12,
                border:       '1px solid rgba(45,80,22,0.12)',
                display:      'block',
                objectFit:    'cover',
              }}
              loading="lazy"
            />
          </div>
        )}

        {/* Action bar */}
        {!isStreaming && (
          <div className={`${styles.aiActions} ${hovered ? styles.aiActionsVisible : ''}`}>
            <span className={styles.timestamp}>{timeLabel}</span>

            <div className={styles.aiActionBtns}>
              <button className={styles.actionBtn} onClick={handleCopy} title="Copy" type="button">
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>

              {/* Phase 2: Feedback buttons (only if message has backend ID) */}
              {backendId && (
                <>
                  <button
                    className={`${styles.actionBtn} ${feedbackGiven === 1 ? styles.actionBtnActive : ''}`}
                    onClick={() => handleFeedback(1)}
                    title="Helpful"
                    type="button"
                    disabled={feedbackGiven !== null}
                  >
                    <ThumbsUp size={13} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${feedbackGiven === -1 ? styles.actionBtnActive : ''}`}
                    onClick={() => handleFeedback(-1)}
                    title="Not helpful"
                    type="button"
                    disabled={feedbackGiven !== null}
                  >
                    <ThumbsDown size={13} />
                  </button>
                </>
              )}

              {isLast && onRetry && (
                <button className={styles.actionBtn} onClick={onRetry} title="Regenerate" type="button">
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