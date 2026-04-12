'use client';
import React from 'react';
import { Leaf, Factory, Package, Truck, Coffee } from 'lucide-react';

const STEPS = [
  { icon: Leaf,    title: 'Plucking',    desc: 'Two leaves and a bud — hand-picked by skilled pickers at dawn.' },
  { icon: Factory, title: 'Processing',  desc: 'Withered, rolled, and dried at the estate factory. Never offsite.' },
  { icon: Package, title: 'Packaging',   desc: 'Sealed within 48 hours of processing to lock in freshness.' },
  { icon: Truck,   title: 'Dispatch',    desc: 'DHL collects directly from the estate for international delivery.' },
  { icon: Coffee,  title: 'Your Cup',    desc: 'From field to cup in under 3 weeks.' },
];

export function TraceabilityTimeline() {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 20, top: 24, bottom: 24, width: 2, backgroundColor: 'var(--color-border)', zIndex: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', position: 'relative', zIndex: 1 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'flex-start' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: 'var(--color-tea-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '3px solid white', boxShadow: 'var(--shadow-sm)' }}>
              <s.icon size={18} color="white" />
            </div>
            <div style={{ paddingTop: 8 }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 4px' }}>{s.title}</h4>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default TraceabilityTimeline;