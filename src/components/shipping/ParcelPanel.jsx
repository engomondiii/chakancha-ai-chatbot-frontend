/**
 * src/components/shipping/ParcelPanel.jsx
 *
 * Everything DHL knows about one parcel, on one card.
 *
 * It shows what a real DHL integration actually returns, not a summary of it:
 * the product the shipment was booked on, the pieces and their IDs, the
 * declared weight and box size, our own order reference as DHL holds it, the
 * delivery window rather than just a date, proof of delivery with the name
 * that signed, and — the two that matter most — DHL's own `remark` and
 * `nextSteps` when something has gone wrong. Those last two are written by
 * the carrier about this parcel, and they beat anything we could compose from
 * a status code.
 *
 * It is also written to be honest about the states that are not "on its way",
 * because those are the ones people write in about: nothing booked yet, held
 * at customs, and delivered.
 */

'use client';

import React, { useState } from 'react';
import {
  AlertTriangle, CalendarClock, CalendarCog, Check, Copy, ExternalLink,
  FileText, Package, Ruler, Truck, Weight,
} from 'lucide-react';
import { PARCEL_STATUS } from '@/lib/shipping/parcel';
import ParcelProgress from './ParcelProgress';
import ParcelTimeline from './ParcelTimeline';

const HEADLINES = {
  [PARCEL_STATUS.NOT_BOOKED]:       'Not dispatched yet',
  [PARCEL_STATUS.BOOKED]:           'Label made',
  [PARCEL_STATUS.COLLECTED]:        'Collected',
  [PARCEL_STATUS.IN_TRANSIT]:       'On its way',
  [PARCEL_STATUS.OUT_FOR_DELIVERY]: 'Out for delivery',
  [PARCEL_STATUS.DELIVERED]:        'Delivered',
  [PARCEL_STATUS.EXCEPTION]:        'Needs attention',
};

const LONG_DATE = { weekday: 'long', day: 'numeric', month: 'long' };

function formatDate(value, options = LONG_DATE) {
  if (!value) return '';
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) return '';
  return when.toLocaleDateString('en-GB', options);
}

function formatTime(value) {
  if (!value) return '';
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) return '';
  return when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** "Wednesday 4 November, between 09:00 and 13:00" — the window, where DHL gives one. */
function deliveryLine(parcel) {
  const day = formatDate(parcel.estimatedDelivery || parcel.estimatedWindow?.from);
  if (!day) return '';
  const from = formatTime(parcel.estimatedWindow?.from);
  const to   = formatTime(parcel.estimatedWindow?.to);
  if (from && to) return `${day}, between ${from} and ${to}`;
  return day;
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

function Grid({ children }) {
  return (
    <div style={{
      display: 'grid', gap: 'var(--spacing-md) var(--spacing-lg)',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)',
    }}>
      {children}
    </div>
  );
}

function Mono({ children }) {
  return (
    <span style={{ fontFamily: 'var(--font-family-mono, monospace)', letterSpacing: '0.02em' }}>
      {children}
    </span>
  );
}

function LinkOut({ href, children, icon = <ExternalLink size={11} /> }) {
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
        color: 'var(--color-tea-green)', textDecoration: 'none',
      }}
    >
      {icon} {children}
    </a>
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
      <Mono>{number}</Mono>
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
      {url && <LinkOut href={url}>On dhl.com</LinkOut>}
    </span>
  );
}

/** DHL's own words about what is happening and who has to act. */
function CarrierNote({ tone, title, body, nextSteps }) {
  const danger = tone === 'danger';
  return (
    <div style={{
      backgroundColor: danger ? 'rgba(214,48,49,0.05)' : 'rgba(45,80,22,0.04)',
      border: `1px solid ${danger ? 'rgba(214,48,49,0.25)' : 'var(--color-border)'}`,
      borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)',
    }}>
      {title && (
        <p style={{
          margin: 0, fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600,
          color: 'var(--color-text-primary)',
        }}>
          {title}
        </p>
      )}
      {body && (
        <p style={{
          margin: title ? '6px 0 0' : 0, fontFamily: 'var(--font-sans)',
          fontSize: 13, color: 'var(--color-text-primary)',
        }}>
          {body}
        </p>
      )}
      {nextSteps && (
        <p style={{
          margin: '8px 0 0', fontFamily: 'var(--font-sans)', fontSize: 12.5,
          color: 'var(--color-text-secondary)',
        }}>
          <strong style={{ fontWeight: 600 }}>What happens next: </strong>{nextSteps}
        </p>
      )}
    </div>
  );
}

export default function ParcelPanel({ parcel, compact = false }) {
  if (!parcel) return null;

  const isException = parcel.status === PARCEL_STATUS.EXCEPTION;
  const notBooked   = parcel.status === PARCEL_STATUS.NOT_BOOKED;
  const delivered   = parcel.status === PARCEL_STATUS.DELIVERED;

  const headline = HEADLINES[parcel.status] || 'Tracking';

  //
  // DHL's summary line goes under the headline, but not when it would argue
  // with it or merely repeat it. A held parcel is the case that matters: DHL
  // still says "In transit" while the box sits at the border, and printing
  // that under "Needs attention" tells the customer two different things at
  // once. What is actually wrong is in the note below.
  //
  const subtitle = (() => {
    if (notBooked) {
      return parcel.message
        || 'We will email you the tracking number the moment the parcel is booked.';
    }
    if (isException) return '';
    const line = parcel.statusText || parcel.checkpoints[0]?.description || '';
    return line.trim().toLowerCase() === headline.toLowerCase() ? '' : line;
  })();

  const estimate   = deliveryLine(parcel);
  const dimensions = parcel.dimensions;
  const pieceCount = parcel.pieces?.total;
  const reference  = parcel.references?.[0]?.number;

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
            {headline}
          </h2>
          {subtitle && (
            <p style={{
              margin: '4px 0 0', fontFamily: 'var(--font-sans)', fontSize: 13.5,
              color: 'var(--color-text-secondary)',
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* On Demand Delivery. When DHL offers it the customer can move the
            delivery themselves rather than emailing us about it. */}
        {parcel.rerouteUrl && (
          <a
            href={parcel.rerouteUrl} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
              padding: '9px 14px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', color: 'var(--color-text-primary)',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            <CalendarCog size={14} /> Change delivery
          </a>
        )}
      </header>

      {/* ── Progress, or what is wrong instead ──────────────────────────── */}
      {isException ? (
        <CarrierNote
          tone="danger"
          title={parcel.checkpoints[0]?.description || parcel.statusText || 'This parcel has been flagged.'}
          body={parcel.statusRemark}
          nextSteps={parcel.nextSteps
            || 'Customs holds usually clear on their own within a day or two. If it '
             + 'has been longer, reply to your order email with the tracking number '
             + 'and we will chase the carrier for you.'}
        />
      ) : notBooked ? null : (
        <ParcelProgress status={parcel.status} />
      )}

      {/* DHL sometimes attaches next steps to a parcel that is not in trouble —
          a redelivery it has scheduled, a service point it has left it at. */}
      {!isException && parcel.nextSteps && (
        <CarrierNote tone="quiet" body={parcel.statusRemark} nextSteps={parcel.nextSteps} />
      )}

      {/* ── When ─────────────────────────────────────────────────────────── */}
      {(estimate || delivered) && (
        <Grid>
          <Fact icon={<CalendarClock size={11} />} label={delivered ? 'Delivered' : 'Expected'}>
            {delivered
              ? [formatDate(parcel.deliveredAt), formatTime(parcel.deliveredAt)]
                  .filter(Boolean).join(' at ') || null
              : estimate || null}
          </Fact>
          <Fact icon={null} label="Signed for by">
            {delivered ? (parcel.signedBy || null) : null}
          </Fact>
          <Fact icon={<FileText size={11} />} label="Proof of delivery">
            {parcel.proofOfDelivery?.documentUrl
              ? <LinkOut href={parcel.proofOfDelivery.documentUrl}>Open receipt</LinkOut>
              : null}
          </Fact>
          <Fact icon={null} label="Note">
            {!delivered ? (parcel.estimatedRemark || null) : null}
          </Fact>
        </Grid>
      )}

      {/* ── What DHL is carrying ─────────────────────────────────────────── */}
      <Grid>
        <Fact icon={<Package size={11} />} label="Tracking number">
          {parcel.trackingNumber
            ? <Waybill number={parcel.trackingNumber} url={parcel.trackingUrl} />
            : null}
        </Fact>
        <Fact icon={<Truck size={11} />} label="Service">
          {parcel.productName
            ? `${parcel.carrier} · ${parcel.productName}`
            : parcel.carrier || null}
        </Fact>
        <Fact icon={null} label={pieceCount === 1 ? 'Piece' : 'Pieces'}>
          {pieceCount
            ? (
              <>
                {pieceCount}
                {parcel.pieces.ids.length > 0 && (
                  <span style={{ display: 'block', opacity: 0.65, fontSize: 12, marginTop: 2 }}>
                    <Mono>{parcel.pieces.ids.join(', ')}</Mono>
                  </span>
                )}
              </>
            )
            : null}
        </Fact>
        <Fact icon={<Weight size={11} />} label="Weight">
          {parcel.weightKg ? `${parcel.weightKg} kg` : null}
        </Fact>
        <Fact icon={<Ruler size={11} />} label="Box">
          {dimensions && dimensions.length
            ? `${dimensions.length} × ${dimensions.width} × ${dimensions.height} ${dimensions.unit}`
            : null}
        </Fact>
        <Fact icon={null} label="Our reference">
          {reference ? <Mono>{reference}</Mono> : null}
        </Fact>
        <Fact icon={null} label="From">
          {parcel.origin?.locality || null}
        </Fact>
        <Fact icon={null} label="To">
          {parcel.destination?.locality || null}
        </Fact>
      </Grid>

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
