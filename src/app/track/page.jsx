/**
 * src/app/track/page.jsx
 *
 * Track a parcel by its number, without signing in.
 *
 * Public on purpose. The person chasing a parcel is often not the person who
 * paid for it — a gift, an office delivery, somebody reading the card on the
 * box — and all they have is the number. Making them find an account password
 * first is how a question that could have answered itself becomes an email to
 * answer by hand.
 *
 * The lookup goes to our own backend, never to DHL from here: the DHL API key
 * is a server credential and a browser cannot hold one.
 */

'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { trackParcel } from '@/lib/api/shipping';
import ParcelPanel from '@/components/shipping/ParcelPanel';

//
// A DHL Express waybill is ten digits. Checking the shape in the browser saves
// a round trip on an obvious typo — and only on an obvious one: the check is
// deliberately loose, because a wrong rule here would lock somebody out of
// their own parcel, which is far worse than one wasted request.
//
const LOOKS_LIKE_A_WAYBILL = /^[A-Z0-9-]{8,25}$/i;

function TrackForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const initial      = searchParams.get('number') || '';

  const [number, setNumber]   = useState(initial);
  const [parcel, setParcel]   = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (waybill) => {
    const trimmed = String(waybill || '').trim();
    if (!trimmed) {
      setError('Enter the tracking number from your dispatch email.');
      return;
    }
    if (!LOOKS_LIKE_A_WAYBILL.test(trimmed)) {
      setError('That does not look like a tracking number. Check it against your dispatch email.');
      return;
    }

    setLoading(true);
    setError('');
    setParcel(null);

    try {
      setParcel(await trackParcel(trimmed));
    } catch (err) {
      //
      // Until the DHL account is open there is nothing behind this endpoint,
      // so the honest answer is "we cannot look this up yet" rather than "no
      // such parcel" — which would send somebody hunting for a wrong number.
      //
      setError(
        err?.status === 404
          ? 'We could not find a parcel with that number. Check it against your dispatch email.'
          : 'Live tracking is not switched on yet. Your dispatch email has a link straight to the carrier.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // A link out of an email arrives with the number already in the URL.
  useEffect(() => {
    if (initial) lookup(initial);
  }, [initial, lookup]);

  function onSubmit(event) {
    event.preventDefault();
    const trimmed = number.trim();
    // Keep the number in the address bar, so the page can be sent to somebody.
    router.replace(trimmed ? `/track?number=${encodeURIComponent(trimmed)}` : '/track');
    lookup(trimmed);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
        <label htmlFor="waybill" className="sr-only" style={{ position: 'absolute', left: -9999 }}>
          Tracking number
        </label>
        <input
          id="waybill"
          name="waybill"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          placeholder="e.g. 1234567890"
          autoComplete="off"
          inputMode="numeric"
          style={{
            flex: '1 1 220px', minWidth: 0,
            fontFamily: 'var(--font-family-mono, monospace)', fontSize: 15,
            padding: '12px 14px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)', backgroundColor: 'white',
            color: 'var(--color-text-primary)', letterSpacing: '0.04em',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
            padding: '12px 20px', borderRadius: 'var(--radius-md)', border: 'none',
            backgroundColor: 'var(--color-tea-green)', color: 'white',
            cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.75 : 1,
          }}
        >
          {loading ? <Loader2 size={15} className="spin" /> : <Search size={15} />}
          {loading ? 'Looking' : 'Track'}
        </button>
      </form>

      {error && (
        <p style={{
          margin: 0, fontFamily: 'var(--font-sans)', fontSize: 13.5,
          color: 'var(--color-text-primary)',
          backgroundColor: 'rgba(224,163,58,0.1)',
          border: '1px solid rgba(224,163,58,0.4)',
          borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)',
        }}>
          {error}
        </p>
      )}

      {parcel && <ParcelPanel parcel={parcel} />}
    </div>
  );
}

export default function TrackPage() {
  return (
    <div style={{
      maxWidth: 760, margin: '0 auto',
      // The header is fixed, so the first line has to start below it — the
      // same offset the account pages use.
      paddingTop: 'calc(72px + var(--spacing-2xl))',
      paddingBottom: 'var(--spacing-3xl)',
      paddingLeft: 'max(var(--spacing-lg), env(safe-area-inset-left, 0px))',
      paddingRight: 'max(var(--spacing-lg), env(safe-area-inset-right, 0px))',
    }}>
      <header style={{ marginBottom: 'var(--spacing-xl, 32px)' }}>
        <p style={{
          margin: '0 0 8px', fontFamily: 'var(--font-sans)', fontSize: 11,
          letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
          color: 'var(--color-sunrise-gold)',
        }}>
          Chakancha
        </p>
        <h1 style={{
          margin: 0, fontFamily: 'var(--font-family-display, serif)',
          fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 600,
          color: 'var(--color-text-primary)',
        }}>
          Where is my tea?
        </h1>
        <p style={{
          margin: '10px 0 0', fontFamily: 'var(--font-sans)', fontSize: 15,
          color: 'var(--color-text-secondary)', maxWidth: '58ch',
        }}>
          Put in the tracking number from your dispatch email. Every order leaves
          Nandi Hills on a tracked international service.
        </p>
      </header>

      {/* useSearchParams needs a boundary, or the whole route opts out of
          static rendering at build time. */}
      <Suspense fallback={null}>
        <TrackForm />
      </Suspense>
    </div>
  );
}
