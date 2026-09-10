/**
 * src/components/payouts/PayoutDashboard.jsx
 *
 * The member cash-out experience, in the Chakan Tree visual language.
 *
 * Four figures, never one:
 *   Total earned · Pending earnings · Available to withdraw · Paid out
 *
 * "Pending earnings", not "pending payout" — nothing has been paid, and calling
 * it a payout invites a member to ask where their money is.
 *
 * Every financial state on this screen comes from the backend state machine.
 * The withdraw flow's steps (quote → review → confirm) are UI steps only; they
 * are not financial states and nothing here invents one. A payout is COMPLETED
 * when the API says so, which happens only on a verified settlement webhook.
 *
 * Money is never computed in the browser. Every amount is rendered from the
 * API's `display` string, including the shortfall to the minimum.
 */

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, ArrowRight, Ban, CalendarClock, CheckCircle2, Clock,
  Coins, Loader2, Plus, Receipt, RefreshCw, Trash2, TrendingUp, Wallet,
} from "lucide-react";

import {
  addDestination, archiveDestination, cancelRequest, confirmRequest, daysUntil,
  describeApiError, describeBlock, getDashboard, getQuote, newIdempotencyKey,
  requestPayout,
} from "@/lib/api/payouts";

import styles from "./payouts.module.css";

/* =========================================================
   PRESENTATION HELPERS
========================================================= */

const STATUS_TONE = {
  COMPLETED: styles.badgeGood,
  PROCESSING: styles.badgeWarn,
  APPROVED: styles.badgeWarn,
  PENDING_REVIEW: styles.badgeWarn,
  AWAITING_RECONFIRM: styles.badgeWarn,
  REQUESTED: styles.badgeWarn,
  BLOCKED: styles.badgeBad,
  FAILED: styles.badgeBad,
  REJECTED: styles.badgeBad,
  RETURNED: styles.badgeBad,
  CANCELLED: styles.badgeNeutral,
};

/** Wording the member understands, keyed by the backend's own state names. */
const STATUS_WORDS = {
  REQUESTED: "Requested",
  VALIDATING: "Checking",
  PENDING_REVIEW: "Under review",
  AWAITING_RECONFIRM: "Needs your confirmation",
  BLOCKED: "On hold",
  APPROVED: "Approved",
  PROCESSING: "Sending",
  COMPLETED: "Paid",
  FAILED: "Failed",
  UNCLAIMED: "Unclaimed",
  RETURNED: "Returned",
  REJECTED: "Declined",
  CANCELLED: "Cancelled",
};

/** Ledger entry states, in the member's language rather than the ledger's. */
const ENTRY_WORDS = {
  PENDING: "Maturing",
  ELIGIBLE: "Ready to release",
  AVAILABLE: "Available",
  RESERVED: "In a withdrawal",
  PAID: "Paid",
  FROZEN: "On hold",
  REVERSED: "Reversed",
  CLAWED_BACK: "Reversed",
};

function StatusBadge({ status }) {
  return (
    <span className={`${styles.badge} ${STATUS_TONE[status] || styles.badgeNeutral}`}>
      {STATUS_WORDS[status] || String(status || "").replace(/_/g, " ")}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function Section({ icon: Icon, title, note, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>
          {Icon && <Icon size={18} aria-hidden />}
          {title}
        </h2>
        {note && <span className={styles.sectionNote}>{note}</span>}
      </div>
      {children}
    </section>
  );
}

function Figure({ icon: Icon, label, amount, hint, primary }) {
  return (
    <div className={`${styles.figure} ${primary ? styles.figurePrimary : ""}`}>
      <span className={styles.figureLabel}>
        {Icon && <Icon size={13} aria-hidden />} {label}
      </span>
      <span className={styles.figureValue}>{amount?.display ?? "—"}</span>
      {hint && <span className={styles.figureHint}>{hint}</span>}
    </div>
  );
}

/* =========================================================
   MAIN
========================================================= */

export function PayoutDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [busy, setBusy] = useState(false);

  // UI steps for the withdraw flow. NOT financial states — those live in the
  // backend and arrive on each request object.
  const [step, setStep] = useState("idle");     // idle | review
  const [quote, setQuote] = useState(null);
  const [destinationId, setDestinationId] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const next = await getDashboard({ limit: 50 });
      setData(next);
      const preferred =
        next.destinations.find((d) => d.isDefault && d.status === "VERIFIED") ||
        next.destinations.find((d) => d.status === "VERIFIED");
      setDestinationId((current) => current || preferred?.id || "");
    } catch (err) {
      const { message, isAuthError } = describeApiError(err, "Could not load your earnings.");
      setError(message);
      setNeedsSignIn(Boolean(isAuthError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const balance = data?.balance ?? null;
  const destinations = useMemo(
    () => (data?.destinations ?? []).filter((d) => d.status !== "ARCHIVED"),
    [data],
  );
  const requests = data?.requests ?? [];
  const entries = data?.entries ?? { count: 0, results: [] };

  const openRequest = requests.find((r) =>
    ["REQUESTED", "VALIDATING", "PENDING_REVIEW", "AWAITING_RECONFIRM",
     "BLOCKED", "APPROVED", "PROCESSING"].includes(r.status));

  const describeCodes = useCallback(
    (codes) => codes.map((c) => describeBlock(c, {
      minimum: balance?.minimumPayout?.display,
      shortfall: balance?.shortfallToMinimum?.minor > 0
        ? balance.shortfallToMinimum.display
        : null,
    })).join(" "),
    [balance],
  );

  const reportError = (err, fallback) => {
    const { message, codes } = describeApiError(err, fallback);
    setError(codes.length ? describeCodes(codes) : message);
  };

  /* ── Actions ──────────────────────────────────────────── */

  const handleQuote = async () => {
    if (!destinationId) return;
    setBusy(true); setError("");
    try {
      setQuote(await getQuote(destinationId));
      setStep("review");
    } catch (err) {
      reportError(err, "Could not prepare your withdrawal.");
    } finally { setBusy(false); }
  };

  const handleConfirm = async () => {
    if (!destinationId) return;
    setBusy(true); setError("");
    try {
      await requestPayout({ destinationId, idempotencyKey: newIdempotencyKey() });
      setQuote(null); setStep("idle");
      await refresh();
    } catch (err) {
      reportError(err, "Could not submit your withdrawal.");
    } finally { setBusy(false); }
  };

  const handleReconfirm = async (id) => {
    setBusy(true); setError("");
    try { await confirmRequest(id); await refresh(); }
    catch (err) { reportError(err, "Could not confirm the new amount."); }
    finally { setBusy(false); }
  };

  const handleCancel = async (id) => {
    setBusy(true); setError("");
    try { await cancelRequest(id); await refresh(); }
    catch (err) { reportError(err, "Could not cancel that withdrawal."); }
    finally { setBusy(false); }
  };

  const handleArchive = async (id) => {
    setBusy(true); setError("");
    try { await archiveDestination(id); await refresh(); }
    catch (err) { reportError(err, "Could not remove that destination."); }
    finally { setBusy(false); }
  };

  /* ── Render ───────────────────────────────────────────── */

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={18} className={styles.spin} aria-hidden />
        Loading your earnings…
      </div>
    );
  }

  if (!balance) {
    return (
      <div className={styles.error} role="alert">
        <AlertCircle size={16} aria-hidden />
        <span>{error || "No earnings information is available."}</span>
        {needsSignIn && (
          <a className={styles.button} href="/login"
             style={{ marginLeft: "var(--spacing-sm)", textDecoration: "none" }}>
            Sign in
          </a>
        )}
      </div>
    );
  }

  const daysToMaturity = daysUntil(balance.nextMaturityAt);
  const availableMinor = balance.available?.minor ?? 0;
  const minimumMinor = balance.minimumPayout?.minor ?? 0;
  const shortfallMinor = balance.shortfallToMinimum?.minor ?? 0;
  const progressPct = minimumMinor > 0
    ? Math.min(100, Math.round((availableMinor / minimumMinor) * 100))
    : 0;

  return (
    <div className={styles.wrap}>
      {error && (
        <div className={styles.error} role="alert">
          <AlertCircle size={16} aria-hidden />
          <span>{error}</span>
          {needsSignIn && (
            <a className={`${styles.button}`} href="/login"
               style={{ marginLeft: "var(--spacing-sm)", textDecoration: "none" }}>
              Sign in
            </a>
          )}
        </div>
      )}

      {/* ═══ EARNINGS ══════════════════════════════════════ */}
      <Section
        icon={TrendingUp}
        title="Your earnings"
        note={`Commission matures ${balance.maturityDays} days after the order`}
      >
        <div className={styles.figureGrid}>
          <Figure
            icon={Coins} label="Total earned" amount={balance.totalEarned}
            hint="Everything your network has ever earned you."
          />
          <Figure
            icon={Clock} label="Pending earnings" amount={balance.pending}
            hint={`Earned, still inside the ${balance.maturityDays}-day window that covers returns and refunds.`}
          />
          <Figure
            primary icon={Wallet} label="Available to withdraw" amount={balance.available}
            hint={`Minimum withdrawal is ${balance.minimumPayout?.display}.`}
          />
          <Figure
            icon={CheckCircle2} label="Paid out" amount={balance.paid}
            hint="Settled to your payout destination."
          />
        </div>

        {(balance.reserved?.minor ?? 0) > 0 && (
          <div className={styles.strip}>
            <ArrowRight size={15} className={styles.stripIcon} aria-hidden />
            <span className={styles.stripText}>
              <span className={styles.emphasis}>{balance.reserved.display}</span> is
              held for a withdrawal in progress and is not counted as available.
            </span>
          </div>
        )}

        {(balance.negativeBalance?.minor ?? 0) > 0 && (
          <div className={styles.strip}>
            <Ban size={15} className={styles.stripIcon} aria-hidden />
            <span className={styles.stripText}>
              A refund reversed more commission than your balance covered.{" "}
              <span className={styles.emphasis}>{balance.negativeBalance.display}</span>{" "}
              will be offset by future earnings before you can withdraw again.
            </span>
          </div>
        )}

        {/* Maturity — with a 180-day window this is the single most important
            thing on the page for a new member. */}
        {daysToMaturity !== null && (balance.pending?.minor ?? 0) > 0 && (
          <div className={styles.strip}>
            <CalendarClock size={15} className={styles.stripIcon} aria-hidden />
            <span className={styles.stripText}>
              Your next earnings become available in{" "}
              <span className={styles.emphasis}>{daysToMaturity} days</span>, on{" "}
              <span className={styles.emphasis}>{formatDate(balance.nextMaturityAt)}</span>.
              Commission is held until the return and refund window on the order has closed.
            </span>
          </div>
        )}

        {/* Minimum requirement, with the exact shortfall. */}
        {shortfallMinor > 0 && (
          <div className={styles.strip}>
            <Wallet size={15} className={styles.stripIcon} aria-hidden />
            <span className={styles.stripText}>
              You need <span className={styles.emphasis}>{balance.minimumPayout?.display}</span>{" "}
              available to withdraw. You have{" "}
              <span className={styles.emphasis}>{balance.available?.display}</span>, so{" "}
              <span className={styles.emphasis}>{balance.shortfallToMinimum?.display}</span> to go.
              <span className={styles.progressTrack} style={{ display: "block" }}>
                <span className={styles.progressFill} style={{ width: `${progressPct}%` }} />
              </span>
            </span>
          </div>
        )}
      </Section>

      {/* ═══ WITHDRAW ══════════════════════════════════════ */}
      <Section icon={Wallet} title="Withdraw your earnings">
        <div className={`${styles.card} ${styles.cardSoft}`}>
          {openRequest ? (
            <p className={styles.figureHint}>
              You have a withdrawal in progress — see <strong>Withdrawal history</strong> below.
              Only one withdrawal can be open at a time.
            </p>
          ) : balance.blockedReasons.length > 0 ? (
            <>
              <p className={styles.figureHint}>
                Withdrawal is not available yet. Here is exactly why:
              </p>
              <ul className={styles.blockList}>
                {balance.blockedReasons.map((code) => (
                  <li key={code} className={styles.blockItem}>
                    <AlertCircle size={15} className={styles.blockIcon} aria-hidden />
                    <span className={styles.blockText}>
                      {describeBlock(code, {
                        minimum: balance.minimumPayout?.display,
                        shortfall: shortfallMinor > 0
                          ? balance.shortfallToMinimum?.display : null,
                      })}
                    </span>
                  </li>
                ))}
              </ul>
              {destinations.length === 0 && (
                <div className={styles.actions}>
                  <button type="button" className={`${styles.button} ${styles.buttonGhost}`}
                          onClick={() => setShowAddForm(true)}>
                    <Plus size={15} /> Add a payout destination
                  </button>
                </div>
              )}
            </>
          ) : step === "idle" ? (
            <>
              <div className={styles.quoteRows}>
                <div className={styles.quoteRow}>
                  <span>Amount to withdraw</span>
                  <span className={styles.quoteAmount}>{balance.available?.display}</span>
                </div>
              </div>
              <p className={styles.figureHint}>
                Withdrawals cover your whole available balance. Earnings still
                maturing are not included and stay in Pending earnings.
              </p>

              <div className={styles.field} style={{ marginTop: "var(--spacing-md)" }}>
                <label htmlFor="destination">Send to</label>
                <select id="destination" value={destinationId}
                        onChange={(e) => setDestinationId(e.target.value)}>
                  {destinations.filter((d) => d.status === "VERIFIED").map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.displayHint || d.label} · {d.rail.replace("_", " ")} · {d.currency}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.button}
                        disabled={!destinationId || busy} onClick={handleQuote}>
                  {busy ? <Loader2 size={15} className={styles.spin} /> : <Wallet size={15} />}
                  Withdraw {balance.available?.display}
                </button>
              </div>
            </>
          ) : (
            /* ── Quote review: the member confirms the NET ── */
            <>
              <p className={styles.figureHint}>
                Check the amount you will receive before confirming.
              </p>
              <div className={styles.quoteRows}>
                <div className={styles.quoteRow}>
                  <span>Your earnings</span>
                  <span className={styles.quoteAmount}>{quote?.gross?.display}</span>
                </div>
                <div className={styles.quoteRow}>
                  <span>Transfer fee</span>
                  <span className={styles.quoteAmount}>−{quote?.fee?.display}</span>
                </div>
                {(quote?.withheldMinor ?? 0) > 0 && (
                  <div className={styles.quoteRow}>
                    <span>Tax withheld</span>
                    <span className={styles.quoteAmount}>−{quote?.withheld?.display}</span>
                  </div>
                )}
                <div className={`${styles.quoteRow} ${styles.quoteRowTotal}`}>
                  <span>You receive</span>
                  <span className={styles.quoteAmount}>{quote?.net?.display}</span>
                </div>
              </div>

              {quote?.targetAmount && quote.targetCurrency !== quote.currency && (
                <p className={styles.figureHint}>
                  Delivered as {quote.targetAmount.display}
                  {quote.rate ? ` at a rate of ${quote.rate}` : ""}.
                </p>
              )}

              <p className={styles.figureHint}>
                Transfer fees are quoted by the provider and can change. If the
                amount moves before we send it, we will ask you to confirm again.
              </p>

              <div className={styles.actions}>
                <button type="button" className={styles.button} disabled={busy}
                        onClick={handleConfirm}>
                  {busy ? <Loader2 size={15} className={styles.spin} /> : <ArrowRight size={15} />}
                  Confirm — send {quote?.net?.display}
                </button>
                <button type="button" className={`${styles.button} ${styles.buttonQuiet}`}
                        disabled={busy} onClick={() => { setStep("idle"); setQuote(null); }}>
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      </Section>

      {/* ═══ DESTINATIONS ══════════════════════════════════ */}
      <Section
        icon={Receipt} title="Payout destinations"
        note="We store only a reference from the provider, never your account number"
      >
        {destinations.length === 0 && !showAddForm && (
          <div className={styles.card}>
            <p className={styles.empty}>
              No payout destination yet. Add one so your earnings have somewhere to go.
            </p>
            <div className={styles.actions} style={{ marginTop: 0 }}>
              <button type="button" className={`${styles.button} ${styles.buttonGhost}`}
                      onClick={() => setShowAddForm(true)}>
                <Plus size={15} /> Add a destination
              </button>
            </div>
          </div>
        )}

        {destinations.length > 0 && (
          <ul className={styles.list}>
            {destinations.map((d) => (
              <li key={d.id} className={styles.destItem}>
                <div className={styles.destMeta}>
                  <span className={styles.destHint}>{d.displayHint || d.label}</span>
                  <span className={styles.destSub}>
                    {d.rail.replace("_", " ")} · {d.currency}
                    {d.isDefault ? " · default" : ""} · {d.status.toLowerCase()}
                  </span>
                </div>
                <button type="button" className={`${styles.button} ${styles.buttonQuiet}`}
                        disabled={busy} onClick={() => handleArchive(d.id)}
                        aria-label={`Remove ${d.displayHint || "destination"}`}>
                  <Trash2 size={14} /> Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {showAddForm ? (
          <div className={styles.card} style={{ marginTop: "var(--spacing-md)" }}>
            <AddDestinationForm
              onCancel={() => setShowAddForm(false)}
              onAdded={async () => { setShowAddForm(false); await refresh(); }}
            />
          </div>
        ) : destinations.length > 0 && (
          <div className={styles.actions}>
            <button type="button" className={`${styles.button} ${styles.buttonGhost}`}
                    onClick={() => setShowAddForm(true)}>
              <Plus size={15} /> Add another destination
            </button>
          </div>
        )}
      </Section>

      {/* ═══ HISTORY ═══════════════════════════════════════ */}
      <Section icon={Clock} title="Withdrawal history"
               note={requests.length ? `${requests.length} withdrawal(s)` : null}>
        {requests.length === 0 ? (
          <div className={styles.card}><p className={styles.empty}>
            You have not withdrawn yet.
          </p></div>
        ) : (
          <ul className={styles.list}>
            {requests.map((r) => (
              <li key={r.id} className={styles.historyItem}>
                <div className={styles.historyHead}>
                  <span className={styles.historyAmount}>{r.net?.display}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className={styles.destSub} style={{ marginTop: 4 }}>
                  Requested {formatDate(r.requestedAt)}
                  {r.destination?.displayHint ? ` · to ${r.destination.displayHint}` : ""}
                  {(r.fee?.minor ?? 0) > 0 ? ` · ${r.fee.display} fee` : ""}
                </p>

                {/* Re-confirmation: the quote moved, nothing has been sent. */}
                {r.requiresReconfirmation && (
                  <div className={styles.reconfirmBox}>
                    <p className={styles.figureHint} style={{ marginBottom: 10 }}>
                      <RefreshCw size={14} aria-hidden />{" "}
                      The transfer fee changed while this was being reviewed. You agreed to{" "}
                      <span className={styles.emphasis}>{r.confirmedNet?.display}</span>; the
                      amount is now <span className={styles.emphasis}>{r.net?.display}</span>.
                      Nothing has been sent.
                    </p>
                    <div className={styles.actions} style={{ marginTop: 0 }}>
                      <button type="button" className={styles.button} disabled={busy}
                              onClick={() => handleReconfirm(r.id)}>
                        {busy ? <Loader2 size={15} className={styles.spin} />
                              : <CheckCircle2 size={15} />}
                        Confirm {r.net?.display} and send
                      </button>
                      <button type="button" className={`${styles.button} ${styles.buttonQuiet}`}
                              disabled={busy} onClick={() => handleCancel(r.id)}>
                        Cancel instead
                      </button>
                    </div>
                  </div>
                )}

                {r.rejectionReason && (
                  <div className={styles.blockItem} style={{ marginTop: 12 }}>
                    <AlertCircle size={15} className={styles.blockIcon} aria-hidden />
                    <span className={styles.blockText}>{r.rejectionReason}</span>
                  </div>
                )}

                {r.timeline?.length > 0 && (
                  <ul className={styles.timeline}>
                    {r.timeline.map((s, i) => (
                      <li key={`${r.id}-${i}`} className={styles.timelineStep}>
                        <span className={`${styles.timelineDot} ${
                          s.state === "COMPLETED" ? styles.timelineDotDone : ""}`} aria-hidden />
                        <span className={styles.timelineLabel}>{s.label}</span>
                        <span className={styles.timelineTime}>{formatDateTime(s.at)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {["REQUESTED", "PENDING_REVIEW", "APPROVED"].includes(r.status)
                  && !r.requiresReconfirmation && (
                  <div className={styles.actions}>
                    <button type="button" className={`${styles.button} ${styles.buttonQuiet}`}
                            disabled={busy} onClick={() => handleCancel(r.id)}>
                      Cancel withdrawal
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ═══ STATEMENT ═════════════════════════════════════ */}
      <Section icon={Receipt} title="Earnings statement"
               note={`${entries.count} entr${entries.count === 1 ? "y" : "ies"}`}>
        <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
          {entries.results.length === 0 ? (
            <p className={styles.empty}>
              No commission earned yet. You earn when someone in your Chakan Tree buys tea.
            </p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order</th><th>Level</th>
                    <th className={styles.numeric}>Amount</th>
                    <th>Status</th><th>Available from</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.results.map((e) => (
                    <tr key={e.id}>
                      <td>{e.order || "—"}</td>
                      <td>{e.level ? `Level ${e.level}` : "Adjustment"}</td>
                      <td className={styles.numeric}>{e.amount?.display}</td>
                      <td>
                        <span className={`${styles.badge} ${
                          e.state === "PAID" ? styles.badgeGood
                          : e.state === "AVAILABLE" ? styles.badgeGood
                          : e.state === "PENDING" ? styles.badgeNeutral
                          : styles.badgeWarn}`}>
                          {ENTRY_WORDS[e.state] || e.state}
                        </span>
                      </td>
                      <td>{formatDate(e.maturesAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

/* =========================================================
   ADD DESTINATION

   Raw details go straight to the provider and are never stored by us — the
   provider returns a recipient id, and that plus a masked hint is all we keep.
========================================================= */

function AddDestinationForm({ onCancel, onAdded }) {
  const [rail, setRail] = useState("WISE");
  const [value, setValue] = useState("");
  const [holder, setHolder] = useState("");
  const [country, setCountry] = useState("KE");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true); setFormError("");
    try {
      await addDestination({
        rail, country, currency: "USD",
        type: rail === "WISE" ? "email" : "internal",
        account_holder_name: holder,
        details: rail === "WISE" ? { email: value } : {},
        is_default: true,
      });
      await onAdded();
    } catch (err) {
      setFormError(
        describeApiError(err, "The provider could not accept that destination.").message,
      );
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={submit}>
      <div className={styles.field}>
        <label htmlFor="rail">How would you like to be paid?</label>
        <select id="rail" value={rail} onChange={(e) => setRail(e.target.value)}>
          <option value="WISE">Bank transfer via Wise</option>
          <option value="STORE_CREDIT">Store credit</option>
        </select>
      </div>

      {rail === "WISE" ? (
        <>
          <div className={styles.field}>
            <label htmlFor="holder">Account holder name</label>
            <input id="holder" value={holder} required
                   onChange={(e) => setHolder(e.target.value)}
                   placeholder="As it appears on the account" />
          </div>
          <div className={styles.field}>
            <label htmlFor="value">Recipient email</label>
            <input id="value" type="email" value={value} required
                   onChange={(e) => setValue(e.target.value)}
                   placeholder="you@example.com" />
          </div>
          <div className={styles.field}>
            <label htmlFor="country">Country</label>
            <input id="country" value={country} maxLength={2}
                   onChange={(e) => setCountry(e.target.value.toUpperCase())} />
          </div>
        </>
      ) : (
        <p className={styles.figureHint}>
          Store credit is applied to your Chakancha account and can be spent on tea.
          No bank details are needed.
        </p>
      )}

      {formError && (
        <div className={styles.blockItem}>
          <AlertCircle size={15} className={styles.blockIcon} aria-hidden />
          <span className={styles.blockText}>{formError}</span>
        </div>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.button} disabled={submitting}>
          {submitting ? <Loader2 size={15} className={styles.spin} /> : <Plus size={15} />}
          Add destination
        </button>
        <button type="button" className={`${styles.button} ${styles.buttonQuiet}`}
                onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default PayoutDashboard;
