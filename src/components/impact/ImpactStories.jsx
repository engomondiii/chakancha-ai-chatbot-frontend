'use client';
import React from 'react';

const STORIES = [
  { title: 'A classroom built', body: 'Revenue from Q3 2024 funded construction of a new classroom at Kapsabet Primary School, benefiting 240 children.', tag: 'Education' },
  { title: 'Clean water access', body: 'Community fund contribution in 2023 helped extend a borehole pipeline to 3 additional homesteads near Chemase Estate.', tag: 'Infrastructure' },
  { title: 'Healthcare access', body: 'Quarterly community funds contributed to mobile clinic visits across 4 tea-picking families during the 2024 dry season.', tag: 'Health' },
];

export function ImpactStories() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {STORIES.map((s) => (
        <div key={s.title} style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--color-earth-brown)', margin: 0 }}>{s.title}</h4>
            <span style={{ backgroundColor: 'rgba(45,80,22,0.08)', color: 'var(--color-tea-green)', border: '1px solid rgba(45,80,22,0.15)', borderRadius: 'var(--radius-pill)', padding: '3px 10px', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.tag}</span>
          </div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>{s.body}</p>
        </div>
      ))}
    </div>
  );
}
export default ImpactStories;