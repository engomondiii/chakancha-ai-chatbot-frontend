'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Leaf, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams?.get('redirect') || '/account';

  const { login, isAuthenticated, authLoading } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Already logged in — send them where they were going
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(redirect);
    }
  }, [isAuthenticated, authLoading, redirect, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');

    const result = await login(email.trim(), password);
    if (result?.success) {
      router.replace(redirect);
    } else {
      setError(result?.error || 'Invalid email or password.');
      setLoading(false);
    }
  };

  if (authLoading) return null;

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
        {/* Logo */}
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
              Welcome back
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
              Sign in to your Chakancha account
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {/* Email */}
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
              style={{
                width: '100%', padding: '12px 16px', boxSizing: 'border-box',
                fontFamily: 'var(--font-sans)', fontSize: 15,
                color: 'var(--color-text-primary)', backgroundColor: 'white',
                border: `1.5px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)', outline: 'none',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                Password
              </label>
              <a href="/forgot-password" style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-tea-green)', textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Your password"
                required
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '12px 44px 12px 16px', boxSizing: 'border-box',
                  fontFamily: 'var(--font-sans)', fontSize: 15,
                  color: 'var(--color-text-primary)', backgroundColor: 'white',
                  border: `1.5px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)', outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-secondary)', display: 'flex', padding: 2,
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-error)', margin: 0 }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '13px',
              backgroundColor: 'var(--color-tea-green)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: (loading || !email.trim() || !password) ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {loading
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
              : 'Sign in'}
          </button>
        </form>

        {/* Sign up link */}
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', textAlign: 'center', margin: 0 }}>
          Don't have an account?{' '}
          <a href="/signup" style={{ color: 'var(--color-tea-green)', fontWeight: 500, textDecoration: 'none' }}>
            Create one
          </a>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}