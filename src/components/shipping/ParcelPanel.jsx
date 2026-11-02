/**
 * src/components/shipping/ParcelPanel.jsx
 *
 * Everything about one parcel: the headline, the bar, the facts, the history.
 *
 * It is written to be honest about the three states that are not "on its way",
 * because those are the ones a customer writes in about:
 *
 *   • nothing booked yet — said plainly, with what happens next;
 *   • held or returned   — the bar is replaced, not advanced, and the reason
 *                          DHL gave is shown rather than summarised;
 *   • delivered          — when, and to whom if DHL said.
 */

'use client';

import React, { useState } from 'react';
import {
  AlertTriangle, CalendarClock, Check, Copy, ExternalLink, Package, Truck, Weight,
} from 'lucide-react';
import { PARCEL_STATUS } from '@/lib/shipping/parcel';
import ParcelProgress from './ParcelProgress';
import ParcelTimeline from './ParcelTimeline';

const HEADLINES = {
  [PARCEL_STATUS.NOT_BOOKED]:       'Not dispatched yet',
  [PARCEL_STATUS.BOOKED]:           'Label made',
  [PARCEL_STATUS.COLLECTED]:        'Collected by DHL',
  [PARCEL_STATUS.IN_TRANSIT]:       'On its way',
  [PARCEL_STATUS.OUT_FOR_DELIVERY]: 'Out for delivery',
  [PARCEL_STATUS.DELIVERED]:        'Delivered',
  [PARCEL_STATUS.EXCEPTION]:        'Needs attention',
};

function formatDate(value) {
  if (!value) return '';
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) return '';
  return when.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' });
}

function Fact({ icon, label, children }) {
  if (!children) return null;
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{
        margin: '0 0 3px', fontFamily: 'var(--font-sans)', fontSize: 10,
        letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
        color: 'var(--color-text-secondary)', opacity: 0.7,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {icon} {label}
      </p>
      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: 13.5,
        color: 'var(--color-text-primary)', wordBreak: 'break-word',
      }}>
        {children}
      </div>
    </div>
  );
}

function Waybill({ number, url }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access is refused in some in-app browsers. The number is
      // selectable text either way, so there is nothing to recover from.
    }
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'var(--font-family-mono, monospace)', letterSpacing: '0.03em' }}>
        {number}
      </span>
      <button
        type="button" onClick={copy}
        aria-label={copied ? 'Tracking number copied' : 'Copy tracking number'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 3, background: 'none',
          border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-sans)',
          fontSize: 11.5, fontWeight: 600, color: 'var(--color-tea-green)',
        }}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copied' : 'Copy'}
      </button>
      {url && (
        <a
          href={url} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600,
            color: 'var(--color-tea-green)', textDecoration: 'none',
          }}
        >
          <ExternalLink size={11} /> On dhl.com
        </a>
      )}
    </span>
  );
}

export default function ParcelPanel({ parcel, compact = false }) {
  if (!parcel) return null;

  const isException = parcel.status === PARCEL_STATUS.EXCEPTION;
  const notBooked   = parcel.status === PARCEL_STATUS.NOT_BOOKED;
  const delivered   = parcel.status === PARCEL_STATUS.DELIVERED;

  return (
    <section
      style={{
        backgroundColor: 'white', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-lg)',
        display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)',
      }}
    >
      {/* ── Headline ─────────────────────────────────────────────────────── */}
      <header style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <span
          aria-hidden="true"
          style={{
            width: 38, height: 38, borderRadius: 'var(--radius-md)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: isException ? 'rgba(214,48,49,0.08)' : 'rgba(45,80,22,0.07)',
            color: isException ? 'var(--color-error, #d63031)' : 'var(--color-tea-green)',
          }}
        >
          {isException ? <AlertTriangle size={18} /> : delivered ? <Check size={18} /> : <Truck size={18} />}
        </span>

        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 style={{
            margin: 0, fontFamily: 'var(--font-family-display, serif)', fontSize: 22,
            fontWeight: 600, color: 'var(--color-text-primary)',
          }}>
            {HEADLINES[parcel.status] || 'Tracking'}
          </h2>
          <p style={{
            margin: '4px 0 0', fontFamily: 'var(--font-sans)', fontSize: 13.5,
            color: 'var(--color-text-secondary)',
          }}>
            {parcel.statusText ||
              (notBooked
                ? (parcel.message ||
                   'We will email you the tracking number the moment the parcel is booked.')
                : parcel.checkpoints[0]?.description || '')}
          </p>
        </div>
      </header>

      {/* ── Progress, or the reason there is none ───────────────────────── */}
      {isException ? (
        <div style={{
          backgroundColor: 'rgba(214,48,49,0.05)',
          border: '1px solid rgba(214,48,49,0.25)',
          borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)',
        }}>
          <p style={{
            margin: 0, fontFamily: 'var(--font-sans)', fontSize: 13.5,
            color: 'var(--color-text-primary)',
          }}>
            {parcel.checkpoints[0]?.description || parcel.statusText ||
             'DHL has flagged this parcel.'}
          </p>
          <p style={{
            margin: '6px 0 0', fontFamily: 'var(--font-sans)', fontSize: 12.5,
            color: 'var(--color-text-secondary)',
          }}>
            Customs holds usually clear on their own within a day or two. If it has
            been longer, reply to your order email with the tracking number and we
            will chase DHL for you.
          </p>
        </div>
      ) : notBooked ? null : (
        <ParcelProgress status={parcel.status} />
      )}

      {/* ── The facts ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gap: 'var(--spacing-md) var(--spacing-lg)',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)',
      }}>
        <Fact icon={<Package size={11} />} label="Tracking number">
          {parcel.trackingNumber
            ? <Waybill number={parcel.trackingNumber} url={parcel.trackingUrl} />
            : null}
        </Fact>
        <Fact icon={<Truck size={11} />} label="Carrier">
          {parcel.carrier || null}
        </Fact>
        <Fact icon={<CalendarClock size={11} />} label={delivered ? 'Delivered' : 'Estimated'}>
          {formatDate(delivered ? parcel.deliveredAt || parcel.estimatedDelivery
                                : parcel.estimatedDelivery) || null}
        </Fact>
        <Fact icon={<Weight size={11} />} label="Weight">
          {parcel.weightKg ? `${parcel.weightKg} kg` : null}
        </Fact>
        <Fact icon={null} label="To">
          {parcel.destination || null}
        </Fact>
      </div>

      {/* ── History ─────────────────────────────────────────────────────── */}
      {!compact && !notBooked && (
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
          <h3 style={{
            margin: '0 0 var(--spacing-md)', fontFamily: 'var(--font-sans)', fontSize: 11,
            letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
            color: 'var(--color-text-secondary)', opacity: 0.7,
          }}>
            History
          </h3>
          <ParcelTimeline checkpoints={parcel.checkpoints} />
        </div>
      )}
    </section>
  );
}
