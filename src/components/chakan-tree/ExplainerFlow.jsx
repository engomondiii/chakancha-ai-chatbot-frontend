/**
 * ExplainerFlow.jsx
 * How Chakan Tree works — 3-step visual explainer for the main page.
 */

'use client';

import React from 'react';
import { Share2, TreePine, Heart } from 'lucide-react';

const STEPS = [
  { icon: TreePine, title: 'Join', color: '#2D5016', desc: 'Create your Chakancha account and activate Chakan Tree to receive your unique referral code.' },
  { icon: Share2,   title: 'Share', color: '#4A7C2C', desc: 'Share your code with friends, family, or your community. Every referral extends the value chain.' },
  { icon: Heart,    title: 'Earn & Give', color: '#D4A574', desc: 'Earn 5% of every referral purchase. A portion flows directly back to Nandi Hills tea pickers.' },
];

export function ExplainerFlow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-xl)' }}>
      {STEPS.map((step, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-xl)', backgroundColor: 'var(--color-warm-cream)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${step.color}40` }}>
            <step.icon size={24} color="white" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted-olive)', margin: '0 0 6px' }}>Step {i + 1}</p>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 8px' }}>{step.title}</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ExplainerFlow;