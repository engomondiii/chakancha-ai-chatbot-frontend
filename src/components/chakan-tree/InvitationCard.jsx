/**
 * InvitationCard.jsx
 * Layer 2 Chakan Tree invitation — shown in conversation after trust signals.
 * Calm, invitational tone. Never pushy.
 */

'use client';

import React, { useState } from 'react';
import { useRouter }        from 'next/navigation';
import { TreePine, X, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import styles from './InvitationCard.module.css';

export function InvitationCard({ onDismiss }) {
  const router     = useRouter();
  const [expanded, setExpanded] = useState(false);

  const steps = [
    { n: 1, title: 'Join',  desc: 'Sign up for your personal referral code — free and instant.' },
    { n: 2, title: 'Share', desc: 'Share your code. When they order, value is distributed more fairly.' },
    { n: 3, title: 'Earn',  desc: 'Receive 5% of your referrals\' purchases — automatically.' },
  ];

  return (
    <div className={styles.card}>
      {onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
          <X size={13} />
        </button>
      )}

      <div className={styles.header}>
        <div className={styles.icon}><TreePine size={18} color="white" /></div>
        <div>
          <p className={styles.eyebrow}>An invitation</p>
          <h3 className={styles.title}>Become more than a buyer</h3>
        </div>
      </div>

      <p className={styles.intro}>
        Chakan Tree lets you share tea — and share the value it creates.
        Your referrals extend the fairer value chain beyond yourself.
      </p>

      <button type="button" className={styles.expandToggle} onClick={() => setExpanded(v => !v)}>
        {expanded ? 'Show less' : 'How it works'}
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {expanded && (
        <div className={styles.steps}>
          {steps.map((s) => (
            <div key={s.n} className={styles.step}>
              <div className={styles.stepNum}>{s.n}</div>
              <div>
                <p className={styles.stepTitle}>{s.title}</p>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" className={styles.cta} onClick={() => router.push('/chakan-tree/join')}>
        Explore Chakan Tree <ArrowRight size={13} />
      </button>
    </div>
  );
}

export default InvitationCard;