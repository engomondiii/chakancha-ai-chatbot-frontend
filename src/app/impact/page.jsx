'use client';
import React from 'react';
import { ImpactMetrics }       from '@/components/impact/ImpactMetrics';
import { ValueChainDiagram }   from '@/components/impact/ValueChainDiagram';
import { LivingWageExplainer } from '@/components/impact/LivingWageExplainer';

export default function ImpactPage() {
  return (
    <div style={{ maxWidth: 'var(--max-width-content)', margin: '0 auto', padding: 'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3xl)' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h1)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 16px' }}>Impact & Living Wage</h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 18, color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0, maxWidth: 640 }}>We believe the price of a cup of tea should reflect its full cost — including what it costs to grow it with dignity.</p>
      </div>
      <ImpactMetrics />
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h2)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 var(--spacing-xl)' }}>Where does your money go?</h2>
        <ValueChainDiagram />
      </div>
      <LivingWageExplainer />
    </div>
  );
}