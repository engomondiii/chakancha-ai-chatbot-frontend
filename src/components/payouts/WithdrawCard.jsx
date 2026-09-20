/**
 * src/components/payouts/WithdrawCard.jsx
 *
 * One card, whichever state applies. Every state shows a visible action —
 * enabled when it can succeed, disabled with its reason beside it when it
 * cannot — and a saved bank account is always acknowledged as saved. What the
 * state is comes from decideWithdrawState(); this component only draws it.
 */

"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Loader2, Plus, RefreshCw, Wallet } from "lucide-react";

import { describeBlockCode } from "@/lib/payouts/errors";
import { decideWithdrawState } from "@/lib/payouts/withdrawState";

import { QuoteReview } from "./QuoteReview";
import { destinationLabel, formatDate } from "./format";
import styles from "./payouts.module.css";

export function WithdrawCard({
  balance, destinations, destinationId, onDestinationChange, openRequest,
  review, check, busy, onReview, onRetryCheck, onConfirm, onBack, onExpired, onAddBank,
}) {
  const verified = destinations.filter((d) => d.status === "VERIFIED");
  const state = decideWithdrawState({
    balance, destinations, destinationId, openRequest, review, check, formatDate,
  });

  if (state.kind === "open") {
    return (
      <div className={`${styles.card} ${styles.cardSoft}`}>
        <p className={styles.figureHint}>
          You have a withdrawal in progress.{" "}
          <a className={styles.inlineLink} href="#withdrawal-history">See its status</a>.
        </p>
      </div>
    );
  }

  if (state.kind === "review") {
    return (
      <div className={`${styles.card} ${styles.cardSoft}`}>
        <QuoteReview
          quote={review.quote}
          notice={review.notice}
          reasons={review.reasons}
          busy={busy}
          onConfirm={onConfirm}
          onBack={onBack}
          onExpired={onExpired}
        />
      </div>
    );
  }

  if (state.kind === "no_destination") {
    return (
      <div className={`${styles.card} ${styles.cardSoft}`}>
        <p className={styles.figureHint}>Add a bank account to withdraw your earnings.</p>
        <div className={styles.actions}>
          <button type="button" className={`${styles.button} ${styles.buttonGhost}`} onClick={onAddBank}>
            <Plus size={15} aria-hidden /> Add bank account
          </button>
        </div>
      </div>
    );
  }

  const ready = state.kind === "ready";
  const checking = state.kind === "checking";
  const action = state.action;
  const onAction = action?.intent === "review" ? onReview
    : action?.intent === "retry" ? onRetryCheck : undefined;
  const ActionIcon = checking || (busy && ready) ? Loader2
    : action?.intent === "retry" ? RefreshCw : Wallet;

  return (
    <div className={`${styles.card} ${styles.cardSoft}`}>
      <p className={styles.withdrawAmount}>
        {ready || checking ? "You're withdrawing " : "Available to withdraw "}
        <span className={styles.emphasis}>{balance.available?.display}</span>
      </p>
      {(ready || checking) && (
        <p className={styles.figureHint}>
          Withdrawals cover your whole available balance. Earnings still maturing stay
          under Earned.
        </p>
      )}

      {state.saved && (
        <p className={styles.savedNote}>
          <CheckCircle2 size={15} aria-hidden /> {state.saved}
        </p>
      )}

      <div className={styles.field} style={{ marginTop: "var(--spacing-md)" }}>
        <label htmlFor="payout-send-to">Send to</label>
        <select id="payout-send-to" value={destinationId} disabled={busy}
                onChange={(e) => onDestinationChange(e.target.value)}>
          {verified.map((d) => (
            <option key={d.id} value={d.id}>{destinationLabel(d)}</option>
          ))}
        </select>
      </div>

      {state.kind === "blocked" && (
        <ul className={styles.blockList}>
          {state.codes.map((code) => (
            <li key={code} className={styles.blockItem}>
              <AlertCircle size={15} className={styles.blockIcon} aria-hidden />
              <span className={styles.blockText}>
                {describeBlockCode(code, { available: balance.available, minimum: balance.minimumPayout })}
              </span>
            </li>
          ))}
        </ul>
      )}

      {state.message && (
        <div className={styles.blockItem} role="status" id="withdraw-state-reason">
          <AlertCircle size={15} className={styles.blockIcon} aria-hidden />
          <span className={styles.blockText}>{state.message}</span>
        </div>
      )}

      {action && (
        <div className={styles.actions}>
          <button type="button" className={styles.button}
                  disabled={!action.enabled || busy || !destinationId}
                  aria-describedby={state.message ? "withdraw-state-reason" : undefined}
                  onClick={onAction}>
            <ActionIcon size={15} className={ActionIcon === Loader2 ? styles.spin : undefined} aria-hidden />
            {action.label}
          </button>
          {state.secondary?.intent === "add_bank" && (
            <button type="button" className={`${styles.button} ${styles.buttonGhost}`} onClick={onAddBank}>
              <Plus size={15} aria-hidden /> {state.secondary.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default WithdrawCard;
