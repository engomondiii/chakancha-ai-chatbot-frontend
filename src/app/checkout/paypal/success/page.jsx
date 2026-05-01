'use client';

/**
 * src/app/checkout/paypal/success/page.jsx
 * PayPal return page — buyer lands here after approving on PayPal.
 *
 * PayPal appends ?token=PAYPAL_ORDER_ID&PayerID=XXXXX to the URL.
 * This page reads the token, retrieves the shipping data saved in
 * sessionStorage, then calls createOrder() to complete the order.
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams }            from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle }     from 'lucide-react';
import { createOrder }                           from '@/lib/api/orders';
import { useStore }                              from '@/store';

function PayPalSuccessContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const clearCart    = useStore((s) => s.clearCart);
  const showError    = useStore((s) => s.showError);

  const [status,  setStatus]  = useState('processing'); // 'processing' | 'success' | 'error'
  const [message, setMessage] = useState('Completing your PayPal payment…');

  useEffect(() => {
    const token   = searchParams?.get('token');   // PayPal order ID
    const payerId = searchParams?.get('PayerID'); // not required for capture but good to log

    if (!token) {
      setStatus('error');
      setMessage('Invalid PayPal return URL. No order token found.');
      return;
    }

    async function completeOrder() {
      try {
        // Retrieve checkout data saved before redirecting to PayPal
        const rawShipping = sessionStorage.getItem('chakancha_checkout_shipping');
        const couponCode  = sessionStorage.getItem('chakancha_checkout_coupon') || '';

        if (!rawShipping) {
          throw new Error('Checkout session expired. Please try again.');
        }

        const shippingPayload = JSON.parse(rawShipping);

        // Create the order — backend captures the PayPal payment server-side
        const order = await createOrder({
          shipping:       shippingPayload,
          payment_method: 'paypal',
          coupon_code:    couponCode,
          country:        shippingPayload.country || 'US',
          paypal_order_id: token,
        });

        // Clean up sessionStorage
        sessionStorage.removeItem('chakancha_checkout_shipping');
        sessionStorage.removeItem('chakancha_checkout_coupon');

        clearCart();
        setStatus('success');
        setMessage('Payment confirmed! Redirecting to your order…');

        setTimeout(() => {
          router.push(`/checkout/success?orderId=${order.id}`);
        }, 1500);

      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'PayPal payment could not be completed. Please try again.');
        showError(err.message || 'PayPal payment failed.');
      }
    }

    completeOrder();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight:       '100vh',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         'var(--spacing-lg)',
      backgroundColor: 'var(--color-soft-white)',
    }}>
      <div style={{
        maxWidth:        440,
        width:           '100%',
        backgroundColor: 'white',
        border:          '1px solid var(--color-border)',
        borderRadius:    'var(--radius-xl)',
        padding:         'var(--spacing-2xl)',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        gap:             'var(--spacing-lg)',
        textAlign:       'center',
      }}>
        {status === 'processing' && (
          <>
            <Loader2 size={40} color="var(--color-tea-green)" style={{ animation: 'spin 1s linear infinite' }} />
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 8px' }}>
                Completing payment
              </h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
                {message}
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(74,124,44,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={28} color="var(--color-success)" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 8px' }}>
                Payment confirmed
              </h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
                {message}
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(214,48,49,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={28} color="var(--color-error)" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 8px' }}>
                Payment incomplete
              </h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 var(--spacing-lg)', lineHeight: 1.6 }}>
                {message}
              </p>
              <button
                type="button"
                onClick={() => router.push('/checkout')}
                style={{
                  backgroundColor: 'var(--color-tea-green)', color: 'white',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  padding: '10px 24px', fontFamily: 'var(--font-sans)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Return to checkout
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function PayPalSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PayPalSuccessContent />
    </Suspense>
  );
}