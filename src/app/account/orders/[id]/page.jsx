/**
 * src/app/account/orders/[id]/page.jsx
 *
 * One order, and where its parcel has got to.
 *
 * This route was linked to from the order list ("View details") before it
 * existed, so the button went nowhere. It is also the natural home for
 * tracking: a customer who wants to know where their tea is is looking at the
 * order, not hunting for a tracking number to paste somewhere else.
 *
 * The parcel is fetched separately from the order and is allowed to fail on
 * its own. Tracking is the part that depends on DHL, and an order page that
 * goes blank because a carrier is having a bad afternoon is a worse page than
 * one that says tracking is unavailable.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import { useAuth }   from '@/lib/hooks/useAuth';
import { getOrder }  from '@/lib/api/orders';
import { trackOrderParcel, normaliseParcel } from '@/lib/api/shipping';
import { Skeleton }  from '@/components/ui/Skeleton';
import ParcelPanel   from '@/components/shipping/ParcelPanel';

function money(value, currency = 'USD') {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${currency === 'USD' ? '$' : `${currency} `}${number.toFixed(2)}`;
}

function Line({ label, value, strong = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <span style={{
        fontFamily: 'var(--font-sans)', fontSize: strong ? 14 : 13,
        fontWeight: strong ? 700 : 500,
        color: strong ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-sans)', fontSize: strong ? 15 : 13,
        fontWeight: strong ? 700 : 500,
        color: strong ? 'var(--color-tea-green)' : 'var(--color-text-primary)',
      }}>
        {value}
      </span>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section style={{
      backgroundColor: 'white', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-lg)',
      display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)',
    }}>
      <h2 style={{
        margin: 0, fontFamily: 'var(--font-sans)', fontSize: 11,
        letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
        color: 'var(--color-text-secondary)', opacity: 0.7,
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id;
  const { isAuthenticated, authLoading } = useAuth();

  const [order,   setOrder]   = useState(null);
  const [parcel,  setParcel]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed,  setFailed]  = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/account/orders/${orderId}`);
      return;
    }
    if (!isAuthenticated || !orderId) return;

    let live = true;

    getOrder(orderId)
      .then((data) => {
        if (!live) return;
        setOrder(data);
        //
        // Draw something immediately from what the order already knows — the
        // waybill and the estimate are on it — so the panel is not empty while
        // the tracking call is in flight, and still says something useful if
        // that call never comes back.
        //
        setParcel(normaliseParcel({
          order_id:           data?.id,
          status:             data?.status,
          order_status:       data?.status,
          tracking_number:    data?.tracking_number,
          tracking_url:       data?.tracking_url,
          estimated_delivery: data?.estimated_delivery,
          destination:        [data?.shipping_address?.city,
                               data?.shipping_address?.country]
                                .filter(Boolean).join(', '),
        }));
      })
      .catch(() => { if (live) setFailed(true); })
      .finally(() => { if (live) setLoading(false); });

    trackOrderParcel(orderId)
      .then((live_parcel) => { if (live) setParcel(live_parcel); })
      .catch(() => { /* the fallback above is already on screen */ });

    return () => { live = false; };
  }, [orderId, isAuthenticated, authLoading, router]);

  const shell = (children) => (
    <div style={{
      maxWidth: 680, margin: '0 auto',
      padding: 'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-2xl)' }}>
        <button
          type="button" onClick={() => router.push('/account/orders')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, background: 'none',
            border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-sans)', fontSize: 13, padding: 0,
          }}
        >
          <ArrowLeft size={15} /> Orders
        </button>
        <h1 style={{
          margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h2)',
          fontWeight: 600, color: 'var(--color-earth-brown)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Package size={22} color="var(--color-tea-green)" /> {orderId}
        </h1>
      </div>
      {children}
    </div>
  );

  if (loading) {
    return shell(
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {[1, 2].map((i) => (
          <Skeleton key={i} variant="rect" height="200px" style={{ borderRadius: 'var(--radius-xl)' }} />
        ))}
      </div>
    );
  }

  if (failed || !order) {
    return shell(
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--color-text-secondary)' }}>
        We could not open that order. It may belong to another account.
      </p>
    );
  }

  const address  = order.shipping_address || {};
  const currency = order.currency || 'USD';

  return shell(
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {parcel && <ParcelPanel parcel={parcel} />}

      <Panel title="What is in the box">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {(order.items || []).map((item, index) => (
            <div key={item.id ?? index} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--color-text-primary)' }}>
                {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--color-text-secondary)' }}>
                {money(Number(item.price) * Number(item.quantity || 1), currency)}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Going to">
        <address style={{
          fontStyle: 'normal', fontFamily: 'var(--font-sans)', fontSize: 13.5,
          lineHeight: 1.7, color: 'var(--color-text-primary)',
        }}>
          {[address.first_name, address.last_name].filter(Boolean).join(' ')}<br />
          {address.address1}{address.address2 ? <><br />{address.address2}</> : null}<br />
          {[address.city, address.state, address.postal_code].filter(Boolean).join(' ')}<br />
          {address.country}
        </address>
      </Panel>

      <Panel title="What it cost">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Line label="Tea"      value={money(order.subtotal, currency)} />
          {/*
            Shown only when this order actually paid for carriage. Orders placed
            since delivery was included in the price have nothing to show, and a
            "Free" row on them invites the question of what it would otherwise
            have cost. Older orders did pay it, so their receipt keeps saying so
            -- a receipt that disagrees with the card statement is worse than a
            row nobody needed.
          */}
          {Number(order.shipping_cost) > 0 && (
            <Line label="Shipping" value={money(order.shipping_cost, currency)} />
          )}
          {Number(order.tax) > 0      && <Line label="Tax"      value={money(order.tax, currency)} />}
          {Number(order.discount) > 0 && <Line label="Discount" value={`−${money(order.discount, currency)}`} />}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
            <Line label="Total" value={money(order.total, currency)} strong />
          </div>
        </div>
      </Panel>
    </div>
  );
}
