'use client';
import React from 'react';

export function LivingWageExplainer() {
  return (
    <div style={{ backgroundColor: 'rgba(45,80,22,0.04)', border: '1px solid rgba(45,80,22,0.12)', borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-2xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--color-earth-brown)', margin: 0 }}>What is a living wage?</h3>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
        A living wage is not the legal minimum — it is the amount required for a worker to cover their basic needs, afford decent housing, feed their family, and participate in society with dignity.
      </p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
        In Nandi Hills, the current living wage benchmark is approximately <strong style={{ color: 'var(--color-earth-brown)' }}>KES 28,000/month</strong> for a family of four. Chakancha pays above this threshold — verified by third-party auditors annually.
      </p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
        This is not charity. It is simply honest commerce: when the price you pay reflects the real cost of producing something well, everyone in the chain can live with dignity.
      </p>
    </div>
  );
}
export default LivingWageExplainer;