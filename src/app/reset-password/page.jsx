'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Leaf, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { resetPassword } from '@/lib/api/auth';

function ResetForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams?.get('token') || '';

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState('');

  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', fontFamily: 'var(--font-sans)', color: 'var(--color-text-secondary)' }}>
        <p>Invalid or expired reset link.</p>
        <a href="/forgot-password" style={{ color: 'var(--color-tea-green)' }}>Request a new one</a>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');

    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Reset failed. The link may have expired.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 'var(--spacing-lg)',
      backgroundColor: 'var(--color-soft-white)',
    }}>
      <div style={{
        width: '100%', maxWidth: 420, backgroundColor: 'white',
        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-2xl)', display: 'flex',
        flexDirection: 'column', gap: 'var(--spacing-xl)',
      }}>
        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(74,124,44,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={28} color="var(--color-success)" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 8px' }}>Password updated</h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>You can now sign in with your new password.</p>
            </div>
            <button type="button" onClick={() => router.push('/login')} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--color-tea-green)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Sign in
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--color-tea-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Leaf size={22} color="white" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 4px' }}>Choose a new password</h1>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>Must be at least 8 characters.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {[
                { label: 'New password',     value: password, setter: setPassword, placeholder: 'Min. 8 characters', autoComplete: 'new-password' },
                { label: 'Confirm password', value: confirm,  setter: setConfirm,  placeholder: 'Repeat your password', autoComplete: 'new-password' },
              ].map(({ label, value, setter, placeholder, autoComplete }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'} value={value}
                      onChange={(e) => { setter(e.target.value); setError(''); }}
                      placeholder={placeholder} required autoComplete={autoComplete}
                      style={{ width: '100%', padding: '12px 44px 12px 16px', boxSizing: 'border-box', fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--color-text-primary)', backgroundColor: 'white', border: `1.5px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', outline: 'none' }}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', padding: 2 }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              {error && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-error)', margin: 0 }}>{error}</p>}

              <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', backgroundColor: 'var(--color-tea-green)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
                {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Updating…</> : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}