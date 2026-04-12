/**
 * ImpactTracker.jsx
 * Shows the participant's personal impact metrics.
 */

'use client';

import React from 'react';
import { Heart, Globe, Leaf, TreePine } from 'lucide-react';

export function ImpactTracker({ impact }) {
  if (!impact) return null;

  const metrics = [
    { icon: Heart,    label: 'Tea pickers supported', value: impact.teaPickersSupported || 0, color: '#D63031' },
    { icon: Globe,    label: 'Community funds generated', value: impact.communityFunds || '$0',  color: '#4A7C2C' },
    { icon: Leaf,     label: 'Total value shared',    value: impact.totalValueShared || '$0',   color: '#2D5016' },
    { icon: TreePine, label: 'Trees symbolically planted', value: impact.treesPlanted || 0,     color: '#8B8C5A' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--spacing-md)' }}>
      {metrics.map((m) => (
        <div key={m.label} style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
          <m.icon size={20} color={m.color} />
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 700, color: 'var(--color-earth-brown)', margin: 0 }}>{m.value}</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>{m.label}</p>
        </div>
      ))}
    </div>
  );
}

export default ImpactTracker;