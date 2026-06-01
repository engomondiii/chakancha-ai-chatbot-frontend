/**
 * src/app/chakan-tree/page.jsx
 *
 * What changed from previous version:
 *  - Added useEffect to fetch membership on mount so the redirect to
 *    dashboard works even when the store is hydrated from localStorage
 *  - Added a loading state so the page does not flash the join UI
 *    before the membership check completes
 *  - If membership.isActive is true, redirects to /chakan-tree/dashboard
 *    instead of showing the join page — fixes the "activate again" bug
 */
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TreePine, ArrowRight, Loader2 } from 'lucide-react';
import { ExplainerFlow }  from '@/components/chakan-tree/ExplainerFlow';
import { getChakanTreeInfo } from '@/lib/api/chakanTree';
import { useStore } from '@/store';

export default function ChakanTreePage() {
  const router          = useRouter();
  const membership      = useStore((s) => s.membership);
  const fetchMembership = useStore((s) => s.fetchMembership);
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  const [info,    setInfo]    = useState(null);
  const [checked, setChecked] = useState(false);

  // Fetch fresh membership status on mount
  useEffect(() => {
    const init = async () => {
      if (isAuthenticated) {
        await fetchMembership();
      }
      setChecked(true);
    };
    init();
  }, [isAuthenticated, fetchMembership]);

  // Fetch public info regardless of auth
  useEffect(() => {
    getChakanTreeInfo().then(setInfo);
  }, []);

  // Redirect if already a member
  useEffect(() => {
    if (checked && membership?.isActive) {
      router.replace('/chakan-tree/dashboard');
    }
  }, [checked, membership, router]);

  // Show spinner while checking membership
  if (!checked || (membership?.isActive)) {
    return (
      <div style={{
        minHeight:       '60vh',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
      }}>
        <Loader2
          size={32}
          color="var(--color-tea-green)"
          style={{ animation: 'spin 1s linear infinite' }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 'var(--max-width-content)',
      margin:   '0 auto',
      padding:  'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-3xl)' }}>
        <div style={{
          width:           64,
          height:          64,
          borderRadius:    '50%',
          backgroundColor: 'var(--color-tea-green)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          margin:          '0 auto var(--spacing-lg)',
        }}>
          <TreePine size={28} color="white" />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize:   'var(--font-size-h1)',
          fontWeight: 600,
          color:      'var(--color-earth-brown)',
          margin:     '0 0 16px',
        }}>
          Chakan Tree
        </h1>

        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize:   'var(--font-size-body-large)',
          color:      'var(--color-text-secondary)',
          maxWidth:   560,
          margin:     '0 auto',
          lineHeight: 1.6,
        }}>
          {info?.description || 'A participatory value-sharing system where tea lovers help extend a fairer global tea value chain.'}
        </p>

        {info?.stats && (
          <div style={{
            display:       'flex',
            justifyContent:'center',
            gap:            'var(--spacing-2xl)',
            marginTop:     'var(--spacing-xl)',
            flexWrap:      'wrap',
          }}>
            {[
              ['Participants', info.stats.totalParticipants?.toLocaleString()],
              ['Value shared', info.stats.totalValueShared],
              ['Countries',    info.stats.countriesReached],
            ].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 700, color: 'var(--color-tea-green)', margin: 0 }}>{v}</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>{l}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <ExplainerFlow />

      <div style={{ marginTop: 'var(--spacing-3xl)', display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => router.push('/chakan-tree/join')}
          style={{
            display:         'inline-flex',
            alignItems:      'center',
            gap:             8,
            backgroundColor: 'var(--color-sunrise-gold)',
            color:           'var(--color-tea-green)',
            border:          'none',
            borderRadius:    'var(--radius-md)',
            padding:         '16px 40px',
            fontFamily:      'var(--font-sans)',
            fontSize:        16,
            fontWeight:      700,
            cursor:          'pointer',
          }}
        >
          Join Chakan Tree <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}