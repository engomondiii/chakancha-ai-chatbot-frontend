/**
 * src/app/checkout/success/page.jsx
 * Order confirmation page at /checkout/success?orderId=...
 */

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import {LogoMark} from '@components/common/Logo'
import { getOrder } from '@/lib/api/orders';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const orderId      = searchParams?.get('orderId');

  const [order,     setOrder]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { router.replace('/'); return; }
    getOrder(orderId)
      .then(setOrder)
      .catch(() => setOrder({ id: orderId }))
      .finally(() => setIsLoading(false));
  }, [orderId, router]);

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 'calc(72px + 80px)' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--color-tea-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s ease-in-out infinite', fontSize: '1.2rem' }}>🍃</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 'calc(72px + var(--spacing-3xl)) var(--spacing-lg) var(--spacing-3xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-xl)' }}>
      {/* Success icon */}
      <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(74,124,44,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.5s ease-out' }}>
        <CheckCircle size={40} color="var(--color-success)" />
      </div>

      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h1)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 12px' }}>
          Order confirmed!
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--font-size-body-large)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Thank you for your order. We&apos;ll send you a confirmation email shortly.
        </p>
      </div>

      {/* Order ID */}
      <div style={{ backgroundColor: 'var(--color-warm-cream)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 'var(--spacing-sm)' }}>
          <Package size={16} color="var(--color-muted-olive)" />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-olive)' }}>Order reference</span>
        </div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 700, color: 'var(--color-earth-brown)', margin: 0, letterSpacing: '0.05em' }}>
          {order?.id || orderId}
        </p>
        {order?.estimatedDelivery && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)', margin: '8px 0 0' }}>
            Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* What's next */}
      <div style={{ backgroundColor: 'rgba(45,80,22,0.04)', border: '1px solid rgba(45,80,22,0.12)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)', width: '100%', textAlign: 'left' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-tea-green)', margin: '0 0 12px' }}>What happens next</p>
        {[
          'You\'ll receive an email confirmation with your order details.',
          'Your tea is carefully packed at our Nandi Hills estate.',
          'DHL Express will collect and ship your order internationally.',
          'We\'ll email you a tracking number once dispatched.',
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: 'var(--color-tea-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-sans)', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>{step}</p>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button type="button" onClick={() => router.push('/account/orders')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--color-tea-green)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 24px', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <Package size={15} /> Track your order
        </button>
        <button type="button" onClick={() => router.push('/products')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'transparent', color: 'var(--color-tea-green)', border: '1px solid var(--color-tea-green)', borderRadius: 'var(--radius-md)', padding: '12px 24px', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          <LogoMark size='sm' variant='dark'/> Browse more teas <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div style={{ paddingTop: 'calc(72px + 80px)', textAlign: 'center', fontFamily: 'var(--font-sans)', color: 'var(--color-text-secondary)' }}>Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}