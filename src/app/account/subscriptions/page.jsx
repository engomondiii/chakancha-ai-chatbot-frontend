/**
 * src/app/account/subscriptions/page.jsx
 * Subscription management — list active subscriptions, pause, cancel.
 * Ships on the 2nd of each month per the Chakancha model.
 */

'use client';

import React, { useState } from 'react';
import { useRouter }        from 'next/navigation';
import { ArrowLeft, Package, Calendar, Pause, X, RefreshCw } from 'lucide-react';
import { useAuth }  from '@/lib/hooks/useAuth';

// Mock subscriptions for display (real data comes from API)
const MOCK_SUBS = [
  {
    id:           'sub_001',
    status:       'active',
    productName:  'Nandi Hills Black Tea',
    quantity:     2,
    price:        18.99,
    frequency:    'Monthly',
    nextShipDate: new Date(new Date().getFullYear(), new Date().getMonth() + (new Date().getDate() > 2 ? 1 : 0), 2).toISOString(),
    image:        '/images/products/black-tea-1.jpg',
  },
];

function SubCard({ sub, onPause, onCancel, onResume }) {
  const shipDate = new Date(sub.nextShipDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const isPaused = sub.status === 'paused';

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--color-warm-cream)', flexShrink: 0 }}>
          {sub.image ? <img src={sub.image} alt={sub.productName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🍃</div>}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 2px' }}>{sub.productName}</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            Qty {sub.quantity} · ${(sub.price * sub.quantity).toFixed(2)}/month
          </p>
        </div>
        <span style={{ backgroundColor: isPaused ? 'rgba(212,165,116,0.15)' : 'rgba(45,80,22,0.08)', color: isPaused ? 'var(--color-sunrise-gold)' : 'var(--color-tea-green)', border: `1px solid ${isPaused ? 'rgba(212,165,116,0.3)' : 'rgba(45,80,22,0.15)'}`, borderRadius: 'var(--radius-pill)', padding: '3px 10px', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {isPaused ? 'Paused' : 'Active'}
        </span>
      </div>

      {!isPaused && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', backgroundColor: 'var(--color-warm-cream)', borderRadius: 'var(--radius-md)' }}>
          <Calendar size={13} color="var(--color-muted-olive)" />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Next shipment: <strong style={{ color: 'var(--color-text-primary)' }}>{shipDate}</strong> · Ships on the 2nd of each month
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        {isPaused ? (
          <button type="button" onClick={() => onResume(sub.id)} style={actionBtnStyle('var(--color-tea-green)', 'white')}>
            <RefreshCw size={13} /> Resume
          </button>
        ) : (
          <button type="button" onClick={() => onPause(sub.id)} style={actionBtnStyle('var(--color-warm-cream)', 'var(--color-text-primary)', 'var(--color-border)')}>
            <Pause size={13} /> Pause
          </button>
        )}
        <button type="button" onClick={() => onCancel(sub.id)} style={actionBtnStyle('rgba(214,48,49,0.06)', 'var(--color-error)', 'rgba(214,48,49,0.2)')}>
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  );
}

function actionBtnStyle(bg, color, border = 'transparent') {
  return { display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: bg, color, border: `1px solid ${border}`, borderRadius: 'var(--radius-md)', padding: '7px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer' };
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const { isAuthenticated, authLoading } = useAuth();
  const [subs, setSubs] = useState(MOCK_SUBS);

  const handlePause  = (id) => setSubs((s) => s.map((sub) => sub.id === id ? { ...sub, status: 'paused' } : sub));
  const handleResume = (id) => setSubs((s) => s.map((sub) => sub.id === id ? { ...sub, status: 'active' } : sub));
  const handleCancel = (id) => {
    if (confirm('Cancel this subscription?')) setSubs((s) => s.filter((sub) => sub.id !== id));
  };

  if (authLoading) return null;
  if (!isAuthenticated) { router.push('/login?redirect=/account/subscriptions'); return null; }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-2xl)' }}>
        <button type="button" onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13, padding: 0 }}>
          <ArrowLeft size={15} /> Back
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h2)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={22} color="var(--color-tea-green)" /> Subscriptions
        </h1>
      </div>

      {subs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 15 }}>
          <p style={{ margin: '0 0 var(--spacing-md)' }}>No active subscriptions.</p>
          <button type="button" onClick={() => router.push('/products')} style={{ backgroundColor: 'var(--color-tea-green)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 24px', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Browse teas
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {subs.map((sub) => (
            <SubCard key={sub.id} sub={sub} onPause={handlePause} onResume={handleResume} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
}