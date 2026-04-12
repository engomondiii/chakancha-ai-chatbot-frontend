/**
 * src/app/account/orders/page.jsx
 * Order history page with status badges and tracking links.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter }                   from 'next/navigation';
import { Package, ArrowLeft, ExternalLink } from 'lucide-react';
import { useAuth }   from '@/lib/hooks/useAuth';
import { getOrders } from '@/lib/api/orders';
import { Skeleton }  from '@/components/ui/Skeleton';

const STATUS_STYLES = {
  confirmed:  { bg: 'rgba(45,80,22,0.08)',   color: 'var(--color-tea-green)',  label: 'Confirmed'  },
  processing: { bg: 'rgba(212,165,116,0.15)', color: 'var(--color-sunrise-gold)', label: 'Processing' },
  dispatched: { bg: 'rgba(59,130,246,0.1)',   color: '#3b82f6',                label: 'Dispatched' },
  delivered:  { bg: 'rgba(74,124,44,0.1)',    color: 'var(--color-success)',   label: 'Delivered'  },
  cancelled:  { bg: 'rgba(214,48,49,0.08)',   color: 'var(--color-error)',     label: 'Cancelled'  },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.confirmed;
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.color}30`, borderRadius: 'var(--radius-pill)', padding: '3px 10px', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

function OrderCard({ order }) {
  const router = useRouter();
  const date   = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>{date}</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: 'var(--color-earth-brown)', margin: 0, letterSpacing: '0.03em' }}>{order.id}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <StatusBadge status={order.status} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 700, color: 'var(--color-tea-green)' }}>
            ${order.total?.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {order.items?.slice(0, 3).map((item, i) => (
          <div key={i} style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: 'var(--color-warm-cream)', border: '1px solid var(--color-border)', flexShrink: 0 }}>
            {item.image ? (
              <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🍃</div>
            )}
          </div>
        ))}
        {(order.items?.length || 0) > 3 && (
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-warm-cream)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            +{order.items.length - 3}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
        {order.trackingUrl && (
          <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--color-tea-green)', textDecoration: 'none', backgroundColor: 'rgba(45,80,22,0.06)', border: '1px solid rgba(45,80,22,0.15)', borderRadius: 'var(--radius-md)', padding: '6px 12px' }}>
            <ExternalLink size={12} /> Track order
          </a>
        )}
        <button type="button" onClick={() => router.push(`/account/orders/${order.id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-warm-cream)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '6px 12px', cursor: 'pointer' }}>
          View details
        </button>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, authLoading } = useAuth();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/login?redirect=/account/orders'); return; }
    if (isAuthenticated) {
      getOrders().then(setOrders).finally(() => setLoading(false));
    }
  }, [isAuthenticated, authLoading, router]);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-2xl)' }}>
        <button type="button" onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13, padding: 0 }}>
          <ArrowLeft size={15} /> Back
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h2)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={22} color="var(--color-tea-green)" /> Order History
        </h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {[1,2].map((i) => <Skeleton key={i} variant="rect" height="160px" style={{ borderRadius: 'var(--radius-xl)' }} />)}
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 15 }}>
          <Package size={40} color="var(--color-mist-gray)" style={{ margin: '0 auto var(--spacing-lg)' }} />
          <p style={{ margin: 0 }}>No orders yet. Time to brew something wonderful.</p>
          <button type="button" onClick={() => router.push('/products')} style={{ marginTop: 'var(--spacing-lg)', backgroundColor: 'var(--color-tea-green)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 24px', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Browse teas
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {orders.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  );
}