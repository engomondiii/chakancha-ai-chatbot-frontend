/**
 * OriginHero.jsx
 * Full-bleed hero for the Origin page with Nandi Hills imagery.
 */
'use client';
import React from 'react';
import { MapPin } from 'lucide-react';
import styles from './OriginHero.module.css';

export function OriginHero() {
  return (
    <div className={styles.hero}>
      <div className={styles.bg} />
      <div className={styles.overlay} />
      <div className={styles.content}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <MapPin size={16} color="var(--color-sunrise-gold)" />
          <span className={styles.eyebrow}>Nandi Hills, Kenya · 2,100m elevation</span>
        </div>
        <h1 className={styles.title}>Where our tea<br /><span className={styles.accent}>begins</span></h1>
        <p className={styles.subtitle}>The story of a place, a people, and a cup of tea.</p>
      </div>
    </div>
  );
}
export default OriginHero;