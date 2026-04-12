'use client';
import React from 'react';
import { Mountain, Thermometer, Droplets, Award } from 'lucide-react';

const ESTATE_FACTS = [
  { icon: Mountain,    label: 'Elevation',     value: '1,900–2,300m', desc: 'High altitude — slower growth, deeper flavour.' },
  { icon: Thermometer, label: 'Climate',        value: '16–24°C',      desc: 'Cool equatorial climate with two rainy seasons.' },
  { icon: Droplets,    label: 'Annual rainfall',value: '1,800mm',      desc: 'Rich, consistent rainfall feeds the roots.' },
  { icon: Award,       label: 'Certification', value: 'Food-safe',     desc: 'All processing meets international food hygiene standards.' },
];

export function EstateInfo() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
      {ESTATE_FACTS.map((f) => (
        <div key={f.label} style={{ backgroundColor: 'var(--color-warm-cream)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <f.icon size={20} color="var(--color-tea-green)" />
          <div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-olive)', margin: '0 0 4px' }}>{f.label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 4px' }}>{f.value}</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
export default EstateInfo;