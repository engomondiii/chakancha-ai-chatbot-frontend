/**
 * src/components/payouts/AdminPayoutQueue.jsx
 *
 * Staff review of payout requests.
 *
 * This screen is where money leaves, so three things are non-negotiable:
 *
 *  1. A rejection reason is mandatory and is shown to the member. A silent
 *     rejection produces a support ticket and destroys trust in the programme.
 *  2. Dual control above the threshold shows how many approvals remain and who
 *     has already approved. The same person cannot approve twice — the server
 *     enforces it, and the UI says so rather than letting them try.
 *  3. Fraud indicators are shown as the signals that produced the score, not as
 *     a bare number. A reviewer cannot defend "score 74" to a member; they can
 *     defend "92% of commission came from one buyer".
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, CheckCircle2, Loader2, ShieldAlert, ShieldCheck, XCircle,
} from "lucide-react";

import {
  approvePayout, describeApiError, getAdminQueue, getAdminRequest,
  getFraudReviews, rejectPayout, resolveFraudReview,
} from "@/lib/api/payouts";

import styles from "./payouts.module.css";

const BAND_TONE = {
  LOW: styles.badgeGood,
  MEDIUM: styles.badgeWarn,
  HIGH: styles.badgeBad,
};

function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export function AdminPayoutQueue() {
  const [queue, setQueue] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // One reason per fraud review, keyed by id, plus a separate one for the
  // approve/reject panel. A single shared string meant typing a resolution for
  // one member filled every other textarea on the page — and a reviewer could
  // submit text they had written about somebody else.
  const [reviewReasons, setReviewReasons] = useState({});
  const [decisionReason, setDecisionReason] = useState("");

  const setReviewReason = (id, value) =>
    setReviewReasons((prev) => ({ ...prev, [id]: value }));

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [q, r] = await Promise.all([getAdminQueue(), getFraudReviews()]);
      setQueue(q);
      setReviews(r);
    } catch (err) {
      const { status, message } = describeApiError(err, "Could not load the payout queue.");
      setError(status === 403 ? "Payout review is restricted to staff." : message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const open = async (id) => {
    setBusy(true);
    setDecisionReason("");
    setNotice("");
    try {
      setSelected(await getAdminRequest(id));
    } catch {
      setError("Could not open that request.");
    } finally {
      setBusy(false);
    }
  };

  const doApprove = async () => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const updated = await approvePayout(selected.id, decisionReason);
      setSelected(updated);
      setNotice(
        updated.dispatched
          ? "Approved and sent to the provider. It completes only when the provider confirms settlement."
          : `Approval recorded. ${updated.approvalsOutstanding} more approval(s) required before this can be sent.`,
      );
      await refresh();
    } catch (err) {
      const { message } = describeApiError(err, "Could not approve.");
      setError(Array.isArray(message) ? message.join(" ") : message);
    } finally {
      setBusy(false);
    }
  };

  const doReject = async () => {
    if (!selected) return;
    if (!decisionReason.trim()) {
      setError("A rejection reason is mandatory — the member is shown this text.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await rejectPayout(selected.id, decisionReason);
      setSelected(updated);
      setNotice("Rejected. The reserved earnings have been returned to the member's available balance.");
      await refresh();
    } catch (err) {
      setError(describeApiError(err, "Could not reject.").message);
    } finally {
      setBusy(false);
    }
  };

  const resolveReview = async (id, clear) => {
    const resolution = (reviewReasons[id] || "").trim();
    if (!resolution) {
      setError("A resolution note is required.");
      return;
    }
    setBusy(true);
    try {
      await resolveFraudReview(id, { clear, resolution });
      setNotice(clear
        ? "Cleared. The request has returned to the review queue."
        : "Upheld. The request was rejected and the earnings returned.");
      setReviewReasons((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await refresh();
    } catch {
      setError("Could not resolve that review.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={18} className={styles.spin} aria-hidden /> Loading queue…
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {error && <div className={styles.error} role="alert">{error}</div>}
      {notice && (
        <div className={styles.blockItem}>
          <CheckCircle2 size={15} aria-hidden />
          <span className={styles.blockText}>{notice}</span>
        </div>
      )}

      {/* ── Fraud reviews ─────────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>
              <ShieldAlert size={16} aria-hidden /> Fraud reviews
            </h2>
            <span className={styles.panelNote}>
              {reviews.length} open · the payout is held, the account is not suspended
            </span>
          </div>

          <ul className={styles.historyList}>
            {reviews.map((r) => (
              <li key={r.id} className={styles.historyItem}>
                <div className={styles.historyHead}>
                  <span className={styles.historyAmount}>
                    {r.member?.referral_code || r.member?.referralCode}
                  </span>
                  <span className={`${styles.badge} ${styles.badgeBad}`}>
                    score {r.score}
                  </span>
                </div>
                <ul className={styles.timeline}>
                  {r.signals.map((s, i) => (
                    <li key={i} className={styles.timelineStep}>
                      <span className={styles.timelineDot} aria-hidden />
                      <span className={styles.timelineLabel}>
                        <strong>{s.code}</strong> — {s.detail}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className={styles.field} style={{ marginTop: "0.8rem" }}>
                  <label htmlFor={`res-${r.id}`}>Resolution (required)</label>
                  <textarea
                    id={`res-${r.id}`} rows={2}
                    value={reviewReasons[r.id] || ""}
                    onChange={(e) => setReviewReason(r.id, e.target.value)}
                    placeholder="What you checked and what you concluded"
                  />
                </div>
                <div className={styles.actions}>
                  <button
                    type="button" className={styles.button} disabled={busy}
                    onClick={() => resolveReview(r.id, true)}
                  >
                    <ShieldCheck size={15} /> Clear — allow it to proceed
                  </button>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonDanger}`}
                    disabled={busy}
                    onClick={() => resolveReview(r.id, false)}
                  >
                    <XCircle size={15} /> Uphold — reject the payout
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Queue ─────────────────────────────────────────────────────────── */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Payout review queue</h2>
          <span className={styles.panelNote}>{queue.length} awaiting a decision</span>
        </div>

        {queue.length === 0 ? (
          <p className={styles.empty}>Nothing awaiting review.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Member</th>
                  <th className={styles.numeric}>Net</th>
                  <th>Risk</th>
                  <th>Approvals</th>
                  <th>Requested</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {queue.map((r) => (
                  <tr key={r.id}>
                    <td>{r.member?.referral_code || r.member?.email}</td>
                    <td className={styles.numeric}>{r.net?.display}</td>
                    <td>
                      <span className={`${styles.badge} ${BAND_TONE[r.riskBand] || styles.badgeNeutral}`}>
                        {r.riskBand || "—"} {r.riskScore ?? ""}
                      </span>
                    </td>
                    <td>
                      {r.requiresDualApproval
                        ? `${r.approvals.length}/${r.approvalsRequired} — dual control`
                        : `${r.approvals.length}/1`}
                    </td>
                    <td>{formatDateTime(r.requestedAt)}</td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.button} ${styles.buttonGhost}`}
                        onClick={() => open(r.id)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Detail ────────────────────────────────────────────────────────── */}
      {selected && (
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>
              {selected.member?.referral_code} · {selected.net?.display}
            </h2>
            <span className={`${styles.badge} ${BAND_TONE[selected.riskBand] || styles.badgeNeutral}`}>
              {selected.riskBand} {selected.riskScore}
            </span>
          </div>

          <div className={styles.quoteRows}>
            <div className={styles.quoteRow}>
              <span>Gross</span><span className={styles.quoteAmount}>{selected.gross?.display}</span>
            </div>
            <div className={styles.quoteRow}>
              <span>Fee</span><span className={styles.quoteAmount}>−{selected.fee?.display}</span>
            </div>
            <div className={styles.quoteRow}>
              <span>Withheld</span><span className={styles.quoteAmount}>−{selected.withheld?.display}</span>
            </div>
            <div className={`${styles.quoteRow} ${styles.quoteRowTotal}`}>
              <span>Member receives</span>
              <span className={styles.quoteAmount}>{selected.net?.display}</span>
            </div>
          </div>

          <p className={styles.destSub}>
            Member since {selected.member?.joined_at?.slice(0, 10)} ·{" "}
            {selected.member?.direct_referrals} direct referrals ·{" "}
            country {selected.member?.country || "unknown"} ·{" "}
            destination {selected.destination?.displayHint}
          </p>

          {selected.riskSignals?.length > 0 && (
            <>
              <div className={styles.panelHead} style={{ marginTop: "1.2rem" }}>
                <h3 className={styles.panelTitle} style={{ fontSize: "0.95rem" }}>
                  <AlertTriangle size={14} aria-hidden /> Why this scored {selected.riskScore}
                </h3>
              </div>
              <ul className={styles.blockList}>
                {selected.riskSignals.map((s, i) => (
                  <li key={i} className={styles.blockItem}>
                    <span className={styles.blockText}>
                      <strong>{s.code}</strong> — {s.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {selected.approvals?.length > 0 && (
            <ul className={styles.timeline}>
              {selected.approvals.map((a, i) => (
                <li key={i} className={styles.timelineStep}>
                  <span className={styles.timelineDot} aria-hidden />
                  <span className={styles.timelineLabel}>
                    Approved by {a.by}{a.reason ? ` — ${a.reason}` : ""}
                  </span>
                  <span className={styles.timelineTime}>{formatDateTime(a.at)}</span>
                </li>
              ))}
            </ul>
          )}

          {selected.requiresDualApproval && (
            <div className={styles.maturityBar}>
              <ShieldCheck size={15} aria-hidden />
              This payout is above the dual-control threshold and needs{" "}
              {selected.approvalsRequired} distinct approvers.
            </div>
          )}

          <div className={styles.field} style={{ marginTop: "1rem" }}>
            <label htmlFor="decision-reason">
              Reason — required to reject, recorded either way
            </label>
            <textarea
              id="decision-reason" rows={3} value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              placeholder="What you checked. The member sees this if you reject."
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.button} disabled={busy} onClick={doApprove}>
              {busy ? <Loader2 size={15} className={styles.spin} /> : <CheckCircle2 size={15} />}
              Approve
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonDanger}`}
              disabled={busy}
              onClick={doReject}
            >
              <XCircle size={15} /> Reject
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonGhost}`}
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>

          {selected.ledger?.length > 0 && (
            <>
              <div className={styles.panelHead} style={{ marginTop: "1.5rem" }}>
                <h3 className={styles.panelTitle} style={{ fontSize: "0.95rem" }}>
                  Earnings history
                </h3>
                <span className={styles.panelNote}>{selected.ledger.length} entries</span>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Order</th><th>Level</th>
                      <th className={styles.numeric}>Amount</th><th>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.ledger.slice(0, 25).map((e) => (
                      <tr key={e.id}>
                        <td>{e.order || "—"}</td>
                        <td>{e.level ? `L${e.level}` : "adj"}</td>
                        <td className={styles.numeric}>{e.amount?.display}</td>
                        <td>{e.state}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default AdminPayoutQueue;
