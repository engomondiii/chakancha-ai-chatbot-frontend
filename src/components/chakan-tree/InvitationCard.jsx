/**
 * src/components/chakan-tree/InvitationCard.jsx — Integration Phase 4
 *
 * What changed from the original:
 *  - InvitationCard is now exported as-is (no logic changes needed in the
 *    component itself — it already accepts onDismiss and routes to /chakan-tree/join)
 *  - BUT: a new exported hook useInvitationCardVisible() is added alongside it.
 *    This hook reads message_count from the AI conversation state and returns true
 *    exactly when the backend signals readiness (5+ messages, chakanTree signal set).
 *    ConversationView.jsx uses this hook to decide when to render InvitationCard.
 *  - Component JSX unchanged from original
 */

'use client';

import React, { useState }  from 'react';
import { useRouter }         from 'next/navigation';
import { TreePine, X, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { useStore }          from '@/store';
import styles from './InvitationCard.module.css';

// ─── Hook: when to show the card ─────────────────────────────────────────────

/**
 * Returns true when the Chakan Tree invitation should be shown.
 *
 * Conditions (matching the backend chatbot_agent.py Layer 2 logic):
 *   1. User has 5+ messages in the current conversation
 *   2. The backend has set the chakanTreeSignal (layer >= 2)
 *   3. User is NOT already a Chakan Tree member
 *
 * Used by ConversationView.jsx to render InvitationCard inline.
 */
export function useInvitationCardVisible() {
  const messages         = useStore((s) => s.messages);
  const chakanTreeSignal = useStore((s) => s.chakanTreeSignal);
  const membership       = useStore((s) => s.membership);

  const userMessageCount = (messages || []).filter((m) => m.type === 'user').length;
  const isAlreadyMember  = !!membership?.isActive;

  // Show if: 5+ user messages AND backend signalled AND not already a member
  return (
    !isAlreadyMember &&
    userMessageCount >= 5 &&
    chakanTreeSignal !== null &&
    (chakanTreeSignal?.layer || 0) >= 2
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

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