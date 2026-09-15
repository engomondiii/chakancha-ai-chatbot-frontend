/**
 * src/components/payouts/WithdrawalHistory.jsx
 *
 * Each withdrawal and where it is. The timeline is built from Chakancha's own
 * lifecycle states with our own wording — never the backend's timeline labels,
 * attempts or failure messages, which can carry a payment provider's words.
 */

"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Clock, EyeOff, Loader2, RefreshCw } from "lucide-react";

import { Section } from "./Section";
import {
  CANCELLABLE_STATES, HIDEABLE_STATES, destinationLabel, formatDate, formatDateTime, statusText,
} from "./format";
import styles from "./payouts.module.css";

const TONE = {
  good: styles.badgeGood,
  warn: styles.badgeWarn,
  bad: styles.badgeBad,
  neutral: styles.badgeNeutral,
};

function StatusBadge({ status }) {
  const text = statusText(status);
  return <span className={`${styles.badge} ${TONE[text.tone]}`}>{text.badge}</span>;
}

function WithdrawalItem({ request: r, busy, onReconfirm, onCancel }) {
  const text = statusText(r.status);
  const meta = [
    (r.fee?.minor ?? 0) > 0 ? `Fee ${r.fee.display}` : null,
    r.targetAmount?.display ? `Recipient gets ${r.targetAmount.display}` : null,
  ].filter(Boolean);

  return (
    <li className={styles.historyItem}>
      <div className={styles.historyHead}>
        <span className={styles.historyAmount}>{r.gross?.display}</span>
        <StatusBadge status={r.status} />
      </div>

      <div className={styles.historyMeta}>
        {meta.length > 0 && <span className={styles.destSub}>{meta.join(" · ")}</span>}
        {r.destination && <span className={styles.destSub}>To {destinationLabel(r.destination)}</span>}
        {r.requestedAt && <span className={styles.destSub}>Requested {formatDate(r.requestedAt)}</span>}
      </div>

      {text.detail && <p className={styles.historyDetail}>{text.detail}</p>}

      {r.status === "REJECTED" && r.rejectionReason && (
        <div className={styles.blockItem} style={{ marginTop: 12 }}>
          <AlertCircle size={15} className={styles.blockIcon} aria-hidden />
          <span className={styles.blockText}>{r.rejectionReason}</span>
        </div>
      )}

      {r.requiresReconfirmation && (
        <div className={styles.reconfirmBox}>
          <p className={styles.figureHint} style={{ marginBottom: 10 }}>
            <RefreshCw size={14} aria-hidden />{" "}
            The transfer fee changed. You&apos;d now receive{" "}
            <span className={styles.emphasis}>{r.net?.display}</span> instead of{" "}
            <span className={styles.emphasis}>{r.confirmedNet?.display}</span>. Nothing has been sent.
          </p>
          <div className={styles.actions} style={{ marginTop: 0 }}>
            <button type="button" className={styles.button} disabled={busy}
                    onClick={() => onReconfirm(r.id)}>
              {busy ? <Loader2 size={15} className={styles.spin} aria-hidden /> : <CheckCircle2 size={15} aria-hidden />}
              Confirm withdrawal of {r.gross?.display}
            </button>
            <button type="button" className={`${styles.button} ${styles.buttonQuiet}`}
                    disabled={busy} onClick={() => onCancel(r.id)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {r.timeline?.length > 0 && (
        <ol className={styles.timeline} aria-label="Status history">
          {/* The server can report settlement twice (attempt settled, request
              completed); a member sees one "Paid". */}
          {r.timeline.filter((step, i, all) => i === 0 || step.state !== all[i - 1].state).map((step, i) => {
            const stepText = statusText(step.state);
            return (
              <li key={`${r.id}-${i}`} className={styles.timelineStep}>
                <span className={`${styles.timelineDot} ${
                  step.state === "COMPLETED" ? styles.timelineDotDone : ""}`} aria-hidden />
                <span className={styles.timelineLabel}>{stepText.detail || stepText.badge}</span>
                <span className={styles.timelineTime}>{formatDateTime(step.at)}</span>
              </li>
            );
          })}
        </ol>
      )}

      {CANCELLABLE_STATES.includes(r.status) && !r.requiresReconfirmation && (
        <div className={styles.actions}>
          <button type="button" className={`${styles.button} ${styles.buttonQuiet}`}
                  disabled={busy} onClick={() => onCancel(r.id)}>
            Cancel withdrawal
          </button>
        </div>
      )}
    </li>
  );
}

export function WithdrawalHistory({ requests, busy, onReconfirm, onCancel, onClearHistory }) {
  // Clearing only hides finished withdrawals; one still in progress stays listed.
  const canClear = Boolean(onClearHistory) && requests.some((r) => HIDEABLE_STATES.includes(r.status));

  return (
    <Section id="withdrawal-history" icon={Clock} title="Withdrawal history"
             note={requests.length ? `${requests.length} withdrawal${requests.length === 1 ? "" : "s"}` : null}>
      {canClear && (
        <div className={styles.actions} style={{ marginTop: 0, marginBottom: 12 }}>
          <button type="button" className={`${styles.button} ${styles.buttonQuiet}`}
                  disabled={busy} onClick={onClearHistory}>
            <EyeOff size={15} aria-hidden />
            Clear finished withdrawals
          </button>
        </div>
      )}
      {requests.length === 0 ? (
        <div className={styles.card}>
          <p className={styles.empty}>No withdrawals to show.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {requests.map((r) => (
            <WithdrawalItem key={r.id} request={r} busy={busy}
                            onReconfirm={onReconfirm} onCancel={onCancel} />
          ))}
        </ul>
      )}
    </Section>
  );
}

export default WithdrawalHistory;
