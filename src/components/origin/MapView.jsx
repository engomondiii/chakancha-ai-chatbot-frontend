'use client';
import React from 'react';
import { MapPin } from 'lucide-react';

export function MapView() {
  return (
    <div style={{ backgroundColor: 'var(--color-warm-cream)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', position: 'relative', aspectRatio: '16/7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <MapPin size={32} color="var(--color-tea-green)" />
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--color-earth-brown)', margin: 0 }}>Nandi Hills, Kenya</p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>0°21′N, 35°11′E · Rift Valley Province</p>
        <a href="https://maps.google.com/?q=Nandi+Hills+Kenya" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-tea-green)', textDecoration: 'underline' }}>View on Google Maps →</a>
      </div>
    </div>
  );
}
export default MapView;