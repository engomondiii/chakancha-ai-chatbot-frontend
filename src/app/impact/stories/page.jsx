'use client';
import React from 'react';
import { ImpactStories } from '@/components/impact/ImpactStories';

export default function ImpactStoriesPage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h1)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 16px' }}>Community Stories</h1>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: '0 0 var(--spacing-2xl)', maxWidth: 560 }}>Real things that happened in Nandi Hills because of your tea purchase.</p>
      <ImpactStories />
    </div>
  );
}