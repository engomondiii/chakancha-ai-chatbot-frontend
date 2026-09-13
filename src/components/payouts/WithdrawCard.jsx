/**
 * src/components/payouts/WithdrawCard.jsx
 *
 * One card, whichever state applies: a withdrawal already open, a review in
 * progress, no bank account yet, a reason withdrawal is blocked, or ready.
 */

"use client";

import React from "react";
import { AlertCircle, Loader2, Plus, Wallet } from "lucide-react";

import { describeBlockCode } from "@/lib/payouts/errors";

import { QuoteReview } from "./QuoteReview";
import { destinationLabel } from "./format";
import styles from "./payouts.module.css";

export function WithdrawCard({
  balance, destinations, destinationId, onDestinationChange, openRequest,
  review, busy, onReview, onConfirm, onBack, onExpired, onAddBank,
}) {
  const verified = destinations.filter((d) => d.status === "VERIFIED");
  const blocked = (balance.blockedReasons ?? [])
    .filter((code) => String(code).toUpperCase() !== "NO_VERIFIED_DESTINATION");

  let body;
  if (openRequest) {
    body = (
      <p className={styles.figureHint}>
        You have a withdrawal in progress.{" "}
        <a className={styles.inlineLink} href="#withdrawal-history">See its status</a>.
      </p>
    );
  } else if (review) {
    body = (
      <QuoteReview
        quote={review.quote}
        notice={review.notice}
        reasons={review.reasons}
        busy={busy}
        onConfirm={onConfirm}
        onBack={onBack}
        onExpired={onExpired}
      />
    );
  } else if (verified.length === 0) {
    body = (
      <>
        <p className={styles.figureHint}>Add a bank account to withdraw your earnings.</p>
        <div className={styles.actions}>
          <button type="button" className={`${styles.button} ${styles.buttonGhost}`}
                  onClick={onAddBank}>
            <Plus size={15} aria-hidden /> Add bank account
          </button>
        </div>
      </>
    );
  } else if (blocked.length > 0) {
    body = (
      <ul className={styles.blockList}>
        {blocked.map((code) => (
          <li key={code} className={styles.blockItem}>
            <AlertCircle size={15} className={styles.blockIcon} aria-hidden />
            <span className={styles.blockText}>
              {String(code).toUpperCase() === "BELOW_MINIMUM"
                ? "You can withdraw once your available balance reaches the minimum."
                : describeBlockCode(code, {
                  available: balance.available, minimum: balance.minimumPayout,
                })}
            </span>
          </li>
        ))}
      </ul>
    );
  } else {
    body = (
      <>
        <p className={styles.withdrawAmount}>
          You&apos;re withdrawing <span className={styles.emphasis}>{balance.available?.display}</span>
        </p>
        <p className={styles.figureHint}>
          Withdrawals cover your whole available balance. Earnings still maturing stay in
          Pending earnings.
        </p>

        <div className={styles.field} style={{ marginTop: "var(--spacing-md)" }}>
          <label htmlFor="payout-send-to">Send to</label>
          <select id="payout-send-to" value={destinationId} disabled={busy}
                  onChange={(e) => onDestinationChange(e.target.value)}>
            {verified.map((d) => (
              <option key={d.id} value={d.id}>{destinationLabel(d)}</option>
            ))}
          </select>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.button}
                  disabled={!destinationId || busy} onClick={onReview}>
            {busy ? <Loader2 size={15} className={styles.spin} aria-hidden /> : <Wallet size={15} aria-hidden />}
            Review withdrawal
          </button>
        </div>
      </>
    );
  }

  return <div className={`${styles.card} ${styles.cardSoft}`}>{body}</div>;
}

export default WithdrawCard;
