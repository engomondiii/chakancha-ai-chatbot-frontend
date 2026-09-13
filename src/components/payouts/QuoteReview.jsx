/**
 * src/components/payouts/QuoteReview.jsx
 *
 * The member reviews a USD withdrawal. Every figure is the backend's live quote,
 * rendered from its display strings — the browser calculates nothing. The button
 * confirms the USD amount; converting it is not the member's job.
 */

"use client";

import React, { useEffect } from "react";
import { ArrowRight, Loader2, RefreshCw } from "lucide-react";

import { formatDate, formatTime, reviewDestinationLabel } from "./format";
import styles from "./payouts.module.css";

// setTimeout cannot wait longer than this; a longer expiry just re-arms on render.
const MAX_TIMEOUT_MS = 2_147_483_647;

function Row({ label, value, total }) {
  if (!value) return null;
  return (
    <div className={`${styles.reviewRow} ${total ? styles.reviewRowTotal : ""}`}>
      <dt className={styles.reviewLabel}>{label}</dt>
      <dd className={styles.reviewValue}>{value}</dd>
    </div>
  );
}

export function QuoteReview({ quote, notice, reasons, busy, onConfirm, onBack, onExpired }) {
  const expiresAt = quote?.expiresAt;

  useEffect(() => {
    if (!expiresAt || !onExpired) return undefined;
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (!Number.isFinite(ms)) return undefined;
    const timer = setTimeout(onExpired, Math.min(Math.max(0, ms), MAX_TIMEOUT_MS));
    return () => clearTimeout(timer);
  }, [expiresAt, onExpired]);

  if (!quote) return null;

  const source = quote.sourceCurrency || "USD";
  const crossCurrency = Boolean(quote.targetCurrency && quote.targetCurrency !== source);
  const receive = quote.targetAmount?.display || quote.net?.display;
  const delivery = quote.formattedEstimatedDelivery
    || (quote.estimatedDelivery ? formatDate(quote.estimatedDelivery) : "");
  const heldUntil = formatTime(expiresAt);

  return (
    <div>
      <h3 className={styles.reviewTitle}>Review your withdrawal</h3>

      {notice && (
        <div className={styles.blockItem} role="status">
          <RefreshCw size={15} className={styles.blockIcon} aria-hidden />
          <span className={styles.blockText}>
            {notice}
            {reasons?.length > 0 && (
              <ul className={styles.reasonList}>
                {reasons.map((text) => <li key={text}>{text}</li>)}
              </ul>
            )}
          </span>
        </div>
      )}

      <dl className={styles.reviewRows}>
        <Row label="Withdrawal" value={quote.gross?.display} />
        <Row label="Transfer fee" value={quote.fee?.display ? `−${quote.fee.display}` : ""} />
        {(quote.withheld?.minor ?? 0) > 0 && (
          <Row label="Tax withheld" value={`−${quote.withheld.display}`} />
        )}
        {crossCurrency && quote.rate && (
          <Row label="Exchange rate" value={`1 ${source} = ${quote.rate} ${quote.targetCurrency}`} />
        )}
        <Row label="You receive" value={receive} total />
        <Row label="Destination" value={reviewDestinationLabel(quote.destination)} />
        <Row label="Estimated delivery" value={delivery} />
      </dl>

      {heldUntil && (
        <p className={styles.figureHint}>Price held until {heldUntil}.</p>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.button} disabled={busy || !quote.quoteId}
                onClick={onConfirm}>
          {busy ? <Loader2 size={15} className={styles.spin} aria-hidden /> : <ArrowRight size={15} aria-hidden />}
          Confirm withdrawal of {quote.gross?.display}
        </button>
        <button type="button" className={`${styles.button} ${styles.buttonQuiet}`}
                disabled={busy} onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}

export default QuoteReview;
