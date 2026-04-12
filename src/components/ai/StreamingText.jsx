/**
 * StreamingText.jsx
 * Renders AI response text with markdown support and a smooth streaming effect.
 * Uses a simple but effective character-by-character reveal via CSS animation stagger.
 */

'use client';

import React, { useMemo } from 'react';

// ─── Lightweight markdown renderer ───────────────────────────────────────────

/**
 * Convert the subset of markdown Claude uses to JSX.
 * Handles: **bold**, *italic*, bullet lists, line breaks, `code`.
 */
function renderMarkdown(text) {
  if (!text) return null;

  // Split into paragraphs / list blocks
  const lines = text.split('\n');
  const elements = [];
  let listBuffer = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`list-${key++}`} style={{ margin: '8px 0 8px 16px', paddingLeft: 0, listStyle: 'disc' }}>
          {listBuffer.map((item, i) => (
            <li key={i} style={{ marginBottom: 4, lineHeight: 1.6 }}>
              {inlineFormat(item)}
            </li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      elements.push(<br key={`br-${key++}`} />);
      continue;
    }

    // Bullet list items
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      listBuffer.push(trimmed.replace(/^[-•]\s/, ''));
      continue;
    }

    // Numbered list items
    if (/^\d+\.\s/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^\d+\.\s/, ''));
      continue;
    }

    flushList();

    elements.push(
      <span key={`line-${key++}`} style={{ display: 'block', lineHeight: 1.7 }}>
        {inlineFormat(trimmed)}
      </span>
    );
  }

  flushList();
  return elements;
}

function inlineFormat(text) {
  if (!text) return null;

  // Split on **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 600, color: 'var(--color-earth-brown)' }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} style={{ fontStyle: 'italic', color: 'var(--color-muted-olive)' }}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          style={{
            fontFamily:      'monospace',
            fontSize:        '0.9em',
            backgroundColor: 'var(--color-warm-cream)',
            padding:         '1px 5px',
            borderRadius:    3,
            color:           'var(--color-tea-green)',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * StreamingText
 * Renders streamed or completed AI message text.
 *
 * @param {string}  content     - Full or partial content to render
 * @param {boolean} isStreaming - Whether content is still arriving
 * @param {string}  className   - Optional CSS class
 */
export function StreamingText({ content = '', isStreaming = false, className = '' }) {
  const rendered = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div
      className={className}
      style={{
        fontSize:   'var(--font-size-body)',
        lineHeight: 1.7,
        color:      'var(--color-text-primary)',
        wordBreak:  'break-word',
      }}
    >
      {rendered}

      {/* Blinking cursor while streaming */}
      {isStreaming && (
        <span
          aria-hidden="true"
          style={{
            display:         'inline-block',
            width:           2,
            height:          '1.1em',
            backgroundColor: 'var(--color-tea-green)',
            marginLeft:      2,
            verticalAlign:   'text-bottom',
            borderRadius:    1,
            animation:       'cursorBlink 0.9s step-end infinite',
          }}
        />
      )}

      <style>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default StreamingText;