'use client';

import React from 'react';
import Link from 'next/link';
import { Leaf, MapPin, Heart, Sparkles } from 'lucide-react';
import styles from './PromptChips.module.css';

/**
 * PromptChips Component - Quick suggestion chips
 *
 * Pill-shaped shortcuts that ask the AI a ready-made question.
 *
 * Each chip is a real link to /chat?q=…, so it works even before the page's
 * JavaScript has loaded — on slow connections the hero video used to hold
 * that back for 30 seconds or more, and chips that were buttons did nothing.
 * Once the page is interactive, `onClick` (when given) handles the question.
 */
export function PromptChips({ onClick }) {
  const chips = [
    {
      id: 'find-tea',
      text: 'Find my tea',
      icon: Leaf,
      prompt: 'Help me find the perfect tea for my taste preferences',
    },
    {
      id: 'origin',
      text: 'Learn the story',
      icon: MapPin,
      prompt: 'Tell me about Nandi Hills and where Chakancha tea comes from',
    },
    {
      id: 'impact',
      text: 'Living wage',
      icon: Heart,
      prompt: 'How does Chakancha ensure living wages for tea pickers?',
    },
    {
      id: 'brewing',
      text: 'Brewing tips',
      icon: Sparkles,
      prompt: 'What are the best practices for brewing premium tea?',
    },
  ];

  const handleChipClick = (event, chip) => {
    if (onClick) {
      event.preventDefault();
      onClick(chip.prompt);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.chips}>
        {chips.map((chip) => {
          const Icon = chip.icon;

          return (
            <Link
              key={chip.id}
              href={`/chat?q=${encodeURIComponent(chip.prompt)}`}
              onClick={(event) => handleChipClick(event, chip)}
              className={styles.chip}
              aria-label={chip.text}
              prefetch={false}
            >
              <Icon size={16} className={styles.icon} />
              <span className={styles.text}>{chip.text}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
