'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BackgroundAnimation } from './BackgroundAnimation';
import { PromptInput } from './PromptInput';
import { PromptChips } from './PromptChips';
import styles from './HeroSection.module.css';

export function HeroSection() {
  const router = useRouter();

  const handlePromptSubmit = (prompt) => {
    if (!prompt?.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(prompt.trim())}`);
  };

  return (
    <section className={styles.hero}>
      {/* Full-bleed Nandi Hills background slideshow */}
      <BackgroundAnimation />

      {/* Dark overlay for text readability */}
      <div className={styles.overlay} />

      {/* Hero Content */}
      <div className={styles.content}>
        <div className={styles.contentInner}>

          {/* Eyebrow label */}
          <p className={styles.eyebrow}>Single-origin · Nandi Hills, Kenya</p>

          {/* Main headline */}
          <h1 className={styles.headline}>
            From the tea fields of<br />
            <span className={styles.headlineAccent}>Nandi Hills</span>{' '}
            to your cup.
          </h1>
          <p className={styles.subheadline}>Ask anything.</p>

          {/* AI Prompt Input */}
          <div className={styles.promptWrapper}>
            <PromptInput onSubmit={handlePromptSubmit} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className={styles.chipsWrapper}>
            <PromptChips onClick={handlePromptSubmit} />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollIndicator}>
        <div className={styles.scrollLine} />
      </div>
    </section>
  );
}