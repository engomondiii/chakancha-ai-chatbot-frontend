/**
 * src/components/checkout/OrderSummary.jsx — Integration Phase 3
 *
 * What changed from the original:
 *  - Currency: USD (was KES)
 *  - fmt() uses USD formatting
 *  - No tax or shipping row: both are inside the price of the tea
 *  - No delivery estimate: the dates were invented and the carrier was not ours to name
 *  - Everything else unchanged
 */

'use client';

import React        from 'react';
import { Leaf, ShieldCheck } from 'lucide-react';
import { useStore }    from '@/store';
import { formatCurrency } from '@/lib/utils/currency';

export function OrderSummary({ shippingCountry, quote = null, applyCredit = false }) {
  const cartItems     = useStore((s) => s.cartItems);
  const cartSubtotal  = useStore((s) => s.cartSubtotal);
  const cartTotal     = useStore((s) => s.cartTotal);
  const cartDiscount  = useStore((s) => s.cartDiscount);
  const appliedCoupon = useStore((s) => s.appliedCoupon);

  const fmt = (v) => formatCurrency(v, 'USD', 'en-US');

  return (
    <div style={{
      position: 'sticky', top: 'calc(72px + var(--spacing-lg))',
      display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)',
      backgroundColor: 'var(--color-warm-cream)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-xl)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Leaf size={15} color="var(--color-tea-green)" />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600,
          color: 'var(--color-earth-brown)', margin: 0 }}>
          Order Summary
        </h3>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {cartItems.map((item) => (
          <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', overflow: 'hidden',
              backgroundColor: 'white', border: '1px solid var(--color-border)', flexShrink: 0, position: 'relative' }}>
              {item.image ? (
                <img src={item.image} alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: 'linear-gradient(135deg,#e8efe0,#c8ddb8)', fontSize: '1.1rem' }}>
                  🍃
                </div>
              )}
              <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16,
                borderRadius: '50%', backgroundColor: 'var(--color-tea-green)', color: 'white',
                fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-sans)' }}>
                {item.quantity}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                color: 'var(--color-earth-brown)', margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11,
                color: 'var(--color-text-secondary)', margin: 0 }}>
                {item.category} tea
              </p>
            </div>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
              color: 'var(--color-text-primary)', flexShrink: 0 }}>
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div style={{ height: 1, backgroundColor: 'var(--color-border)' }} />

      {/* Totals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* When the backend quote is available it is authoritative: these are
            the exact figures create_order() records and PayPal charges. The
            local estimate is only a fallback before the cart has synced. */}
        <Row label="Subtotal"
             value={fmt(quote ? Number(quote.subtotal) : cartSubtotal)} />
        {(quote ? Number(quote.discount) : cartDiscount) > 0 && (
          <Row
            label={
              quote
                ? (quote.discount_label || 'Discount')
                : `Discount (${appliedCoupon?.code})`
            }
            value={`−${fmt(quote ? Number(quote.discount) : cartDiscount)}`}
            green
          />
        )}
        {/*
          No tax row. Tax is inside the price (utils/constants.py,
          TAX_INCLUDED_IN_PRICE), so the backend quote returns zero and there
          is nothing to show. The row used to read "Est. Tax -- Calculated at
          order", which is the worst of both: it charged nobody anything and
          still told every customer a number was coming.

          If tax is ever charged on top again, this comes back as a row, not as
          a promise in a footnote.
        */}
        <div style={{ height: 1, backgroundColor: 'var(--color-border)', margin: '4px 0' }} />
        <Row label="Total"
             value={fmt(quote ? Number(quote.total) : cartTotal)} bold />

        {/*
          The promise that nothing is added after this point used to be made
          here, in grey, twelve pixels high. It is made in the panel below
          instead -- once, where it can be seen -- rather than twice.
        */}

        {/*
          Credit is shown BELOW the total, not as a discount above it. It does
          not change what the tea cost — it changes who pays for it — and
          folding it into the total would misstate the order's value, which the
          commission and the accounts are both based on.
        */}
        {applyCredit && quote && Number(quote.credit_applicable) > 0 && (
          <>
            <Row label="Chakancha earnings"
                 value={`−${fmt(Number(quote.credit_applicable))}`}
                 green />
            <Row label={Number(quote.card_amount) <= 0 ? 'Left to pay' : 'Card to pay'}
                 value={fmt(Number(quote.card_amount))}
                 bold />
          </>
        )}
      </div>

      {/*
        What the panel is for.

        It held a delivery window and a carrier's name, both of which this page
        was in no position to promise: the dates came from a constant five and
        ten days from whenever the page happened to be open, not from anything
        the warehouse or the carrier had said, and naming DHL committed us to a
        carrier at the last screen before payment.

        The space is better spent on the one thing about this total that is
        certain and that customers most want to be told: nothing is added to
        it. Said plainly here rather than left as a footnote under the figures,
        because an absent shipping row reads as "not calculated yet", which is
        the opposite of what is true.
      */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
        backgroundColor: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <ShieldCheck size={14} color="var(--color-muted-olive)" />
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
          color: 'var(--color-text-primary)', margin: 0 }}>
          No extra charges
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, bold = false, small = false, green = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: small ? 12 : 14,
        color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: small ? 12 : 14,
        fontWeight: bold ? 700 : 500,
        color: green ? 'var(--color-success)' : bold ? 'var(--color-earth-brown)' : 'var(--color-text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

export default OrderSummary;