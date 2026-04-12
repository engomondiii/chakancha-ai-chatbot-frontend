'use client';
import React from 'react';

const STORIES = [
  { name: 'Achieng W.', years: 14, quote: 'I have been picking tea since my mother taught me. With Chakancha\'s living wage, my children go to school without worry.', role: 'Senior picker · Kapsabet Estate' },
  { name: 'Kipchoge M.', years: 8, quote: 'The quality standards here mean we take pride in every leaf. We are not just workers — we are part of the product.', role: 'Quality picker · Chemase Estate' },
  { name: 'Wanjiru N.',  years: 22, quote: 'Twenty-two years in these hills. I have watched the tea change buyers and models. Chakancha is the first that actually shows us the numbers.', role: 'Lead picker · Tindiret Estate' },
];

export function TeaPickerStories() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0 }}>
        Shared with permission. Names used with consent.
      </p>
      {STORIES.map((s) => (
        <div key={s.name} style={{ borderLeft: '3px solid var(--color-tea-green)', paddingLeft: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <blockquote style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontStyle: 'italic', color: 'var(--color-earth-brown)', margin: 0, lineHeight: 1.6 }}>
            "{s.quote}"
          </blockquote>
          <div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{s.name}</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>{s.role} · {s.years} years experience</p>
          </div>
        </div>
      ))}
    </div>
  );
}
export default TeaPickerStories;