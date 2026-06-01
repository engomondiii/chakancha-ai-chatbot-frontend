'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Leaf, Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { verifyEmail } from '@/lib/api/auth';

function VerifyEmailContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams?.get('token');

  const [status,  setStatus]  = useState('verifying'); // 'verifying' | 'success' | 'error' | 'no-token'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    const doVerify = async () => {
      try {
        await verifyEmail(token);
        setStatus('success');
      } catch (err) {
        const msg = err?.message || err?.data?.error || 'Verification failed. The link may have expired.';
        setMessage(msg);
        setStatus('error');
      }
    };

    doVerify();
  }, [token]);

  // ── Verifying (loading) ───────────────────────────────────────────────────
  if (status === 'verifying') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-lg)', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          backgroundColor: 'rgba(74, 124, 44, 0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Loader2 size={32} color="var(--color-tea-green)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 8px' }}>
            Verifying your email…
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
            Please wait a moment.
          </p>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-lg)', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          backgroundColor: 'rgba(74, 124, 44, 0.08)',
          border: '2px solid rgba(74, 124, 44, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle size={36} color="var(--color-tea-green)" />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 8px' }}>
            Email verified!
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
            Your account is now active. You can sign in and start shopping.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/login')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', padding: '13px',
            backgroundColor: 'var(--color-tea-green)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign in to your account
        </button>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-lg)', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          backgroundColor: 'rgba(214, 48, 49, 0.06)',
          border: '2px solid rgba(214, 48, 49, 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <XCircle size={36} color="var(--color-error)" />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 8px' }}>
            Verification failed
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
            {message || 'This link may have expired or already been used.'}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', width: '100%' }}>
          <button
            type="button"
            onClick={() => router.push('/signup')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', padding: '13px',
              backgroundColor: 'var(--color-tea-green)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Back to sign up
          </button>
          <button
            type="button"
            onClick={() => router.push('/login')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', padding: '13px',
              backgroundColor: 'transparent', color: 'var(--color-text-secondary)',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  // ── No token ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-lg)', textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        backgroundColor: 'rgba(74, 124, 44, 0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Mail size={32} color="var(--color-tea-green)" />
      </div>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 8px' }}>
          Check your email
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Click the verification link in your email to activate your account.
        </p>
      </div>
      <button
        type="button"
        onClick={() => router.push('/signup')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', padding: '13px',
          backgroundColor: 'transparent', color: 'var(--color-text-secondary)',
          border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Back to sign up
      </button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 'var(--spacing-lg)',
        backgroundColor: 'var(--color-soft-white)',
      }}>
        <div style={{
          width: '100%', maxWidth: 420, backgroundColor: 'white',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-2xl)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-xl)' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              backgroundColor: 'var(--color-tea-green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Leaf size={22} color="white" />
            </div>
          </div>
          <VerifyEmailContent />
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Suspense>
  );
}