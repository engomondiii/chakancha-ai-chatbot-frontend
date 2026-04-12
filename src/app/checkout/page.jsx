/**
 * src/app/checkout/page.jsx
 * Checkout page at /checkout.
 * Two-column layout: CheckoutForm (left) + OrderSummary (right).
 * Redirects to /cart if cart is empty.
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter }         from 'next/navigation';
import { Lock }              from 'lucide-react';
import { useStore }          from '@/store';
import { CheckoutForm }      from '@/components/checkout/CheckoutForm';
import { OrderSummary }      from '@/components/checkout/OrderSummary';

export default function CheckoutPage() {
  const router    = useRouter();
  const cartItems = useStore((s) => s.cartItems);

  // Redirect to cart if empty
  useEffect(() => {
    if (cartItems.length === 0) {
      router.replace('/cart');
    }
  }, [cartItems.length, router]);

  if (cartItems.length === 0) return null;

  return (
    <div
      style={{
        maxWidth: 'var(--max-width-content)',
        margin:   '0 auto',
        padding:  'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)',
        minHeight:'100vh',
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h1)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 8px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--spacing-3xl)', alignItems: 'start' }}>
        {/* Left: form */}
        <div style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-2xl)' }}>
          <CheckoutForm />
        </div>

        {/* Right: summary */}
        <OrderSummary />
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: 1fr 380px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}