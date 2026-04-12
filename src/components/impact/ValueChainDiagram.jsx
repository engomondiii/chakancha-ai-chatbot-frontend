'use client';
import React from 'react';

const CHAIN = [
  { label: 'Tea picker', conventional: '3%', chakancha: '38%', color: '#2D5016' },
  { label: 'Estate owner',conventional: '7%',chakancha: '22%', color: '#4A7C2C' },
  { label: 'Exporter',   conventional: '10%',chakancha: '0%',  color: '#8B8C5A' },
  { label: 'Importer',   conventional: '15%',chakancha: '0%',  color: '#B8C5D6' },
  { label: 'Brand/Retailer',conventional:'65%',chakancha: '40%',color: '#D4A574'},
];

export function ValueChainDiagram() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)' }}>Role</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-error)', textAlign: 'center' }}>Conventional</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-tea-green)', textAlign: 'center' }}>Chakancha</span>
      </div>
      {CHAIN.map((row) => (
        <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-primary)' }}>{row.label}</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 700, color: row.conventional === '0%' ? 'var(--color-text-secondary)' : 'var(--color-error)', textAlign: 'center' }}>{row.conventional}</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 700, color: 'var(--color-tea-green)', textAlign: 'center' }}>{row.chakancha}</span>
        </div>
      ))}
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>Approximate % of final retail price. Conventional figures based on published industry research.</p>
    </div>
  );
}
export default ValueChainDiagram;