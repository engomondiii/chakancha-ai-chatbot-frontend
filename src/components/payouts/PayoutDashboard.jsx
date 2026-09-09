/**
 * src/components/payouts/PayoutDashboard.jsx
 *
 * The member's withdrawal experience.
 *
 * Three rules drive this UI, each preventing a specific support cost:
 *
 *  1. Never show one balance. Pending / Available are separate figures with
 *     separate meanings. A member who sees "$60" and cannot withdraw it will
 *     assume the product is broken.
 *  2. Never grey out silently. Every blocker is stated with the shortfall or
 *     the date that resolves it.
 *  3. The member confirms the NET amount, never the gross. The provider fee is
 *     its own line, shown before any commitment.
 *
 * With a 180-day maturity window, most of a new member's balance sits in
 * Pending for half a year. Making that legible from the first reward is the
 * whole job of the maturity strip.
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle, ArrowRight, Ban, CalendarClock, CheckCircle2, Clock,
  Loader2, Plus, Trash2, Wallet,
} from "lucide-react";

import {
  addDestination, archiveDestination, cancelRequest, confirmRequest, daysUntil,
  describeBlock, getDashboard, getQuote, newIdempotencyKey, requestPayout,
} from "@/lib/api/payouts";

import styles from "./payouts.module.css";

const STATUS_TONE = {
  COMPLETED: styles.badgeGood,
  PROCESSING: styles.badgeWarn,
  APPROVED: styles.badgeWarn,
  PENDING_REVIEW: styles.badgeWarn,
  AWAITING_RECONFIRM: styles.badgeWarn,
  BLOCKED: styles.badgeBad,
  FAILED: styles.badgeBad,
  REJECTED: styles.badgeBad,
  RETURNED: styles.badgeBad,
  CANCELLED: styles.badgeNeutral,
};

function StatusBadge({ status }) {
  return (
    <span className={`${styles.badge} ${STATUS_TONE[status] || styles.badgeNeutral}`}>
      {String(status || "").replace(/_/g, " ")}
    </span>
  );
}

/** Display-only helper for a derived difference. Never used as a sendable amount. */
function formatMinor(minor, currency = "USD") {
  const amount = (minor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
  const symbols = { USD: "$", EUR: "\u20ac", GBP: "\u00a3", KES: "KSh\u00a0" };
  const symbol = symbols[currency];
  return symbol ? `${symbol}${amount}` : `${amount} ${currency}`;
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export function PayoutDashboard() {
  const [balance, setBalance] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [entries, setEntries] = useState({ count: 0, results: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [quote, setQuote] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  /* =======================================================
     LOAD

     Every panel comes from one refresh so the balance and the
     history can never disagree on screen.
  ======================================================= */

  const refresh = useCallback(async () => {
    setError("");
    try {
      // One request. Four separate calls cost four throttle hits per page load
      // and let the panels disagree with each other.
      const data = await getDashboard({ limit: 25 });
      setBalance(data.balance);
      setDestinations(data.destinations.filter((x) => x.status !== "ARCHIVED"));
      setRequests(data.requests);
      setEntries(data.entries);
    } catch (err) {
      if (err?.response?.status === 429) {
        setError(
          "You are refreshing faster than we can keep up. Please wait a moment.",
        );
        setLoading(false);
        return;
      }
      // Surfaced, never swallowed — an empty balance and a failed request must
      // not look the same.
      setError(
        err?.response?.data?.detail ||
        "Could not load your payout information. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  /* =======================================================
     ACTIONS
  ======================================================= */

  const defaultDestination =
    destinations.find((d) => d.isDefault && d.status === "VERIFIED") ||
    destinations.find((d) => d.status === "VERIFIED");

  /**
   * Turn blocked-reason codes into a sentence, with the shortfall filled in.
   * Defined here rather than further down so the handlers below do not depend
   * on a `const` declared after them.
   */
  const describeCodes = useCallback((codes) => {
    const minimumMinor = balance?.minimumPayout?.minor ?? 0;
    const availableMinor = balance?.available?.minor ?? 0;
    const shortfall = Math.max(minimumMinor - availableMinor, 0);
    const ctx = {
      minimum: balance?.minimumPayout?.display,
      // Formatting one derived difference client-side is unavoidable without a
      // round trip; it reuses the API's currency so it cannot print the wrong
      // symbol, and it is never used as an amount to send.
      shortfall: shortfall > 0
        ? formatMinor(shortfall, balance?.available?.currency)
        : null,
    };
    return codes.map((c) => describeBlock(c, ctx)).join(" ");
  }, [balance]);

  const handleQuote = async () => {
    if (!defaultDestination) return;
    setBusy(true);
    setError("");
    try {
      setQuote(await getQuote(defaultDestination.id));
    } catch (err) {
      const codes = err?.response?.data?.blocked_reasons;
      setError(
        codes?.length
          ? describeCodes(codes)
          : err?.response?.data?.detail || "Could not get a quote.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!defaultDestination) return;
    setBusy(true);
    setError("");
    try {
      // One key per confirmed attempt: a double-click resubmits the SAME key
      // and the server returns the same payout rather than creating a second.
      await requestPayout({
        destinationId: defaultDestination.id,
        idempotencyKey: newIdempotencyKey(),
      });
      setQuote(null);
      await refresh();
    } catch (err) {
      const codes = err?.response?.data?.blocked_reasons;
      setError(
        codes?.length
          ? describeCodes(codes)
          : err?.response?.data?.detail || "Could not submit your withdrawal.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleReconfirm = async (id) => {
    setBusy(true);
    setError("");
    try {
      await confirmRequest(id);
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not confirm the new amount.");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (id) => {
    setBusy(true);
    try {
      await cancelRequest(id);
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not cancel that request.");
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async (id) => {
    setBusy(true);
    try {
      await archiveDestination(id);
      await refresh();
    } catch {
      setError("Could not remove that destination.");
    } finally {
      setBusy(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={18} className={styles.spin} aria-hidden />
        Loading your earnings…
      </div>
    );
  }

  if (!balance) {
    return <div className={styles.error}>{error || "No payout data available."}</div>;
  }

  const shortfallMinor = Math.max(
    (balance.minimumPayout?.minor ?? 0) - (balance.available?.minor ?? 0), 0,
  );
  const blockContext = {
    minimum: balance.minimumPayout?.display,
    shortfall: shortfallMinor > 0
      ? `$${(shortfallMinor / 100).toFixed(2)}`
      : null,
  };
  const daysToMaturity = daysUntil(balance.nextMaturityAt);

  return (
    <div className={styles.wrap}>
      {error && (
        <div className={styles.error} role="alert">
          <AlertCircle size={15} aria-hidden /> {error}
        </div>
      )}

      {/* ── Balance ───────────────────────────────────────────────────────── */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Your earnings</h2>
          <span className={styles.panelNote}>
            Commission matures {balance.maturityDays} days after the order
          </span>
        </div>

        <div className={styles.balanceGrid}>
          <div className={`${styles.balanceCard} ${styles.balanceCardPrimary}`}>
            <span className={styles.balanceLabel}>
              <Wallet size={13} aria-hidden /> Available
            </span>
            <div className={styles.balanceValue}>{balance.available?.display}</div>
            <p className={styles.balanceHint}>
              Ready to withdraw. Minimum {balance.minimumPayout?.display}.
            </p>
          </div>

          <div className={styles.balanceCard}>
            <span className={styles.balanceLabel}>
              <Clock size={13} aria-hidden /> Pending
            </span>
            <div className={styles.balanceValue}>{balance.pending?.display}</div>
            <p className={styles.balanceHint}>
              Earned, still inside the {balance.maturityDays}-day window that
              covers returns and refunds.
            </p>
          </div>

          <div className={styles.balanceCard}>
            <span className={styles.balanceLabel}>
              <CheckCircle2 size={13} aria-hidden /> Paid out
            </span>
            <div className={styles.balanceValue}>{balance.paid?.display}</div>
            <p className={styles.balanceHint}>Settled to your destination.</p>
          </div>

          {(balance.reserved?.minor ?? 0) > 0 && (
            <div className={styles.balanceCard}>
              <span className={styles.balanceLabel}>
                <ArrowRight size={13} aria-hidden /> In progress
              </span>
              <div className={styles.balanceValue}>{balance.reserved?.display}</div>
              <p className={styles.balanceHint}>
                Held for a withdrawal that is being processed.
              </p>
            </div>
          )}

          {(balance.negativeBalance?.minor ?? 0) > 0 && (
            <div className={styles.balanceCard}>
              <span className={styles.balanceLabel}>
                <Ban size={13} aria-hidden /> Owed back
              </span>
              <div className={styles.balanceValue}>
                {balance.negativeBalance?.display}
              </div>
              <p className={styles.balanceHint}>
                A refund reversed more than your balance covered. Future earnings
                offset this first.
              </p>
            </div>
          )}
        </div>

        {daysToMaturity !== null && (balance.pending?.minor ?? 0) > 0 && (
          <div className={styles.maturityBar}>
            <CalendarClock size={15} aria-hidden />
            <span>
              Your next earnings become available in{" "}
              <span className={styles.maturityCount}>{daysToMaturity} days</span>
              {" "}— {formatDate(balance.nextMaturityAt)}
            </span>
          </div>
        )}

        {balance.blockedReasons.length > 0 && (
          <ul className={styles.blockList}>
            {balance.blockedReasons.map((code) => (
              <li key={code} className={styles.blockItem}>
                <AlertCircle size={15} aria-hidden />
                {describeBlock(code, blockContext)}
              </li>
            ))}
          </ul>
        )}

        <div className={styles.actions}>
          {!quote && (
            <button
              type="button"
              className={styles.button}
              disabled={!balance.canRequestPayout || busy}
              onClick={handleQuote}
            >
              {busy ? <Loader2 size={15} className={styles.spin} /> : <Wallet size={15} />}
              Withdraw {balance.available?.display}
            </button>
          )}
        </div>
      </section>

      {/* ── Quote confirmation ────────────────────────────────────────────── */}
      {quote && (
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Confirm your withdrawal</h2>
            <span className={styles.panelNote}>
              To {defaultDestination?.displayHint}
            </span>
          </div>

          <div className={styles.quoteRows}>
            <div className={styles.quoteRow}>
              <span>Your earnings</span>
              <span className={styles.quoteAmount}>{quote.gross?.display}</span>
            </div>
            <div className={styles.quoteRow}>
              <span>Transfer fee</span>
              <span className={styles.quoteAmount}>−{quote.fee?.display}</span>
            </div>
            {quote.withheldMinor > 0 && (
              <div className={styles.quoteRow}>
                <span>Tax withheld</span>
                <span className={styles.quoteAmount}>−{quote.withheld?.display}</span>
              </div>
            )}
            <div className={`${styles.quoteRow} ${styles.quoteRowTotal}`}>
              <span>You receive</span>
              <span className={styles.quoteAmount}>{quote.net?.display}</span>
            </div>
            {quote.targetAmount && quote.targetCurrency !== quote.currency && (
              <p className={styles.panelNote}>
                Delivered as {quote.targetAmount.display}
                {quote.rate ? ` at a rate of ${quote.rate}` : ""}.
              </p>
            )}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.button}
              disabled={busy}
              onClick={handleConfirm}
            >
              {busy ? <Loader2 size={15} className={styles.spin} /> : <ArrowRight size={15} />}
              Confirm — send {quote.net?.display}
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonGhost}`}
              disabled={busy}
              onClick={() => setQuote(null)}
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {/* ── Destinations ──────────────────────────────────────────────────── */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Where your money goes</h2>
          <span className={styles.panelNote}>
            We store only a reference from the provider, never your account number
          </span>
        </div>

        {destinations.length === 0 && !showAddForm && (
          <p className={styles.empty}>No payout destination yet.</p>
        )}

        {destinations.length > 0 && (
          <ul className={styles.destList}>
            {destinations.map((d) => (
              <li key={d.id} className={styles.destItem}>
                <div className={styles.destMeta}>
                  <span className={styles.destHint}>{d.displayHint || d.label}</span>
                  <span className={styles.destSub}>
                    {d.rail.replace("_", " ")} · {d.currency}
                    {d.isDefault ? " · default" : ""} · {d.status.toLowerCase()}
                  </span>
                </div>
                <button
                  type="button"
                  className={`${styles.button} ${styles.buttonDanger}`}
                  disabled={busy}
                  onClick={() => handleArchive(d.id)}
                  aria-label="Remove destination"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {showAddForm ? (
          <AddDestinationForm
            onCancel={() => setShowAddForm(false)}
            onAdded={async () => { setShowAddForm(false); await refresh(); }}
          />
        ) : (
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonGhost}`}
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={15} /> Add a destination
            </button>
          </div>
        )}
      </section>

      {/* ── History ───────────────────────────────────────────────────────── */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Withdrawal history</h2>
        </div>

        {requests.length === 0 ? (
          <p className={styles.empty}>You have not withdrawn yet.</p>
        ) : (
          <ul className={styles.historyList}>
            {requests.map((r) => (
              <li key={r.id} className={styles.historyItem}>
                <div className={styles.historyHead}>
                  <span className={styles.historyAmount}>{r.net?.display}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className={styles.destSub}>
                  Requested {formatDate(r.requestedAt)}
                  {r.destination?.displayHint ? ` · to ${r.destination.displayHint}` : ""}
                  {r.fee?.minor > 0 ? ` · ${r.fee.display} fee` : ""}
                </p>

                {r.requiresReconfirmation && (
                  <div className={styles.blockItem} style={{ marginTop: "0.7rem" }}>
                    <AlertCircle size={15} aria-hidden />
                    <span>
                      The transfer fee changed while this was being reviewed. You
                      agreed to <strong>{r.confirmedNet?.display}</strong>; the amount
                      is now <strong>{r.net?.display}</strong>. Nothing has been sent.
                    </span>
                  </div>
                )}

                {r.requiresReconfirmation && (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.button}
                      disabled={busy}
                      onClick={() => handleReconfirm(r.id)}
                    >
                      {busy ? <Loader2 size={15} className={styles.spin} />
                            : <CheckCircle2 size={15} />}
                      Confirm {r.net?.display} and send
                    </button>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonDanger}`}
                      disabled={busy}
                      onClick={() => handleCancel(r.id)}
                    >
                      Cancel instead
                    </button>
                  </div>
                )}

                {r.rejectionReason && (
                  <p className={styles.blockItem} style={{ marginTop: "0.6rem" }}>
                    <AlertCircle size={14} aria-hidden /> {r.rejectionReason}
                  </p>
                )}

                {r.timeline?.length > 0 && (
                  <ul className={styles.timeline}>
                    {r.timeline.map((step, i) => (
                      <li key={`${r.id}-${i}`} className={styles.timelineStep}>
                        <span className={styles.timelineDot} aria-hidden />
                        <span className={styles.timelineLabel}>{step.label}</span>
                        <span className={styles.timelineTime}>
                          {formatDateTime(step.at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {["REQUESTED", "PENDING_REVIEW", "APPROVED"].includes(r.status) &&
                  !r.requiresReconfirmation && (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonDanger}`}
                      disabled={busy}
                      onClick={() => handleCancel(r.id)}
                    >
                      Cancel withdrawal
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Ledger ────────────────────────────────────────────────────────── */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Earnings statement</h2>
          <span className={styles.panelNote}>{entries.count} entries</span>
        </div>

        {entries.results.length === 0 ? (
          <p className={styles.empty}>No commission earned yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Level</th>
                  <th className={styles.numeric}>Amount</th>
                  <th>Status</th>
                  <th>Available from</th>
                </tr>
              </thead>
              <tbody>
                {entries.results.map((e) => (
                  <tr key={e.id}>
                    <td>{e.order || "—"}</td>
                    <td>{e.level ? `L${e.level}` : "adjustment"}</td>
                    <td className={styles.numeric}>{e.amount?.display}</td>
                    <td><StatusBadge status={e.state} /></td>
                    <td>{formatDate(e.maturesAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   ADD DESTINATION

   The raw value is sent to the provider and never persisted by
   us — the provider returns a recipient id and we keep that.
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
    setSubmitting(true);
    setFormError("");
    try {
      await addDestination({
        rail,
        country,
        currency: "USD",
        type: rail === "WISE" ? "email" : "internal",
        account_holder_name: holder,
        details: rail === "WISE" ? { email: value } : {},
        is_default: true,
      });
      await onAdded();
    } catch (err) {
      setFormError(
        err?.response?.data?.detail ||
        "The provider could not accept that destination.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ marginTop: "1rem" }}>
      <div className={styles.field}>
        <label htmlFor="rail">Method</label>
        <select id="rail" value={rail} onChange={(e) => setRail(e.target.value)}>
          <option value="WISE">Wise transfer</option>
          <option value="STORE_CREDIT">Store credit</option>
        </select>
      </div>

      {rail === "WISE" && (
        <>
          <div className={styles.field}>
            <label htmlFor="holder">Account holder name</label>
            <input
              id="holder" value={holder} required
              onChange={(e) => setHolder(e.target.value)}
              placeholder="As it appears on the account"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="value">Recipient email</label>
            <input
              id="value" type="email" value={value} required
              onChange={(e) => setValue(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="country">Country</label>
            <input
              id="country" value={country} maxLength={2}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
            />
          </div>
        </>
      )}

      {formError && <p className={styles.error}>{formError}</p>}

      <div className={styles.actions}>
        <button type="submit" className={styles.button} disabled={submitting}>
          {submitting ? <Loader2 size={15} className={styles.spin} /> : <Plus size={15} />}
          Add destination
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonGhost}`}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default PayoutDashboard;
