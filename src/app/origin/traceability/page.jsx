'use client';
import React from 'react';
import { TraceabilityTimeline } from '@/components/origin/TraceabilityTimeline';

export default function TraceabilityPage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h1)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 16px' }}>From Field to Cup</h1>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: '0 0 var(--spacing-2xl)', maxWidth: 600 }}>
        Every Chakancha tea is traceable from the specific estate where it was grown to the moment it reaches you. Here is the journey.
      </p>
      <TraceabilityTimeline />
    </div>
  );
}