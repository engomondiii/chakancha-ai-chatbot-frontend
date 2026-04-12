/**
 * ReferralCode.jsx
 * Displays and shares the participant's referral code.
 */

'use client';

import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { useStore } from '@/store';

export function ReferralCode({ code, referralLink }) {
  const [copied, setCopied] = useState(false);
  const showSuccess = useStore((s) => s.showSuccess);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink || code);
      setCopied(true);
      showSuccess('Referral link copied!');
      setTimeout(() => setCopied(false), 2500);
    } catch { /* fallback */ }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Join me on Chakancha', text: `Use my code ${code} for an exclusive benefit.`, url: referralLink });
    } else {
      handleCopy();
    }
  };

  if (!code) return null;

  return (
    <div style={{ backgroundColor: 'rgba(45,80,22,0.05)', border: '1px solid rgba(45,80,22,0.15)', borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-lg)', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted-olive)', margin: 0 }}>
        Your referral code
      </p>

      <div style={{ backgroundColor: 'white', border: '2px dashed rgba(45,80,22,0.3)', borderRadius: 'var(--radius-lg)', padding: '16px 32px' }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 800, color: 'var(--color-tea-green)', letterSpacing: '0.12em' }}>
          {code}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        <button type="button" onClick={handleCopy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--color-tea-green)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy link</>}
        </button>
        <button type="button" onClick={handleShare} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'transparent', color: 'var(--color-tea-green)', border: '1px solid var(--color-tea-green)', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          <Share2 size={14} /> Share
        </button>
      </div>
    </div>
  );
}

export default ReferralCode;