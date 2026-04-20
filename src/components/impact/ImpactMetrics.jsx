/**
 * src/components/impact/ImpactMetrics.jsx — Integration Phase 4
 *
 * What changed from the original:
 *  - Fetches real data from GET /api/v1/content/impact/
 *    (ImpactMetricsView → ImpactMetricSerializer)
 *  - Backend fields: label (the value e.g. "10%"), description (short label),
 *    detail (the longer description text), sort_order
 *  - Falls back to hardcoded METRICS when API unavailable
 *  - Loading skeleton added
 *  - CSS module import kept (styles.grid, styles.card, etc. unchanged)
 */

'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import styles from './ImpactMetrics.module.css';

const FALLBACK_METRICS = [
  { label: '10%', description: 'of revenue to tea pickers',    detail: 'Paid directly, every quarter, on top of living wage.' },
  { label: '5%',  description: 'back to regional community',   detail: 'Funds local schools, clinics, and infrastructure in Nandi Hills.' },
  { label: '3×',  description: 'above Kenya minimum wage',     detail: 'Our pickers earn a true living wage, not just the legal minimum.' },
  { label: '100%',description: 'supply chain transparency',    detail: 'Every payment documented and published annually.' },
];

export function ImpactMetrics() {
  const [metrics,   setMetrics]   = useState(FALLBACK_METRICS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get(ENDPOINTS.CONTENT.IMPACT_METRICS)
      .then((data) => {
        const items = Array.isArray(data) ? data : (data.results || data);
        if (items && items.length > 0) setMetrics(items);
      })
      .catch(() => { /* Use fallback */ })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className={styles.grid}>
        {[1,2,3,4].map((i) => (
          <div key={i} className={styles.card} style={{ animation: 'pulse 1.5s ease-in-out infinite', minHeight: 120 }} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {metrics.map((m) => (
        <div key={m.label || m.id} className={styles.card}>
          {/* value/label field (e.g. "10%") */}
          <p className={styles.value}>{m.label}</p>
          {/* short description */}
          <p className={styles.label}>{m.description}</p>
          {/* detail/explanation */}
          <p className={styles.desc}>{m.detail}</p>
        </div>
      ))}
    </div>
  );
}

export default ImpactMetrics;