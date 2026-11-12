/**
 * src/components/common/GiftWrapOption.jsx
 *
 * "Include a gift bag", wherever the customer happens to think of it.
 *
 * It says bag rather than wrapping because a bag is what arrives: a carrier
 * the tea is handed over in, not paper folded round it. The two set a
 * customer up for different parcels, and the one who expected the other is
 * disappointed by something that was free.
 *
 * Offered in two places: the basket, and the first step of checkout. Somebody
 * buying a present usually knows it is one while they are still choosing the
 * tea, and the ones who do not should not have to go back a page when it
 * occurs to them later.
 *
 * Two places, one control and one piece of state. Written twice it would have
 * been two checkboxes with one answer between them, and the first time they
 * disagreed -- ticked in the basket, blank at checkout -- the customer would
 * have had to guess which one the warehouse was going to read. The answer
 * lives in the cart store; this is only a way of looking at it.
 *
 * Free, and the price slot says so. A gift bag normally costs money, so
 * leaving it unsaid turns a choice into a hesitation; it reads "Free" where
 * the tea container's row reads "+$30.00".
 */

'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';

import { useStore } from '@/store';

export function GiftWrapOption({ style = {} }) {
  const giftWrapping    = useStore((s) => s.giftWrapping);
  const setGiftWrapping = useStore((s) => s.setGiftWrapping);

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        backgroundColor: 'var(--color-warm-cream)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        ...style,
      }}
    >
      <input
        type="checkbox"
        checked={Boolean(giftWrapping)}
        onChange={(e) => setGiftWrapping(e.target.checked)}
        style={{
          width: 16, height: 16, flexShrink: 0,
          accentColor: 'var(--color-tea-green)', cursor: 'pointer',
        }}
      />

      <ShoppingBag size={16} color="var(--color-muted-olive)" aria-hidden="true" />

      <span style={{
        flex: 1,
        fontFamily: 'var(--font-sans)', fontSize: 14,
        color: 'var(--color-text-primary)',
      }}>
        Include a gift bag
      </span>

      <span style={{
        fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
        color: 'var(--color-muted-olive)',
      }}>
        Free
      </span>
    </label>
  );
}

export default GiftWrapOption;
