/**
 * RewardsSummary.jsx
 * Shows earnings summary for the Chakan Tree participant.
 */

'use client';

import React from 'react';
import { DollarSign, Clock, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

export function RewardsSummary({ rewards }) {
  if (!rewards) return null;

  const { totalEarned, pendingPayout, paidOut, currency = 'USD' } = rewards;
  const fmt = (v) => formatCurrency(v || 0, currency);

  const items = [
    { icon: DollarSign,  label: 'Total earned',    value: fmt(totalEarned),   color: 'var(--color-tea-green)' },
    { icon: Clock,       label: 'Pending payout',  value: fmt(pendingPayout), color: 'var(--color-sunrise-gold)' },
    { icon: CheckCircle, label: 'Paid out',         value: fmt(paidOut),       color: 'var(--color-success)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px var(--spacing-md)', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <item.icon size={16} color={item.color} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)' }}>{item.label}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: item.color }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default RewardsSummary;