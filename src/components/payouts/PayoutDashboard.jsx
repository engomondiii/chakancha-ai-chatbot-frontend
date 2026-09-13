/**
 * src/components/payouts/PayoutDashboard.jsx
 *
 * The member cash-out experience, in one mental model:
 *
 *   My Chakan Tree earnings are USD. I withdraw USD to my bank account.
 *
 * The receiving currency, the route and the exchange rate are
 * resolved by Chakancha's backend and shown, never asked.
 *
 * This component owns data loading and the withdraw flow's UI steps. Those
 * steps (review → confirm) are not financial states: a payout's state comes
 * from the backend on each request object, and COMPLETED arrives only from a
 * verified settlement.
 *
 * The quote the member reviews is the quote they confirm. Confirming sends its
 * id; if the price no longer holds the API returns a new quote to review
 * instead of creating the withdrawal at a different price.
 */

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, Wallet } from "lucide-react";

import {
  archiveDestination, cancelRequest, confirmRequest, getDashboard, getQuote,
  newIdempotencyKey, normalizeQuote, payoutErrorOptions, requestPayout,
} from "@/lib/api/payouts";
import {
  describePayoutError, NEEDS_RECONFIRMATION_MESSAGE, PRICE_EXPIRED_MESSAGE, reconfirmReasons,
} from "@/lib/payouts/errors";

import { AddBankAccountForm } from "./AddBankAccountForm";
import { DestinationList } from "./DestinationList";
import { EarningsStatement } from "./EarningsStatement";
import { EarningsSummary } from "./EarningsSummary";
import { Section } from "./Section";
import { WithdrawCard } from "./WithdrawCard";
import { WithdrawalHistory } from "./WithdrawalHistory";
import { OPEN_STATES } from "./format";
import styles from "./payouts.module.css";

/** A refreshed price must be good for at least this long to replace an expired one automatically. */
const MIN_PRICE_HOLD_MS = 60 * 1000;
const PRICE_EXPIRED_REVIEW_AGAIN =
  "The price expired. Review your withdrawal again to see an updated one.";
/** Failures worth retrying from the same review; anything else closes it. */
const TRANSIENT_CODES = ["provider_error", "provider_temporarily_unavailable"];

function SignInLink() {
  return (
    <a className={styles.button} href="/login" style={{ marginLeft: "var(--spacing-sm)", textDecoration: "none" }}>
      Sign in
    </a>
  );
}

export function PayoutDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [destinationId, setDestinationId] = useState("");
  // { quote, key, notice, reasons } while the member is reviewing.
  const [review, setReview] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const busyRef = useRef(false);
  const reviewRef = useRef(review);
  useEffect(() => { reviewRef.current = review; }, [review]);

  const refresh = useCallback(async () => {
    try {
      const next = await getDashboard({ limit: 50 });
      setData(next);
      setLoadError(null);
      const verified = next.destinations.filter((d) => d.status === "VERIFIED");
      const preferred = verified.find((d) => d.isDefault) || verified[0];
      setDestinationId((current) =>
        verified.some((d) => d.id === current) ? current : preferred?.id || "");
    } catch (err) {
      setLoadError(describePayoutError(err, payoutErrorOptions()));
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
  const openRequest = requests.find((r) => OPEN_STATES.includes(r.status));
  const selectedDestination = destinations.find((d) => d.id === destinationId) ?? null;

  const errorContext = useMemo(() => ({
    available: balance?.available,
    minimum: balance?.minimumPayout,
    country_name: selectedDestination?.countryName || selectedDestination?.country,
    target_currency: selectedDestination?.currency,
    target_currency_name: selectedDestination?.currencyName,
  }), [balance, selectedDestination]);

  const explain = useCallback(
    (err) => describePayoutError(err, payoutErrorOptions(errorContext)),
    [errorContext],
  );

  /** One action at a time; a second click while one runs is ignored. */
  const withBusy = useCallback(async (fn) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setActionError(null);
    try {
      await fn();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const startReview = (quote, reviewNotice = "", reasons = [], { autoRefreshed = false } = {}) => {
    // A new key for every price the member reviews; the same key for every
    // retry of confirming that price.
    setReview({ quote, key: newIdempotencyKey(), notice: reviewNotice, reasons, autoRefreshed });
  };

  /* ── Actions ──────────────────────────────────────────── */

  const handleReview = () => withBusy(async () => {
    if (!destinationId) return;
    setNotice("");
    try {
      startReview(await getQuote(destinationId));
    } catch (err) {
      setActionError(explain(err));
    }
  });

  const handleConfirm = () => withBusy(async () => {
    const current = reviewRef.current;
    if (!current?.quote) return;
    try {
      await requestPayout({
        destinationId: current.quote.destination?.id || destinationId,
        quoteId: current.quote.quoteId,
        idempotencyKey: current.key,
      });
      setReview(null);
      setNotice("Your withdrawal has been requested.");
      await refresh();
    } catch (err) {
      const info = explain(err);
      if (info.code === "needs_reconfirmation" && info.quote) {
        startReview(normalizeQuote(info.quote), NEEDS_RECONFIRMATION_MESSAGE, reconfirmReasons(info.reasons));
      } else if (info.code === "open_request_exists") {
        setReview(null);
        setActionError(info);
        await refresh();
      } else {
        // A review that can no longer be confirmed (below minimum, unavailable,
        // blocked) must not keep an active Confirm button. Only a failure worth
        // retrying keeps it open.
        const transient = TRANSIENT_CODES.includes(info.code) || info.status == null || info.status === 429;
        if (!transient) setReview(null);
        setActionError(info);
      }
    }
  });

  const handleExpired = useCallback(() => {
    const current = reviewRef.current;
    if (!current || busyRef.current) return;
    if (current.autoRefreshed) {
      // One automatic refresh per review. A price that has expired again — a
      // skewed clock, an expiry already in the past — must not re-quote in a loop.
      setReview(null);
      setNotice(PRICE_EXPIRED_REVIEW_AGAIN);
      return;
    }
    const id = current.quote.destination?.id || destinationId;
    withBusy(async () => {
      try {
        const fresh = await getQuote(id);
        const holdsFor = fresh.expiresAt ? new Date(fresh.expiresAt).getTime() - Date.now() : Infinity;
        if (!(holdsFor > MIN_PRICE_HOLD_MS)) {
          setReview(null);
          setNotice(PRICE_EXPIRED_REVIEW_AGAIN);
          return;
        }
        startReview(fresh, PRICE_EXPIRED_MESSAGE, [], { autoRefreshed: true });
      } catch (err) {
        setReview(null);
        setActionError(explain(err));
      }
    });
  }, [destinationId, explain, withBusy]);

  const handleReconfirm = (id) => withBusy(async () => {
    try {
      await confirmRequest(id);
      setNotice("Thanks — your withdrawal is going ahead at the new amount.");
      await refresh();
    } catch (err) {
      setActionError(explain(err));
    }
  });

  const handleCancel = (id) => withBusy(async () => {
    try {
      await cancelRequest(id);
      setNotice("Withdrawal cancelled. Your earnings are available again.");
      await refresh();
    } catch (err) {
      setActionError(explain(err));
    }
  });

  const handleRemove = (id) => withBusy(async () => {
    try {
      await archiveDestination(id);
      if (id === destinationId) setReview(null);
      setNotice("Bank account removed.");
      await refresh();
    } catch (err) {
      setActionError(explain(err));
    }
  });

  const openAddForm = () => {
    setShowAddForm(true);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() =>
        document.getElementById("payout-destinations")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const handleAdded = async (destination) => {
    setShowAddForm(false);
    setNotice("Bank account added.");
    await refresh();
    if (destination?.id && destination.status === "VERIFIED") setDestinationId(destination.id);
  };

  /* ── Render ───────────────────────────────────────────── */

  if (loading) {
    return (
      <div className={styles.loading} role="status">
        <Loader2 size={18} className={styles.spin} aria-hidden />
        Loading your earnings…
      </div>
    );
  }

  if (!balance) {
    return (
      <div className={styles.error} role="alert">
        <AlertCircle size={16} aria-hidden />
        <span>{loadError?.message || "No earnings information is available."}</span>
        {loadError?.isAuthError && <SignInLink />}
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div aria-live="polite" role="status" className={notice ? styles.notice : styles.srOnly}>
        {notice}
      </div>

      {[loadError, actionError].filter(Boolean).map((info, i) => (
        <div key={i} className={styles.error} role="alert">
          <AlertCircle size={16} aria-hidden />
          <span>{info.message}</span>
          {info.isAuthError && <SignInLink />}
        </div>
      ))}

      <EarningsSummary balance={balance} />

      <Section id="payout-withdraw" icon={Wallet} title="Withdraw your earnings">
        <WithdrawCard
          balance={balance}
          destinations={destinations}
          destinationId={destinationId}
          onDestinationChange={(id) => { setDestinationId(id); setReview(null); }}
          openRequest={openRequest}
          review={review}
          busy={busy}
          onReview={handleReview}
          onConfirm={handleConfirm}
          onBack={() => setReview(null)}
          onExpired={handleExpired}
          onAddBank={openAddForm}
        />
      </Section>

      <DestinationList
        destinations={destinations}
        busy={busy}
        onRemove={handleRemove}
        onAdd={openAddForm}
        form={showAddForm ? (
          <AddBankAccountForm onCancel={() => setShowAddForm(false)} onAdded={handleAdded} />
        ) : null}
      />

      <WithdrawalHistory
        requests={requests}
        busy={busy}
        onReconfirm={handleReconfirm}
        onCancel={handleCancel}
      />

      <EarningsStatement entries={entries} />
    </div>
  );
}

export default PayoutDashboard;
