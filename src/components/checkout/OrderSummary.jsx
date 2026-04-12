/**
 * OrderSummary.jsx
 * Read-only order summary shown in the right panel of checkout.
 * Displays cart items, totals, and estimated delivery.
 */

'use client';

import React from 'react';
import { Leaf, Truck } from 'lucide-react';
import { useStore }    from '@/store';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDeliveryEstimate } from '@/lib/utils/date';

export function OrderSummary({ shippingCountry }) {
  const cartItems    = useStore((s) => s.cartItems);
  const cartSubtotal = useStore((s) => s.cartSubtotal);
  const cartShipping = useStore((s) => s.cartShipping);
  const cartTax      = useStore((s) => s.cartTax);
  const cartTotal    = useStore((s) => s.cartTotal);
  const cartDiscount = useStore((s) => s.cartDiscount);
  const appliedCoupon = useStore((s) => s.appliedCoupon);

  const fmt = (v) => formatCurrency(v, 'KES', 'en-KE');

  return (
    <div
      style={{
        position:       'sticky',
        top:            'calc(72px + var(--spacing-lg))',
        display:        'flex',
        flexDirection:  'column',
        gap:            'var(--spacing-lg)',
        backgroundColor:'var(--color-warm-cream)',
        border:         '1px solid var(--color-border)',
        borderRadius:   'var(--radius-xl)',
        padding:        'var(--spacing-xl)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Leaf size={15} color="var(--color-tea-green)" />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--color-earth-brown)', margin: 0 }}>
          Order Summary
        </h3>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {cartItems.map((item) => (
          <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Image */}
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: 'white', border: '1px solid var(--color-border)', flexShrink: 0, position: 'relative' }}>
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#e8efe0,#c8ddb8)', fontSize: '1.1rem' }}>🍃</div>
              )}
              {/* Qty badge */}
              <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--color-tea-green)', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}>
                {item.quantity}
              </span>
            </div>

            {/* Name + price */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--color-earth-brown)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>
                {item.category} tea
              </p>
            </div>

            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', flexShrink: 0 }}>
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: 'var(--color-border)' }} />

      {/* Totals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Row label="Subtotal"  value={fmt(cartSubtotal)} />
        {cartDiscount > 0 && (
          <Row label={`Discount (${appliedCoupon?.code})`} value={`−${fmt(cartDiscount)}`} green />
        )}
        <Row label="Shipping"  value={cartShipping === 0 ? 'Free' : fmt(cartShipping)} green={cartShipping === 0} />
        <Row label="VAT (16%)" value={fmt(cartTax)} small />
        <div style={{ height: 1, backgroundColor: 'var(--color-border)', margin: '4px 0' }} />
        <Row label="Total"     value={fmt(cartTotal)} bold />
      </div>

      {/* Estimated delivery */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', backgroundColor: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <Truck size={14} color="var(--color-muted-olive)" />
        <div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
            Estimated delivery
          </p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>
            {formatDeliveryEstimate(5, 10)} · DHL International
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold = false, small = false, green = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: small ? 12 : 14, color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: small ? 12 : 14, fontWeight: bold ? 700 : 500, color: green ? 'var(--color-success)' : bold ? 'var(--color-earth-brown)' : 'var(--color-text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

export default OrderSummary;