/**
 * StreamingText.jsx
 * Renders AI response text as formatted markdown, with a caret at the end of
 * the text while the reply is still streaming in.
 */

'use client';

import React, { useMemo } from 'react';
import styles from './StreamingText.module.css';

// ─── Block parsing ────────────────────────────────────────────────────────────

/**
 * Split the markdown Claude writes into blocks: headings, paragraphs, lists,
 * blockquotes, fenced code and rules. Consecutive text lines form a single
 * paragraph, so a lone newline reads as a line break, not a new paragraph.
 */
function parseBlocks(text) {
  const lines  = text.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let para  = null;
  let list  = null;
  let quote = null;
  let code  = null;

  const closeOpen = () => {
    para  = null;
    list  = null;
    quote = null;
  };

  for (const raw of lines) {
    if (code) {
      if (/^\s*```/.test(raw)) code = null;
      else code.lines.push(raw);
      continue;
    }

    const line = raw.trim();

    if (line.startsWith('```')) {
      closeOpen();
      code = { type: 'code', lines: [] };
      blocks.push(code);
      continue;
    }

    // A blank line ends a paragraph but not a list — Claude often puts
    // blank lines between numbered items.
    if (!line) {
      para  = null;
      quote = null;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      closeOpen();
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      closeOpen();
      blocks.push({ type: 'rule' });
      continue;
    }

    const bullet   = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        para  = null;
        quote = null;
        list  = {
          type:  'list',
          ordered,
          start: ordered ? Number(numbered[1]) : 1,
          items: [],
        };
        blocks.push(list);
      }
      list.items.push(bullet ? bullet[1] : numbered[2]);
      continue;
    }

    if (line.startsWith('>')) {
      if (!quote) {
        para  = null;
        list  = null;
        quote = { type: 'quote', lines: [] };
        blocks.push(quote);
      }
      quote.lines.push(line.replace(/^>\s?/, ''));
      continue;
    }

    // Indented text under a list item continues that item.
    if (list && /^\s{2,}/.test(raw)) {
      list.items[list.items.length - 1] += ` ${line}`;
      continue;
    }

    if (!para) {
      list  = null;
      quote = null;
      para  = { type: 'paragraph', lines: [] };
      blocks.push(para);
    }
    para.lines.push(line);
  }

  return blocks;
}

// ─── Inline formatting ────────────────────────────────────────────────────────

const INLINE_PATTERN =
  /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|\*[^*\s][^*]*\*)/g;

const SAFE_HREF = /^(https?:\/\/|mailto:|\/)/i;

function renderInline(text, keyPrefix) {
  return text
    .split(INLINE_PATTERN)
    .filter(Boolean)
    .map((part, i) => {
      const key = `${keyPrefix}-${i}`;

      if (
        part.length > 4 &&
        ((part.startsWith('**') && part.endsWith('**')) ||
          (part.startsWith('__') && part.endsWith('__')))
      ) {
        return <strong key={key} className={styles.strong}>{part.slice(2, -2)}</strong>;
      }

      if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
        return <code key={key} className={styles.code}>{part.slice(1, -1)}</code>;
      }

      const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (link) {
        const [, label, href] = link;
        if (!SAFE_HREF.test(href)) return label;
        const external = /^https?:\/\//i.test(href);
        return (
          <a
            key={key}
            href={href}
            className={styles.link}
            {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
          >
            {label}
          </a>
        );
      }

      if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
        return <em key={key} className={styles.em}>{part.slice(1, -1)}</em>;
      }

      return part;
    });
}

function renderLines(lines, keyPrefix) {
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {renderInline(line, `${keyPrefix}-${i}`)}
    </React.Fragment>
  ));
}

// ─── Block rendering ──────────────────────────────────────────────────────────

/** `tail` (the streaming caret) is placed at the end of the last block. */
function renderBlocks(blocks, tail) {
  const lastIndex = blocks.length - 1;

  return blocks.map((block, index) => {
    const key   = `b${index}`;
    const caret = index === lastIndex ? tail : null;

    switch (block.type) {
      case 'heading': {
        const Tag = block.level <= 2 ? 'h3' : 'h4';
        return (
          <Tag key={key} className={styles.heading}>
            {renderInline(block.text, key)}
            {caret}
          </Tag>
        );
      }

      case 'list': {
        const Tag = block.ordered ? 'ol' : 'ul';
        return (
          <Tag
            key={key}
            className={block.ordered ? styles.ol : styles.ul}
            start={block.ordered && block.start !== 1 ? block.start : undefined}
          >
            {block.items.map((item, i) => (
              <li key={i}>
                {renderInline(item, `${key}-${i}`)}
                {i === block.items.length - 1 ? caret : null}
              </li>
            ))}
          </Tag>
        );
      }

      case 'quote':
        return (
          <blockquote key={key} className={styles.quote}>
            {renderLines(block.lines, key)}
            {caret}
          </blockquote>
        );

      case 'code':
        return (
          <React.Fragment key={key}>
            <pre className={styles.pre}>
              <code>{block.lines.join('\n')}</code>
            </pre>
            {caret}
          </React.Fragment>
        );

      case 'rule':
        return (
          <React.Fragment key={key}>
            <hr className={styles.rule} />
            {caret}
          </React.Fragment>
        );

      default:
        return (
          <p key={key} className={styles.paragraph}>
            {renderLines(block.lines, key)}
            {caret}
          </p>
        );
    }
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
  const blocks = useMemo(() => parseBlocks(content || ''), [content]);

  const caret = isStreaming
    ? <span className={styles.caret} aria-hidden="true" />
    : null;

  return (
    <div
      className={`${styles.text} ${className}`}
      aria-busy={isStreaming || undefined}
    >
      {renderBlocks(blocks, caret)}
      {blocks.length === 0 && caret}
    </div>
  );
}

export default StreamingText;
