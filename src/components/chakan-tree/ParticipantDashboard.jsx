/**
 * ParticipantDashboard.jsx
 * Full Chakan Tree participant dashboard — referrals list, rewards, impact.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Users, TrendingUp }          from 'lucide-react';
import { getDashboard, getImpact }    from '@/lib/api/chakanTree';
import { ReferralCode }               from './ReferralCode';
import { ImpactTracker }              from './ImpactTracker';
import { RewardsSummary }             from './RewardsSummary';
import { Skeleton }                   from '@/components/ui/Skeleton';
import { useStore }                   from '@/store';

export function ParticipantDashboard() {
  const membership = useStore((s) => s.membership);
  const [dashboard, setDashboard] = useState(null);
  const [impact,    setImpact]    = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getDashboard(), getImpact()])
      .then(([d, i]) => { setDashboard(d); setImpact(i); })
      .finally(() => setLoading(false));
  }, []);

  const referralLink = membership?.referralCode
    ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://chakancha.com'}?ref=${membership.referralCode}`
    : null;

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <Skeleton variant="rect" height="120px" />
      <Skeleton variant="rect" height="200px" />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>

      {/* Referral code */}
      {membership?.referralCode && (
        <ReferralCode code={membership.referralCode} referralLink={referralLink} />
      )}

      {/* Rewards */}
      {dashboard?.rewards && (
        <section>
          <h3 style={sectionTitle}><TrendingUp size={16} color="var(--color-tea-green)" /> Your Rewards</h3>
          <RewardsSummary rewards={dashboard.rewards} />
        </section>
      )}

      {/* Impact */}
      {impact && (
        <section>
          <h3 style={sectionTitle}><Users size={16} color="var(--color-tea-green)" /> Your Impact</h3>
          <ImpactTracker impact={impact} />
        </section>
      )}

      {/* Referrals list */}
      {dashboard?.referrals?.length > 0 && (
        <section>
          <h3 style={sectionTitle}><Users size={16} color="var(--color-tea-green)" /> People You've Invited ({dashboard.referrals.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {dashboard.referrals.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px var(--spacing-md)', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--color-earth-brown)', margin: 0 }}>{r.name}</p>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>{r.purchases} purchase{r.purchases !== 1 ? 's' : ''}</p>
                </div>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'var(--color-tea-green)' }}>
                  +${r.valueGenerated?.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const sectionTitle = {
  fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
  color: 'var(--color-earth-brown)', margin: '0 0 var(--spacing-md)',
  display: 'flex', alignItems: 'center', gap: 8,
};

export default ParticipantDashboard;