'use client';
import React from 'react';
import styles from './ImpactMetrics.module.css';

const METRICS = [
  { value: '10%', label: 'of revenue to tea pickers',    desc: 'Paid directly, every quarter, on top of living wage.' },
  { value: '5%',  label: 'back to regional community',   desc: 'Funds local schools, clinics, and infrastructure in Nandi Hills.' },
  { value: '3×',  label: 'above Kenya minimum wage',     desc: 'Our pickers earn a true living wage, not just the legal minimum.' },
  { value: '100%',label: 'supply chain transparency',    desc: 'Every payment documented and published annually.' },
];

export function ImpactMetrics() {
  return (
    <div className={styles.grid}>
      {METRICS.map((m) => (
        <div key={m.label} className={styles.card}>
          <p className={styles.value}>{m.value}</p>
          <p className={styles.label}>{m.label}</p>
          <p className={styles.desc}>{m.desc}</p>
        </div>
      ))}
    </div>
  );
}
export default ImpactMetrics;