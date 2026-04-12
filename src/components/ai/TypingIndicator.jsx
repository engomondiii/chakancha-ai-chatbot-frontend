/**
 * TypingIndicator.jsx
 * Three-dot animated typing indicator shown while Claude streams.
 * Uses only CSS — no external animation dependencies.
 */

'use client';

import React from 'react';
import { AIAvatar } from './AIAvatar';

export function TypingIndicator() {
  return (
    <div
      style={{
        display:    'flex',
        alignItems: 'flex-end',
        gap:        'var(--spacing-sm)',
        padding:    '2px 0',
        animation:  'fadeIn 0.2s ease-out',
      }}
      role="status"
      aria-label="Chakancha AI is thinking"
    >
      <AIAvatar size="sm" isStreaming />

      {/* Bubble */}
      <div
        style={{
          display:         'inline-flex',
          alignItems:      'center',
          gap:             6,
          padding:         '12px 18px',
          backgroundColor: 'white',
          border:          '1px solid var(--color-border)',
          borderRadius:    '18px 18px 18px 4px',
          boxShadow:       'var(--shadow-sm)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width:           7,
              height:          7,
              borderRadius:    '50%',
              backgroundColor: 'var(--color-mist-gray)',
              display:         'block',
              animation:       `typingBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0);    opacity: 0.4; }
          30%            { transform: translateY(-6px); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}

export default TypingIndicator;