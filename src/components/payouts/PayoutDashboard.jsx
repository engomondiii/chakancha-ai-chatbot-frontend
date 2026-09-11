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
  describeApiError, describeBlock, getCorridors, getDashboard,
  getDestinationRequirements, getQuote, newIdempotencyKey,
  refineDestinationRequirements, requestPayout, validateRequirementField,
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

/**
 * Splits one flat form into the three shapes the API expects.
 *
 * The provider describes its fields with dotted keys — 'address.city' belongs
 * to the holder's address, 'legalType' says whether the account is personal or
 * a business, and everything else identifies the account itself. Keeping them
 * flat in the form and separating them here means the form never has to know
 * which is which, so a field the provider adds later needs no special case.
 */
function splitDestinationFields(values) {
  const details = {};
  const address = {};
  let legalType = "";

  Object.entries(values).forEach(([key, value]) => {
    if (value === "" || value == null) return;
    if (key.startsWith("address.")) address[key.slice("address.".length)] = value;
    else if (key === "legalType") legalType = value;
    else details[key] = value;
  });

  return { details, address, legalType };
}

/**
 * Currencies, with the ones that suit this country first.
 *
 * A hint, not a filter. The provider's country keywords are a search index, so
 * a member in Kenya sees KES and USD at the top and everything else below —
 * never a shorter list of what someone here decided Kenyans may choose.
 */
function orderCurrencies(currencies, country) {
  if (!country) return currencies;
  const suited = [];
  const rest = [];
  currencies.forEach((c) => {
    (c.countryHints?.includes(country) ? suited : rest).push(c);
  });
  return [...suited, ...rest];
}

function AddDestinationForm({ onCancel, onAdded }) {
  const [method, setMethod] = useState("BANK");

  const [corridors, setCorridors] = useState(null);
  const [loadingCorridors, setLoadingCorridors] = useState(false);

  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");

  const [requirements, setRequirements] = useState(null);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [reqError, setReqError] = useState("");

  const [accountType, setAccountType] = useState("");
  const [values, setValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [holder, setHolder] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // The country and currency lists come from the provider, once per form.
  useEffect(() => {
    if (method !== "BANK" || corridors) return;
    let cancelled = false;
    setLoadingCorridors(true);
    getCorridors()
      .then((c) => { if (!cancelled) setCorridors(c); })
      .catch((err) => {
        if (!cancelled) {
          setReqError(describeApiError(err, "Could not load the list of countries.").message);
        }
      })
      .finally(() => { if (!cancelled) setLoadingCorridors(false); });
    return () => { cancelled = true; };
  }, [method, corridors]);

  // Requirements depend on the currency, so they are re-asked whenever it
  // changes — and reset, because fields from the previous corridor mean
  // nothing in this one.
  useEffect(() => {
    if (method !== "BANK" || !currency) { setRequirements(null); return; }
    let cancelled = false;
    setLoadingReqs(true); setReqError(""); setRequirements(null);
    setAccountType(""); setValues({}); setFieldErrors({});
    getDestinationRequirements(currency)
      .then((reqs) => {
        if (cancelled) return;
        setRequirements(reqs);
        setAccountType(reqs.types[0]?.type ?? "");
      })
      .catch((err) => {
        if (cancelled) return;
        setReqError(describeApiError(err,
          "Could not load the details needed for this currency.").message);
      })
      .finally(() => { if (!cancelled) setLoadingReqs(false); });
    return () => { cancelled = true; };
  }, [method, currency]);

  const selectedType = requirements?.types.find((t) => t.type === accountType) ?? null;
  const fields = selectedType?.fields ?? [];
  const payable = requirements?.available !== false;

  // The member already told us their country; the address field asking again
  // is the provider's question, not a second decision.
  useEffect(() => {
    if (!country) return;
    const hasCountryField = fields.some((f) => f.key === "address.country");
    if (hasCountryField && !values["address.country"]) {
      setValues((prev) => ({ ...prev, "address.country": country }));
    }
  }, [country, fields, values]);

  /**
   * Re-ask the provider when a field it flagged changes.
   *
   * Some answers change which other fields are required. Continuing to render
   * the first reply would show a field set for a question no longer being
   * asked, and the member would only find out when the account was rejected.
   */
  const refresh = useCallback(async (nextValues) => {
    if (!currency || !accountType) return;
    setLoadingReqs(true);
    try {
      const { details, address, legalType } = splitDestinationFields(nextValues);
      const reqs = await refineDestinationRequirements({
        currency,
        type: accountType,
        details: { ...details, ...(legalType ? { legalType } : {}),
                   ...Object.fromEntries(Object.entries(address)
                     .map(([k, v]) => [`address.${k}`, v])) },
      });
      setRequirements(reqs);
    } catch (err) {
      setReqError(describeApiError(err, "Could not refresh the required details.").message);
    } finally {
      setLoadingReqs(false);
    }
  }, [currency, accountType]);

  const setValue = (field, v) => {
    const next = { ...values, [field.key]: v };
    setValues(next);
    setFieldErrors((prev) => ({ ...prev, [field.key]: "" }));
    if (field.refreshRequirementsOnChange) refresh(next);
  };

  const validateAll = () => {
    const errors = {};
    fields.forEach((f) => {
      const msg = validateRequirementField(f, values[f.key]);
      if (msg) errors[f.key] = msg;
    });
    // The provider rejects a single-word holder name outright, which is a rule
    // it does not publish in the field list.
    if (holder.trim().split(/\s+/).length < 2) {
      errors.__holder = "Enter the first and last name on the account.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (method === "BANK" && !validateAll()) return;

    setSubmitting(true);
    try {
      if (method === "STORE_CREDIT") {
        await addDestination({
          rail: "STORE_CREDIT", currency: "USD", type: "internal",
          account_holder_name: holder, details: {}, is_default: true,
        });
      } else {
        const { details, address, legalType } = splitDestinationFields(values);
        await addDestination({
          rail: "WISE",
          currency,
          country: address.country || country,
          type: accountType,
          account_holder_name: holder,
          details,
          address,
          legal_type: legalType,
          is_default: true,
        });
      }
      await onAdded();
    } catch (err) {
      setFormError(
        describeApiError(err, "Those account details could not be accepted.").message,
      );
    } finally { setSubmitting(false); }
  };

  const currencyChoices = orderCurrencies(corridors?.currencies ?? [], country);

  return (
    <form onSubmit={submit}>
      <div className={styles.field}>
        <label htmlFor="method">How would you like to receive your money?</label>
        <select id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="BANK">Bank account</option>
          <option value="STORE_CREDIT">Store credit</option>
        </select>
        <p className={styles.figureHint}>
          {method === "BANK"
            ? "Receive your earnings directly in your bank account."
            : "Store credit is applied to your Chakancha account and can be spent on tea."}
        </p>
      </div>

      <div className={styles.field}>
        <label htmlFor="holder">Account holder name</label>
        <input id="holder" value={holder} required
               onChange={(e) => { setHolder(e.target.value);
                                  setFieldErrors((p) => ({ ...p, __holder: "" })); }}
               placeholder="First and last name, as on the account" />
        {fieldErrors.__holder && (
          <p className={styles.figureHint}>{fieldErrors.__holder}</p>
        )}
      </div>

      {method === "BANK" && (
        <>
          {loadingCorridors && (
            <p className={styles.figureHint}>
              <Loader2 size={14} className={styles.spin} /> Loading countries…
            </p>
          )}

          <div className={styles.field}>
            <label htmlFor="country">Which country is your bank account in?</label>
            <select id="country" value={country}
                    onChange={(e) => { setCountry(e.target.value); setCurrency(""); }}>
              <option value="">Choose a country…</option>
              {(corridors?.countries ?? []).map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {country && (
            <div className={styles.field}>
              <label htmlFor="currency">Which currency should we send?</label>
              <select id="currency" value={currency}
                      onChange={(e) => setCurrency(e.target.value)}>
                <option value="">Choose a currency…</option>
                {currencyChoices.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {loadingReqs && (
            <p className={styles.figureHint}>
              <Loader2 size={14} className={styles.spin} /> Checking what we need…
            </p>
          )}

          {reqError && (
            <div className={styles.blockItem}>
              <AlertCircle size={15} className={styles.blockIcon} aria-hidden />
              <span className={styles.blockText}>{reqError}</span>
            </div>
          )}

          {/* The provider's own words. A member told "the smallest amount a
              recipient can get is 100 KES" can act on it; a generic failure
              after they had filled the whole form tells them nothing. */}
          {requirements && !payable && (
            <div className={styles.blockItem}>
              <AlertCircle size={15} className={styles.blockIcon} aria-hidden />
              <span className={styles.blockText}>
                We cannot send {currency} for this amount right now.
                {requirements.disabledReason ? ` ${requirements.disabledReason}` : ""}
                {" "}Choose another currency.
              </span>
            </div>
          )}

          {requirements && payable && requirements.types.length > 1 && (
            <div className={styles.field}>
              <label htmlFor="accountType">Account type</label>
              <select id="accountType" value={accountType}
                      onChange={(e) => { setAccountType(e.target.value);
                                         setValues({}); setFieldErrors({}); }}>
                {requirements.types.map((t) => (
                  <option key={t.type} value={t.type}>{t.title}</option>
                ))}
              </select>
            </div>
          )}

          {selectedType?.usageInfo && (
            <p className={styles.figureHint}>{selectedType.usageInfo}</p>
          )}

          {payable && fields.map((field) => (
            <div className={styles.field} key={field.key}>
              <label htmlFor={field.key}>{field.name}</label>
              {field.valuesAllowed.length > 0 ? (
                <select id={field.key} value={values[field.key] ?? ""}
                        onChange={(e) => setValue(field, e.target.value)}>
                  <option value="">Choose…</option>
                  {field.valuesAllowed.filter((o) => o.key).map((o) => (
                    <option key={o.key} value={o.key}>{o.name || o.key}</option>
                  ))}
                </select>
              ) : (
                <input id={field.key}
                       value={values[field.key] ?? ""}
                       placeholder={field.displayFormat || field.example || ""}
                       maxLength={field.maxLength ?? undefined}
                       onChange={(e) => setValue(field, e.target.value)}
                       onBlur={() => setFieldErrors((prev) => ({
                         ...prev,
                         [field.key]: validateRequirementField(field, values[field.key]),
                       }))} />
              )}
              {fieldErrors[field.key] && (
                <p className={styles.figureHint}>{fieldErrors[field.key]}</p>
              )}
            </div>
          ))}
        </>
      )}

      {formError && (
        <div className={styles.blockItem}>
          <AlertCircle size={15} className={styles.blockIcon} aria-hidden />
          <span className={styles.blockText}>{formError}</span>
        </div>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.button}
                disabled={submitting ||
                          (method === "BANK" && (!payable || !accountType || !currency))}>
          {submitting ? <Loader2 size={15} className={styles.spin} /> : <Plus size={15} />}
          Save account
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
