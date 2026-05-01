'use client';

/**
 * src/components/checkout/PaymentForm.jsx
 *
 * What changed from the previous version:
 *  - Card method now uses StripeCardInput (<CardElement />) instead of
 *    raw card number / expiry / CVV inputs — this is PCI compliant.
 *    Stripe's hosted iframe handles the card data; it never touches your JS.
 *  - validatePayment() in CheckoutForm.jsx must now check for cardName only
 *    (Stripe's CardElement validates the card number / expiry / CVV internally
 *    and returns errors through stripe.confirmCardPayment()).
 *  - cardFocused state added for the Stripe CardElement focus ring.
 *  - PayPal and KG Inicis sections unchanged.
 *  - Apostrophe syntax error in security note fixed (double-quoted string).
 */

import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Input }          from '@/components/ui/Input';
import { StripeCardInput } from './StripeCardInput';

export function PaymentForm({ data, onChange, errors = {} }) {
  const [method,      setMethod]      = useState(data.method || 'card');
  const [cardFocused, setCardFocused] = useState(false);

  const update = (key, val) => onChange({ ...data, method, [key]: val });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <h3 style={sectionTitle}>Payment</h3>

      {/* ── Method selector ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        {[
          { id: 'card',     label: '💳 Card (Visa / MC / Amex)' },
          { id: 'paypal',   label: '🅿️ PayPal'                  },
          { id: 'kginicis', label: 'KG Inicis (Korean)'         },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => { setMethod(m.id); onChange({ ...data, method: m.id }); }}
            style={{
              flex:            1,
              padding:         '10px',
              fontFamily:      'var(--font-sans)',
              fontSize:        13,
              fontWeight:      method === m.id ? 600 : 400,
              color:           method === m.id ? 'var(--color-tea-green)' : 'var(--color-text-secondary)',
              backgroundColor: method === m.id ? 'rgba(45,80,22,0.07)' : 'white',
              border:          `1.5px solid ${method === m.id ? 'var(--color-tea-green)' : 'var(--color-border)'}`,
              borderRadius:    'var(--radius-md)',
              cursor:          'pointer',
              transition:      'all var(--transition-fast)',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Card (Stripe Elements) ────────────────────────────────────────── */}
      {method === 'card' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>

          {/* Accepted cards */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {['Visa', 'Mastercard', 'Amex', 'Discover', 'Diners'].map((brand) => (
              <span
                key={brand}
                style={{
                  backgroundColor: 'var(--color-warm-cream)',
                  border:          '1px solid var(--color-border)',
                  borderRadius:    4,
                  padding:         '2px 8px',
                  fontFamily:      'var(--font-sans)',
                  fontSize:        11,
                  fontWeight:      600,
                  color:           'var(--color-text-secondary)',
                }}
              >
                {brand}
              </span>
            ))}
          </div>

          {/* Stripe CardElement — PCI-compliant hosted input */}
          <div>
            <label style={{
              display:     'block',
              fontFamily:  'var(--font-sans)',
              fontSize:    14,
              fontWeight:  500,
              color:       'var(--color-text-primary)',
              marginBottom: 6,
            }}>
              Card details <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <StripeCardInput
              error={errors.card}
              focused={cardFocused}
            />
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
              Card number, expiry date, and CVV — all encrypted by Stripe
            </p>
          </div>

          {/* Name on card — the only field we collect directly */}
          <Input
            label="Name on card"
            name="cardName"
            id="cardName"
            type="text"
            value={data.cardName || ''}
            onChange={(e) => update('cardName', e.target.value)}
            placeholder="Jane Omondi"
            error={errors.cardName}
            fullWidth
            required
          />
        </div>
      )}

      {/* ── PayPal ────────────────────────────────────────────────────────── */}
      {method === 'paypal' && (
        <div
          style={{
            display:         'flex',
            flexDirection:   'column',
            gap:             'var(--spacing-md)',
            padding:         'var(--spacing-lg)',
            backgroundColor: '#FFF8F0',
            border:          '1.5px solid #F5A623',
            borderRadius:    'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🅿️</span>
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#003087', margin: '0 0 2px' }}>
                Pay with PayPal
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                You will be securely redirected to PayPal to complete your payment.
                No PayPal account required — you can pay with any card through PayPal.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Visa', 'Mastercard', 'Amex', 'PayPal Balance'].map((brand) => (
              <span key={brand} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: 4, padding: '3px 8px', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: '#4a5568' }}>
                {brand}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── KG Inicis ─────────────────────────────────────────────────────── */}
      {method === 'kginicis' && (
        <div
          style={{
            padding:         'var(--spacing-lg)',
            backgroundColor: 'var(--color-warm-cream)',
            border:          '1px solid var(--color-border)',
            borderRadius:    'var(--radius-md)',
            fontFamily:      'var(--font-sans)',
            fontSize:        14,
            color:           'var(--color-text-secondary)',
            lineHeight:      1.6,
          }}
        >
          You will be redirected to the KG Inicis secure payment gateway after
          reviewing your order. All major Korean payment methods are supported.
        </div>
      )}

      {/* ── Security note ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Lock size={13} color="var(--color-muted-olive)" />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {method === 'paypal'
            ? "You will be redirected to PayPal's secure checkout. We never see your PayPal credentials."
            : 'Your card details are encrypted by Stripe and never stored on our servers.'}
        </span>
      </div>
    </div>
  );
}

const sectionTitle = {
  fontFamily: 'var(--font-display)',
  fontSize:   'var(--font-size-h3)',
  fontWeight: 600,
  color:      'var(--color-earth-brown)',
  margin:     0,
};

export default PaymentForm;