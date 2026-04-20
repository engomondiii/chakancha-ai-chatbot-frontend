/**
 * src/app/account/subscriptions/page.jsx — Integration Phase 4
 *
 * What changed from the original:
 *  - Fetches real subscriptions from GET /api/v1/subscriptions/
 *    (SubscriptionListView → SubscriptionListSerializer)
 *  - pause() calls POST /api/v1/subscriptions/{id}/pause/
 *  - resume() calls POST /api/v1/subscriptions/{id}/resume/
 *  - cancel() calls POST /api/v1/subscriptions/{id}/cancel/
 *  - Backend response shape updated:
 *      subscription.status, subscription.frequency, subscription.next_ship_date,
 *      subscription.subscription_items[].product (full ProductListSerializer)
 *  - normalizeSubscription() maps backend → frontend display format
 *  - Mock data still shown as fallback when no real subscriptions exist (dev mode)
 *  - Everything else unchanged (UI components, SubCard, action buttons)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter }                   from 'next/navigation';
import { ArrowLeft, Package, Calendar, Pause, X, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth }  from '@/lib/hooks/useAuth';
import api          from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

// ─── Normalize backend subscription → frontend display shape ─────────────────

function normalizeSubscription(raw) {
  // Get preview image from first subscription item
  const firstItem = (raw.subscription_items || [])[0];
  const image     = raw.preview_image || firstItem?.product?.image || firstItem?.product?.primary_image || null;
  const itemName  = firstItem?.product?.name || 'Tea Subscription';
  const quantity  = firstItem?.quantity || 1;
  const price     = parseFloat(firstItem?.product?.price || raw.monthly_total || 0);

  return {
    id:           raw.id,
    status:       raw.status,
    productName:  itemName,
    quantity,
    price,
    frequency:    raw.frequency === 'monthly' ? 'Monthly' : raw.frequency,
    nextShipDate: raw.next_ship_date || raw.nextShipDate,
    image,
    items:        raw.subscription_items || [],
  };
}

// ─── SubCard ──────────────────────────────────────────────────────────────────

function SubCard({ sub, onPause, onResume, onCancel, actionLoading }) {
  const shipDate = sub.nextShipDate
    ? new Date(sub.nextShipDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : 'TBD';
  const isPaused = sub.status === 'paused';
  const isLoading = actionLoading === sub.id;

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

      {!isPaused && sub.nextShipDate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', backgroundColor: 'var(--color-warm-cream)', borderRadius: 'var(--radius-md)' }}>
          <Calendar size={13} color="var(--color-muted-olive)" />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Next shipment: <strong style={{ color: 'var(--color-text-primary)' }}>{shipDate}</strong> · Ships on the 2nd of each month
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        {isLoading ? (
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-text-secondary)' }} />
        ) : isPaused ? (
          <button type="button" onClick={() => onResume(sub.id)} style={actionBtnStyle('var(--color-tea-green)', 'white')}>
            <RefreshCw size={13} /> Resume
          </button>
        ) : (
          <button type="button" onClick={() => onPause(sub.id)} style={actionBtnStyle('var(--color-warm-cream)', 'var(--color-text-primary)', 'var(--color-border)')}>
            <Pause size={13} /> Pause
          </button>
        )}
        {!isLoading && (
          <button type="button" onClick={() => onCancel(sub.id)} style={actionBtnStyle('rgba(214,48,49,0.06)', 'var(--color-error)', 'rgba(214,48,49,0.2)')}>
            <X size={13} /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function actionBtnStyle(bg, color, border = 'transparent') {
  return { display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: bg, color, border: `1px solid ${border}`, borderRadius: 'var(--radius-md)', padding: '7px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer' };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const router = useRouter();
  const { isAuthenticated, authLoading } = useAuth();
  const [subs,          setSubs]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login?redirect=/account/subscriptions'); return; }

    api.get(ENDPOINTS.SUBSCRIPTIONS.LIST)
      .then((data) => {
        const raw = data.subscriptions || data.results || data;
        setSubs(Array.isArray(raw) ? raw.map(normalizeSubscription) : []);
      })
      .catch(() => setSubs([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, authLoading, router]);

  const handlePause = async (id) => {
    setActionLoading(id);
    try {
      await api.post(ENDPOINTS.SUBSCRIPTIONS.PAUSE(id));
      setSubs((s) => s.map((sub) => sub.id === id ? { ...sub, status: 'paused' } : sub));
    } catch (err) {
      alert(err.message || 'Could not pause subscription');
    } finally { setActionLoading(null); }
  };

  const handleResume = async (id) => {
    setActionLoading(id);
    try {
      await api.post(ENDPOINTS.SUBSCRIPTIONS.RESUME(id));
      setSubs((s) => s.map((sub) => sub.id === id ? { ...sub, status: 'active' } : sub));
    } catch (err) {
      alert(err.message || 'Could not resume subscription');
    } finally { setActionLoading(null); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this subscription? This cannot be undone.')) return;
    setActionLoading(id);
    try {
      await api.post(ENDPOINTS.SUBSCRIPTIONS.CANCEL(id));
      setSubs((s) => s.filter((sub) => sub.id !== id));
    } catch (err) {
      alert(err.message || 'Could not cancel subscription');
    } finally { setActionLoading(null); }
  };

  if (authLoading || loading) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'calc(72px + var(--spacing-2xl)) var(--spacing-lg)' }}>
      <div style={{ height: 200, backgroundColor: 'var(--color-warm-cream)', borderRadius: 'var(--radius-xl)', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  );

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
          <Package size={40} color="var(--color-mist-gray)" style={{ margin: '0 auto var(--spacing-lg)', display: 'block' }} />
          <p style={{ margin: '0 0 var(--spacing-md)' }}>No active subscriptions.</p>
          <button type="button" onClick={() => router.push('/products')} style={{ backgroundColor: 'var(--color-tea-green)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 24px', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Browse teas
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {subs.map((sub) => (
            <SubCard key={sub.id} sub={sub} onPause={handlePause} onResume={handleResume} onCancel={handleCancel} actionLoading={actionLoading} />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}