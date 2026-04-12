'use client';

import React from 'react';
import { Leaf, MapPin, Heart, Sparkles } from 'lucide-react';
import styles from './PromptChips.module.css';

/**
 * PromptChips Component - Quick suggestion chips
 *
 * Pill-shaped chips with icons that users can click
 * to quickly start a conversation
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

  const handleChipClick = (chip) => {
    if (onClick) {
      onClick(chip.prompt);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.chips}>
        {chips.map((chip) => {
          const Icon = chip.icon;

          return (
            <button
              key={chip.id}
              onClick={() => handleChipClick(chip)}
              className={styles.chip}
              type="button"
              aria-label={chip.text}
            >
              <Icon size={16} className={styles.icon} />
              <span className={styles.text}>{chip.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}