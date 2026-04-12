/**
 * src/app/chakan-tree/join/page.jsx
 */
'use client';
import React, { useState } from 'react';
import { useRouter }        from 'next/navigation';
import { TreePine, Loader2 } from 'lucide-react';
import { useStore }          from '@/store';

export default function ChakanTreeJoinPage() {
  const router = useRouter();
  const joinChakanTree = useStore((s) => s.joinChakanTree);
  const showSuccess    = useStore((s) => s.showSuccess);
  const showError      = useStore((s) => s.showError);
  const [loading, setLoading] = useState(false);
  const [referredBy, setReferredBy] = useState('');

  const handleJoin = async () => {
    setLoading(true);
    try {
      const result = await joinChakanTree({ referredBy: referredBy.trim() || undefined });
      if (result?.membership) {
        showSuccess('Welcome to Chakan Tree! Your referral code is ready.');
        router.push('/chakan-tree/dashboard');
      }
    } catch (err) {
      showError(err.message || 'Could not join. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', padding: 'calc(72px + var(--spacing-3xl)) var(--spacing-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-xl)', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--color-tea-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <TreePine size={28} color="white" />
      </div>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h2)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 12px' }}>Join Chakan Tree</h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Become a participant in the fairer tea value chain. Free to join. No obligations.
        </p>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        <label style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'left' }}>
          Referral code (optional)
        </label>
        <input
          type="text"
          value={referredBy}
          onChange={(e) => setReferredBy(e.target.value)}
          placeholder="e.g. CKCABC123"
          style={{ width: '100%', padding: '12px 16px', fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--color-text-primary)', backgroundColor: 'white', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none', textTransform: 'uppercase', boxSizing: 'border-box' }}
        />
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
          If someone invited you, enter their code here to give them credit.
        </p>
      </div>

      <button type="button" onClick={handleJoin} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center', backgroundColor: 'var(--color-sunrise-gold)', color: 'var(--color-tea-green)', border: 'none', borderRadius: 'var(--radius-md)', padding: '14px', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
        {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Joining…</> : 'Activate my referral code'}
      </button>

      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
        By joining, you agree to our Terms of Service. Chakan Tree is free and non-binding.
        You can deactivate at any time from your account settings.
      </p>
    </div>
  );
}