'use client';

/**
 * src/components/checkout/StripeCardInput.jsx
 * Stripe CardElement wrapper — PCI-compliant card input.
 *
 * Renders Stripe's hosted card field inside an iframe so raw card
 * numbers never touch your server or your JavaScript.
 *
 * Requires:
 *   yarn add @stripe/stripe-js @stripe/react-stripe-js
 *
 * Parent must be wrapped in <Elements stripe={stripePromise}>
 * — this is done in src/app/checkout/page.jsx.
 */

import React from 'react';
import { CardElement } from '@stripe/react-stripe-js';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontFamily:      'Inter, system-ui, sans-serif',
      fontSize:        '15px',
      fontWeight:      '400',
      color:           '#1a202c',
      letterSpacing:   '0.01em',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: {
      color:     '#D63031',
      iconColor: '#D63031',
    },
  },
  hidePostalCode: true,
};

/**
 * @param {object}  props
 * @param {string}  props.error  - Error message to show below (optional)
 * @param {boolean} props.focused - Whether the wrapper should show focus ring
 */
export function StripeCardInput({ error, focused }) {
  return (
    <div>
      <div
        style={{
          padding:         '13px 16px',
          border:          `1.5px solid ${error ? 'var(--color-error)' : focused ? 'var(--color-tea-green)' : 'var(--color-border)'}`,
          borderRadius:    'var(--radius-md)',
          backgroundColor: 'white',
          transition:      'border-color 150ms ease',
          boxShadow:       focused ? '0 0 0 3px rgba(45,80,22,0.08)' : 'none',
        }}
      >
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      {error && (
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize:   12,
          color:      'var(--color-error)',
          margin:     '4px 0 0',
        }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default StripeCardInput;