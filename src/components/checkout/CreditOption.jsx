'use client';

/**
 * src/components/checkout/CreditOption.jsx
 *
 * "Use my Chakancha earnings on this order."
 *
 * Why this is on the checkout at all: Wise cannot hold money for members in
 * several of the countries Chakancha sells into, so some members have earnings
 * they are unable to withdraw. Spending them here is the way that money
 * reaches them. Withdrawal is untouched — a member who can cash out still
 * cashes out, and this is a second door, not a replacement.
 *
 * The figures shown are the server's. The browser never works out how much
 * credit applies: it asks, it shows the answer, and it sends yes or no. A
 * client that computed its own discount would be a client that could choose
 * its own price.
 */

import React, { useEffect, useState } from 'react';
import { Wallet, Check } from 'lucide-react';
import { getStoreCredit } from '@/lib/api/payouts';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

export function CreditOption({ quote, applyCredit, onChange, disabled = false }) {
  const [credit, setCredit]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getStoreCredit()
      .then((data) => { if (alive) setCredit(data); })
      .catch(() => { /* No credit shown is the right failure: never block checkout. */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // Nothing to offer: not a member, or nothing earned yet. Say nothing at all
  // rather than show an empty balance, which only puzzles a first-time buyer.
  if (loading || !credit?.is_member || Number(credit.available) <= 0) return null;

  //
  // What would actually come off this order. The checkout quote knows it
  // (the server worked it out against the real total); the raw balance is the
  // fallback for a quote that has not arrived yet.
  //
  const applicable = quote?.credit_applicable ?? credit.available;
  const cardAmount = quote?.card_amount;
  const heldBack   = Boolean(quote?.credit_held_back);

  return (
    <div
      style={{
        padding:      'var(--spacing-md)',
        border:       `1.5px solid ${applyCredit ? 'var(--color-tea-green)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-md)',
        background:   applyCredit ? 'rgba(45,80,22,0.05)' : 'white',
        transition:   'all var(--transition-fast)',
      }}
    >
      <label
        style={{
          display:    'flex',
          alignItems: 'flex-start',
          gap:        'var(--spacing-sm)',
          cursor:     disabled ? 'default' : 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={applyCredit}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          style={{ marginTop: 3, width: 16, height: 16, accentColor: 'var(--color-tea-green)' }}
        />
        <span style={{ flex: 1 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14 }}>
            <Wallet size={15} color="var(--color-tea-green)" />
            Use my Chakancha earnings
          </span>

          <span style={{ display: 'block', marginTop: 4, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            You have <strong>{money(credit.available)}</strong> available.
            {' '}
            {applyCredit
              ? <>We&apos;ll put {money(applicable)} towards this order.</>
              : <>Apply it and pay the rest by card.</>}
          </span>

          {applyCredit && cardAmount != null && (
            <span style={{ display: 'block', marginTop: 6, fontSize: 13, color: 'var(--color-tea-green)' }}>
              <Check size={12} style={{ verticalAlign: -1 }} />
              {' '}
              {Number(cardAmount) <= 0
                ? 'Your earnings cover this order in full — no card needed.'
                : <>Card to pay: <strong>{money(cardAmount)}</strong></>}
            </span>
          )}

          {applyCredit && heldBack && (
            //
            // The card minimum, explained in the one place a customer could
            // otherwise be baffled: they elected to use their credit and a few
            // cents of it stayed behind. Saying why is cheaper than a support
            // email.
            //
            <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: 'var(--color-text-muted)' }}>
              A card payment has to be at least $0.50, so a little of your
              credit stays in your balance for next time.
            </span>
          )}
        </span>
      </label>
    </div>
  );
}

export default CreditOption;
