/**
 * src/app/checkout/wise/page.jsx
 * Where to send the money, at /checkout/wise?orderId=...
 *
 * A Wise order is placed unpaid: Wise has no merchant checkout, so the customer
 * sends a transfer themselves and we confirm it. This page is the whole of that
 * instruction — the amount, the account, and the reference that ties their
 * payment to their order. It is reachable again later from the order itself, so
 * nobody loses the details by closing the tab.
 */

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Building2, Copy, Check, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { LogoMark } from '@/components/common/Logo';
import { WiseMark } from '@/components/common/WiseMark';
import { getWiseInstructions, declareWiseSent } from '@/lib/api/orders';

/** One line of the account, with a button that copies just that value. */
function DetailRow({ label, value }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (http, or permission denied): the value is on screen
      // to be read and typed, which is what it is there for.
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        padding: '10px 0',
        borderTop: '1px solid var(--color-divider-soft)',
      }}
    >
      <span style={{ flex: '0 0 40%', fontSize: 13, color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, wordBreak: 'break-word' }}>
        {value}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          fontSize: 12,
          color: 'var(--color-text-muted)',
          background: 'transparent',
          border: '1px solid var(--color-border-soft)',
          borderRadius: 'var(--radius-sm, 6px)',
          cursor: 'pointer',
        }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function WiseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams?.get('orderId');

  const [instructions, setInstructions] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [declared, setDeclared] = useState(false);
  const [declaring, setDeclaring] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.replace('/');
      return;
    }
    getWiseInstructions(orderId)
      .then((data) => {
        setInstructions(data);
        // They told us on an earlier visit; do not ask again.
        setDeclared(Boolean(data?.declared_at) || data?.payment_status === 'paid');
      })
      .catch((err) =>
        setError(
          err?.message ||
            'We could not load the payment details. Your order is safe — open it from your account to try again.',
        ),
      )
      .finally(() => setIsLoading(false));
  }, [orderId, router]);

  if (isLoading) {
    return (
      <main style={{ padding: 'var(--spacing-3xl) var(--spacing-lg)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading your payment details…</p>
      </main>
    );
  }

  const account = instructions?.account;
  const parsed = (account?.details || []).map((line) => {
    const at = line.indexOf(':');
    return at === -1
      ? { label: 'Detail', value: line }
      : { label: line.slice(0, at).trim(), value: line.slice(at + 1).trim() };
  });

  return (
    <main
      style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: 'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--spacing-sm)' }}>
        <h1 style={{ fontFamily: 'var(--font-family-display)', fontSize: 30, margin: 0 }}>
          Send your transfer
        </h1>
        {/* Wise's own mark, so the customer can see at a glance whose
            instructions these are before they open their banking app. */}
        <WiseMark height={17} brand style={{ marginLeft: 2 }} />
      </div>

      {/*
        A test account is said out loud. The shop is on the public internet,
        and someone who sent real money to a sandbox account number would
        simply lose it — nothing else on this page would tell them otherwise.
      */}
      {instructions?.is_test && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            margin: 'var(--spacing-md) 0 var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            background: '#fff4e0',
            border: '1.5px solid #e0a33a',
            borderRadius: 'var(--radius-md)',
            color: '#7a5200',
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 14, lineHeight: 1.5 }}>
            <strong>Test mode.</strong> These are sandbox account details for
            checking that our payment process works. <strong>Do not send real
            money</strong> — it would not reach us and could not be returned.
          </span>
        </div>
      )}

      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
        Order <strong>{instructions?.order_id || orderId}</strong> is placed and waiting for
        payment. Send the amount below from your bank or your own Wise account, quoting the
        reference — that is how we match your payment to your order.
      </p>

      {error && (
        <p
          style={{
            marginTop: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            background: '#f3e3e3',
            color: '#8a2d2d',
          }}
        >
          {error}
        </p>
      )}

      {instructions && (
        <>
          <section
            style={{
              marginTop: 'var(--spacing-xl)',
              padding: 'var(--spacing-lg)',
              background: 'var(--color-surface-card)',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-card, 18px)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Amount to send</span>
              <strong style={{ fontFamily: 'var(--font-family-display)', fontSize: 28 }}>
                {instructions.currency} {instructions.amount}
              </strong>
            </div>

            {/*
              The amount above is the total LESS any earnings applied, so a
              member part-paying with credit is never asked for the whole sum.
              Showing the arithmetic stops that looking like a pricing error.
            */}
            {Number(instructions.credit_applied) > 0 && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                Order total {instructions.currency} {instructions.total}, less{' '}
                {instructions.currency} {instructions.credit_applied} of your
                Chakancha earnings.
              </p>
            )}

            <DetailRow label="Reference (must be quoted)" value={instructions.reference} />

            {!instructions.configured ? (
              <p style={{ marginTop: 'var(--spacing-md)', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                Our account details are not published here yet. Email{' '}
                <a href="mailto:contact@chakancha.com">contact@chakancha.com</a> quoting your
                reference and we will send them straight back to you.
              </p>
            ) : (
              <>
                {account.account_holder && (
                  <DetailRow label="Account holder" value={account.account_holder} />
                )}
                {account.email && <DetailRow label="Wise email" value={account.email} />}
                {parsed.map((row) => (
                  <DetailRow key={`${row.label}-${row.value}`} label={row.label} value={row.value} />
                ))}
                {account.notes && (
                  <p style={{ marginTop: 'var(--spacing-md)', fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {account.notes}
                  </p>
                )}
              </>
            )}
          </section>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginTop: 'var(--spacing-lg)',
              color: 'var(--color-text-secondary)',
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <Clock size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              Wise-to-Wise transfers usually arrive within minutes; a bank transfer can take a
              day or two. We email you as soon as we have confirmed it, and your order stays
              reserved in the meantime.
            </span>
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
        <button
          type="button"
          disabled={declaring || declared}
          onClick={async () => {
            //
            // Telling us is a courtesy, not a payment, so a failure here must
            // not look like a failed order: the transfer is already on its way
            // and we will find it in the statement regardless. Worst case the
            // customer moves on without the acknowledgement.
            //
            setDeclaring(true);
            try {
              await declareWiseSent(orderId);
            } catch {
              /* ignored on purpose — see above */
            }
            setDeclared(true);
            setDeclaring(false);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            background: declared ? 'var(--color-surface-card)' : 'var(--color-background-dark)',
            color: declared ? 'var(--color-text-secondary)' : 'var(--color-text-inverse)',
            border: declared ? '1px solid var(--color-border-soft)' : 'none',
            borderRadius: 'var(--radius-button, 999px)',
            fontSize: 15,
            cursor: declared ? 'default' : 'pointer',
          }}
        >
          {declared
            ? <>Thank you — we&apos;re looking for it <Check size={15} /></>
            : <>I have sent it <ArrowRight size={15} /></>}
        </button>

        <button
          type="button"
          onClick={() => router.push('/products')}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-button, 999px)',
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Keep shopping
        </button>
      </div>

      <p style={{ marginTop: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)', fontSize: 13 }}>
        <LogoMark tone="dark" size="sm" clickable={false} />
        These details are also on your order, so you can come back to them at any time.
      </p>
    </main>
  );
}

export default function WiseTransferPage() {
  return (
    <Suspense fallback={null}>
      <WiseContent />
    </Suspense>
  );
}
