'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { forgotPassword } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      // Backend always returns 200 to prevent email enumeration,
      // so a real error here means something else went wrong
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:       '100vh',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         'var(--spacing-lg)',
      backgroundColor: 'var(--color-soft-white)',
    }}>
      <div style={{
        width:           '100%',
        maxWidth:        420,
        backgroundColor: 'white',
        border:          '1px solid var(--color-border)',
        borderRadius:    'var(--radius-xl)',
        padding:         'var(--spacing-2xl)',
        display:         'flex',
        flexDirection:   'column',
        gap:             'var(--spacing-xl)',
      }}>

        {/* Back link */}
        <button
          type="button"
          onClick={() => router.push('/login')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 13,
            color: 'var(--color-text-secondary)', padding: 0,
          }}
        >
          <ArrowLeft size={14} /> Back to sign in
        </button>

        {submitted ? (
          /* ── Success state ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              backgroundColor: 'rgba(74,124,44,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={28} color="var(--color-success)" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 8px' }}>
                Check your inbox
              </h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
                If <strong>{email}</strong> is registered, you'll receive a password reset link shortly.
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)', margin: '12px 0 0', lineHeight: 1.6 }}>
                Don't see it? Check your spam folder, or{' '}
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setEmail(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-tea-green)', fontWeight: 500, padding: 0 }}
                >
                  try a different email
                </button>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/login')}
              style={{
                width: '100%', padding: '12px',
                backgroundColor: 'var(--color-tea-green)', color: 'white',
                border: 'none', borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Return to sign in
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                backgroundColor: 'var(--color-tea-green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Leaf size={22} color="white" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 4px' }}>
                  Reset your password
                </h1>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Enter your email and we'll send you a reset link.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  autoFocus
                  style={{
                    width: '100%', padding: '12px 16px', boxSizing: 'border-box',
                    fontFamily: 'var(--font-sans)', fontSize: 15,
                    color: 'var(--color-text-primary)', backgroundColor: 'white',
                    border: `1.5px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)', outline: 'none',
                  }}
                />
              </div>

              {error && (
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-error)', margin: 0 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '13px',
                  backgroundColor: 'var(--color-tea-green)', color: 'white',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: (loading || !email.trim()) ? 0.7 : 1,
                  marginTop: 4,
                }}
              >
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
                  : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}