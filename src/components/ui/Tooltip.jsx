/**
 * Tooltip.jsx
 * Accessible tooltip component — pure CSS positioning, no JS position calculation.
 * Uses CSS custom properties and the globals.css z-index scale.
 *
 * Usage:
 *   <Tooltip content="Living wage means...">
 *     <button>What is this?</button>
 *   </Tooltip>
 *
 *   <Tooltip content="Delete" placement="bottom">
 *     <IconButton />
 *   </Tooltip>
 */

'use client';

import React, { useState, useId } from 'react';
import styles from './Tooltip.module.css';

/**
 * Tooltip
 *
 * @param {React.ReactNode}       children   - The trigger element
 * @param {string|React.ReactNode} content   - Tooltip text / content
 * @param {'top'|'bottom'|'left'|'right'} placement
 * @param {number}  delayMs   - Show delay in ms (default: 300)
 * @param {boolean} disabled  - Disable the tooltip
 * @param {string}  className - Extra class on the wrapper
 */
export function Tooltip({
  children,
  content,
  placement = 'top',
  delayMs   = 300,
  disabled  = false,
  className = '',
}) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();
  let showTimer = null;

  if (!content || disabled) return <>{children}</>;

  const show = () => {
    showTimer = setTimeout(() => setVisible(true), delayMs);
  };

  const hide = () => {
    clearTimeout(showTimer);
    setVisible(false);
  };

  return (
    <span
      className={`${styles.wrapper} ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {/* Attach aria-describedby to the first child element */}
      {React.Children.map(children, (child, i) =>
        i === 0 && React.isValidElement(child)
          ? React.cloneElement(child, { 'aria-describedby': tooltipId })
          : child
      )}

      {visible && (
        <span
          role="tooltip"
          id={tooltipId}
          className={[styles.tooltip, styles[placement]].join(' ')}
        >
          {content}
          <span className={styles.arrow} aria-hidden="true" />
        </span>
      )}
    </span>
  );
}

export default Tooltip;