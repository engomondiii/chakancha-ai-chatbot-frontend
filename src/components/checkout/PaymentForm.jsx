/**
 * PaymentForm.jsx
 * Step 2 of checkout: payment method.
 * Supports card (KG Inicis for Korean market) and a general card UI.
 * Note: real payment processing handled by backend; this captures card details
 * for display purposes only — actual tokenisation happens server-side.
 */

'use client';

import React, { useState } from 'react';
import { CreditCard, Lock, Info } from 'lucide-react';
import { Input }   from '@/components/ui/Input';
import { Tooltip } from '@/components/ui/Tooltip';

function CardBrand({ number }) {
  if (number.startsWith('4'))  return '💳 Visa';
  if (number.startsWith('5'))  return '💳 Mastercard';
  if (number.startsWith('34') || number.startsWith('37')) return '💳 Amex';
  return '💳';
}

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(val) {
  const cleaned = val.replace(/\D/g, '').slice(0, 4);
  if (cleaned.length >= 3) return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
  return cleaned;
}

export function PaymentForm({ data, onChange, errors = {} }) {
  const [method, setMethod] = useState(data.method || 'card');

  const update = (key, val) => onChange({ ...data, method, [key]: val });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <h3 style={sectionTitle}>Payment</h3>

      {/* Method selector */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        {[
          { id: 'card',    label: 'Credit / Debit card' },
          { id: 'kginicis', label: 'KG Inicis (Korean market)' },
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

      {method === 'card' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {/* Card number */}
          <div style={{ position: 'relative' }}>
            <Input
              label="Card number"
              name="cardNumber"
              id="cardNumber"
              type="text"
              inputMode="numeric"
              value={data.cardNumber ? formatCardNumber(data.cardNumber) : ''}
              onChange={(e) => update('cardNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="1234 5678 9012 3456"
              error={errors.cardNumber}
              fullWidth
              required
              maxLength={19}
            />
            {data.cardNumber && (
              <span style={{ position: 'absolute', right: 14, top: 36, fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--color-text-secondary)' }}>
                <CardBrand number={data.cardNumber} />
              </span>
            )}
          </div>

          {/* Expiry + CVV */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <Input
              label="Expiry date"
              name="expiry"
              id="expiry"
              type="text"
              inputMode="numeric"
              value={data.expiry ? formatExpiry(data.expiry) : ''}
              onChange={(e) => update('expiry', e.target.value.replace(/\D/g, ''))}
              placeholder="MM/YY"
              error={errors.expiry}
              fullWidth
              required
              maxLength={5}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                CVV
                <Tooltip content="The 3-digit code on the back of your card (4 digits for Amex)." placement="top">
                  <Info size={13} color="var(--color-text-secondary)" style={{ cursor: 'help' }} />
                </Tooltip>
                <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <Input
                name="cvv"
                id="cvv"
                type="text"
                inputMode="numeric"
                value={data.cvv || ''}
                onChange={(e) => update('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                error={errors.cvv}
                fullWidth
                required
                maxLength={4}
              />
            </div>
          </div>

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

      {/* Security note */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Lock size={13} color="var(--color-muted-olive)" />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          Your payment info is encrypted and never stored on our servers.
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