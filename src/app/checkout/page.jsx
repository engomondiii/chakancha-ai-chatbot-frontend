'use client';

/**
 * src/app/checkout/page.jsx
 * Checkout page at /checkout.
 *
 * What changed from the original:
 *  - Wrapped CheckoutForm in <Elements stripe={stripePromise}> from
 *    @stripe/react-stripe-js so useStripe() / useElements() hooks work
 *    inside CheckoutForm and StripeCardInput.
 *  - stripePromise is lazily loaded with loadStripe() — only fires when
 *    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set, falls back to null so the
 *    page still renders without Stripe configured.
 *  - Everything else (two-column layout, redirect, OrderSummary) unchanged.
 *
 * Requires:
 *   yarn add @stripe/stripe-js @stripe/react-stripe-js
 */

import React, { useEffect, useState } from 'react';
import { useRouter }         from 'next/navigation';
import { Lock }              from 'lucide-react';
import { loadStripe }        from '@stripe/stripe-js';
import { Elements }          from '@stripe/react-stripe-js';
import { useStore }          from '@/store';
import { CheckoutForm }      from '@/components/checkout/CheckoutForm';
import { OrderSummary }      from '@/components/checkout/OrderSummary';
import { syncCartToServer }  from '@/lib/api/cart';
import { fetchCheckoutQuote } from '@/lib/api/orders';

// Initialise Stripe once at module level — not inside a component
// so it is not recreated on every render.
// Returns null when key is missing so the page still works without Stripe.
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// Stripe Elements appearance — matches Chakancha design tokens
const ELEMENTS_OPTIONS = {
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary:       '#2D5016',
      colorBackground:    '#ffffff',
      colorText:          '#1a202c',
      colorDanger:        '#D63031',
      fontFamily:         'Inter, system-ui, sans-serif',
      spacingUnit:        '4px',
      borderRadius:       '8px',
    },
    rules: {
      '.Input': {
        border:     '1.5px solid #e2e8f0',
        boxShadow:  'none',
        fontSize:   '15px',
      },
      '.Input:focus': {
        border:     '1.5px solid #2D5016',
        boxShadow:  '0 0 0 3px rgba(45,80,22,0.08)',
        outline:    'none',
      },
      '.Label': {
        fontSize:   '14px',
        fontWeight: '500',
        color:      '#1a202c',
      },
    },
  },
};

export default function CheckoutPage() {
  const router        = useRouter();
  const cartItems     = useStore((s) => s.cartItems);
  const appliedCoupon   = useStore((s) => s.appliedCoupon);
  const shippingCountry = useStore((s) => s.shippingCountry);
  const [quote, setQuote] = useState(null);

  // Redirect to cart if empty
  useEffect(() => {
    if (cartItems.length === 0) {
      router.replace('/cart');
    }
  }, [cartItems.length, router]);

  // Pull the authoritative price quote from the backend.
  //
  // quote_cart() is the single source of truth for subtotal, shipping, tax,
  // discount and total — the same function that prices the PayPal charge and
  // the recorded Order. A referred customer's 5% Chakan Tree benefit is applied
  // automatically from Membership.referred_by, with no code to enter, so the
  // summary must render the backend's figures rather than a local estimate.
  // Nothing is discounted invisibly.
  //
  // The cart is synced first because the backend prices the server-side Cart.
  useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      if (cartItems.length === 0) return;
      try {
        await syncCartToServer(cartItems);
        const q = await fetchCheckoutQuote(shippingCountry, appliedCoupon?.code || '');
        if (!cancelled) setQuote(q);
      } catch {
        if (!cancelled) setQuote(null);   // fall back to the local estimate
      }
    }

    loadQuote();
    return () => { cancelled = true; };
  }, [cartItems, appliedCoupon, shippingCountry]);

  if (cartItems.length === 0) return null;

  return (
    <div
      style={{
        maxWidth:  'var(--max-width-content)',
        margin:    '0 auto',
        padding:   'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)',
        minHeight: '100vh',
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize:   'var(--font-size-h1)',
          fontWeight: 600,
          color:      'var(--color-earth-brown)',
          margin:     '0 0 8px',
        }}>
          Checkout
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lock size={13} color="var(--color-muted-olive)" />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Secure checkout · SSL encrypted
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '1fr 380px',
        gap:                 'var(--spacing-3xl)',
        alignItems:          'start',
      }}>
        {/* Left: form — wrapped in Stripe Elements provider */}
        <div style={{
          backgroundColor: 'white',
          border:          '1px solid var(--color-border)',
          borderRadius:    'var(--radius-xl)',
          padding:         'var(--spacing-2xl)',
        }}>
          {/*
            Elements provides the Stripe context so useStripe() and useElements()
            work in CheckoutForm and StripeCardInput.
            If stripePromise is null (key not set), Elements renders children
            without Stripe — card payment will fail gracefully with an error message.
          */}
          <Elements stripe={stripePromise} options={ELEMENTS_OPTIONS}>
            <CheckoutForm />
          </Elements>
        </div>

        {/* Right: summary — shows the authoritative backend quote */}
        <OrderSummary quote={quote} />
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}