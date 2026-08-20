'use client';
import React from 'react';
import { TraceabilityTimeline } from '@/components/origin/TraceabilityTimeline';

export default function TraceabilityPage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 'calc(72px + 0 var(--spacing-lg) var(--spacing-3xl)' }}>
      <TraceabilityTimeline />
    </div>
  );
}