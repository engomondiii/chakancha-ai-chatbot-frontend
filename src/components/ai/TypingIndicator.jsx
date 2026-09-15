/**
 * TypingIndicator.jsx
 * Shown in place of the AI reply until its first words arrive:
 * the animated Chakancha logo on its own. Screen readers still hear
 * "Chakancha AI is thinking" from LogoLoader.
 */

'use client';

import React from 'react';
import { LogoLoader } from './LogoLoader';
import styles from './MessageBubble.module.css';

export function TypingIndicator() {
  return (
    <div className={styles.aiRow}>
      <LogoLoader size="sm" />
    </div>
  );
}

export default TypingIndicator;
