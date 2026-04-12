/**
 * AIAvatar.jsx
 * Visual avatar for the Chakancha AI assistant.
 * Renders an inline SVG tea-leaf mark with a subtle pulse when streaming.
 */

'use client';

import React from 'react';

export function AIAvatar({ isStreaming = false, size = 'md' }) {
  const sizeMap = { sm: 28, md: 36, lg: 44 };
  const px = sizeMap[size] || 36;

  return (
    <div
      style={{
        width:           px,
        height:          px,
        borderRadius:    '50%',
        backgroundColor: 'var(--color-tea-green)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        flexShrink:      0,
        boxShadow:       '0 2px 8px rgba(45, 80, 22, 0.25)',
        animation:       isStreaming ? 'aiAvatarPulse 1.8s ease-in-out infinite' : 'none',
        position:        'relative',
      }}
      aria-label="Chakancha AI"
    >
      {/* Tea-leaf inline SVG */}
      <svg
        width={px * 0.52}
        height={px * 0.52}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Leaf shape */}
        <path
          d="M12 3C12 3 7 6.5 7 13C7 19.5 12 22 12 22C12 22 17 19.5 17 13C17 6.5 12 3 12 3Z"
          fill="rgba(255,255,255,0.9)"
        />
        {/* Centre vein */}
        <line
          x1="12" y1="3"
          x2="12" y2="22"
          stroke="rgba(45, 80, 22, 0.4)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        {/* Side veins */}
        <path
          d="M12 8 C10 10 8.5 12 8.5 13"
          stroke="rgba(45, 80, 22, 0.3)"
          strokeWidth="0.8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M12 8 C14 10 15.5 12 15.5 13"
          stroke="rgba(45, 80, 22, 0.3)"
          strokeWidth="0.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Streaming ring */}
      {isStreaming && (
        <div
          style={{
            position:      'absolute',
            inset:         -2,
            borderRadius:  '50%',
            border:        '2px solid var(--color-tea-green-light)',
            animation:     'aiAvatarRing 1.8s ease-in-out infinite',
            opacity:       0,
          }}
        />
      )}

      <style>{`
        @keyframes aiAvatarPulse {
          0%, 100% { box-shadow: 0 2px 8px rgba(45, 80, 22, 0.25); }
          50%       { box-shadow: 0 2px 16px rgba(45, 80, 22, 0.45); }
        }
        @keyframes aiAvatarRing {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0;   }
        }
      `}</style>
    </div>
  );
}

export default AIAvatar;