/**
 * RewardsSummary.jsx
 * Earnings summary on the Chakan Tree dashboard.
 *
 * "Pending earnings", not "Pending payout" — nothing has been paid, and calling
 * an unpaid balance a payout invites a member to ask where their money is. The
 * figure is commission that has been earned and is inside its maturity window.
 *
 * This card stays a summary. The full cash-out experience — available balance,
 * maturity dates, the minimum, destinations, quotes and history — lives at
 * /chakan-tree/payouts, which is where the payout API is called. Calling that
 * API here would mean a gated request on an ungated page.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { DollarSign, Clock, CheckCircle, Wallet, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

export function RewardsSummary({ rewards }) {
  if (!rewards) return null;

  const { totalEarned, pendingPayout, paidOut, currency = 'USD' } = rewards;
  const fmt = (v) => formatCurrency(v || 0, currency);

  const items = [
    {
      icon: DollarSign,
      label: 'Total earned',
      value: fmt(totalEarned),
      color: 'var(--color-tea-green)',
      hint: 'Everything your network has earned you.',
    },
    {
      icon: Clock,
      label: 'Pending earnings',
      value: fmt(pendingPayout),
      color: 'var(--color-sunrise-gold)',
      hint: 'Earned, and maturing until the return window on the order closes.',
    },
    {
      icon: CheckCircle,
      label: 'Paid out',
      value: fmt(paidOut),
      color: 'var(--color-success)',
      hint: 'Settled to your payout destination.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spacing-md)',
            padding: '12px var(--spacing-md)',
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
            <item.icon size={16} color={item.color} style={{ flex: '0 0 auto', marginTop: 2 }} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                color: 'var(--color-text-secondary)',
              }}>
                {item.label}
              </span>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--font-size-caption)',
                lineHeight: 'var(--line-height-caption)',
                color: 'var(--color-text-muted)',
              }}>
                {item.hint}
              </span>
            </span>
          </div>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            color: item.color,
          }}>
            {item.value}
          </span>
        </div>
      ))}

      {/* Route into the full cash-out experience. Available balance, the
          minimum, maturity dates and history all live there. */}
      <Link
        href="/chakan-tree/payouts"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '12px var(--spacing-md)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--font-size-button)',
          fontWeight: 600,
          color: 'var(--color-text-inverse)',
          backgroundColor: 'var(--color-text-primary)',
          border: '1px solid var(--color-text-primary)',
          borderRadius: 'var(--radius-pill)',
          textDecoration: 'none',
        }}
      >
        <Wallet size={15} aria-hidden />
        Withdraw earnings
        <ArrowRight size={15} aria-hidden />
      </Link>
    </div>
  );
}

export default RewardsSummary;
