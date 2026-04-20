/**
 * src/components/chakan-tree/ParticipantDashboard.jsx — Integration Phase 4
 *
 * What changed from the original:
 *  - getDashboard() and getImpact() now come from the updated chakanTree.js
 *    which hits real backend endpoints (GET /api/v1/chakan-tree/dashboard/ and
 *    GET /api/v1/chakan-tree/impact/)
 *  - Dashboard response shape updated: dashboard.rewards (not dashboard.reward)
 *    since normalised by chakanTree.js
 *  - referrals list uses normalized field names: r.name, r.purchases, r.valueGenerated
 *  - referralLink built from membership.referralCode (camelCase, from normalizeM embership())
 *  - Everything else unchanged
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
      .then(([d, i]) => {
        setDashboard(d);
        setImpact(i);
      })
      .finally(() => setLoading(false));
  }, []);

  // referralCode comes from normalized membership (camelCase)
  const referralCode = membership?.referralCode || null;
  const referralLink = referralCode
    ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://chakancha.com'}?ref=${referralCode}`
    : null;

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <Skeleton variant="rect" height="120px" />
      <Skeleton variant="rect" height="200px" />
    </div>
  );

  // dashboard.referrals from getDashboard() are already normalized
  const referrals = dashboard?.referrals || [];
  // dashboard.rewards from getDashboard() are already normalized
  const rewards   = dashboard?.rewards   || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>

      {/* Referral code */}
      {referralCode && (
        <ReferralCode code={referralCode} referralLink={referralLink} />
      )}

      {/* Rewards */}
      {rewards && (
        <section>
          <h3 style={sectionTitle}><TrendingUp size={16} color="var(--color-tea-green)" /> Your Rewards</h3>
          <RewardsSummary rewards={rewards} />
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
      {referrals.length > 0 && (
        <section>
          <h3 style={sectionTitle}>
            <Users size={16} color="var(--color-tea-green)" />
            People You've Invited ({referrals.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {referrals.map((r) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px var(--spacing-md)', backgroundColor: 'white',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--color-earth-brown)', margin: 0 }}>
                    {r.name}
                  </p>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
                    {r.purchases} purchase{r.purchases !== 1 ? 's' : ''}
                  </p>
                </div>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'var(--color-tea-green)' }}>
                  +${(r.valueGenerated || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state when no referrals yet */}
      {referrals.length === 0 && !loading && (
        <div style={{
          textAlign: 'center', padding: 'var(--spacing-2xl)',
          backgroundColor: 'var(--color-warm-cream)',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)',
        }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
            No referrals yet. Share your code to start building your impact.
          </p>
        </div>
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