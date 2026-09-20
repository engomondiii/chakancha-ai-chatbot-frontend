/**
 * src/components/payouts/EarningsSummary.jsx
 *
 * Where the member's commission is right now: Earned · Available · In progress · Paid out.
 * Every amount is the API's display string; nothing is added or subtracted here.
 *
 * There is deliberately no lifetime total here. It read as money of its own
 * beside the others — a member with one withdrawal under way saw the same
 * $8.08 twice and thought they had $16.16. The lifetime figure still lives on
 * the Chakan Tree dashboard.
 */

"use client";

import React from "react";
import {
  ArrowRight,
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock,
  TrendingUp,
  Wallet,
  CircleDashed,
} from "lucide-react";

import { Section } from "./Section";
import { formatDate } from "./format";
import styles from "./payouts.module.css";

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

function Strip({ icon: Icon, children }) {
  return (
    <div className={styles.strip}>
      <Icon size={15} className={styles.stripIcon} aria-hidden />
      <span className={styles.stripText}>{children}</span>
    </div>
  );
}

export function EarningsSummary({ balance }) {
  const pendingMinor = balance.pending?.minor ?? 0;
  const nextDate = pendingMinor > 0 ? formatDate(balance.nextMaturityAt) : "";
  const belowMinimum = (balance.shortfallToMinimum?.minor ?? 0) > 0;

  return (
    <Section id="payout-earnings" icon={TrendingUp} title="Your earnings">
      <div className={styles.figureGrid}>
        <Figure
          icon={Clock}
          label="Earned"
          amount={balance.pending}
          hint="Earned, but not yet available for withdrawal. Held until the return and refund period ends."
        />
        <Figure
          primary
          icon={Wallet}
          label="Available to withdraw"
          amount={balance.available}
          hint="Available to withdraw now."
        />
         <Figure
          icon={CircleDashed}
          label="In progress"
          amount={balance.reserved}
          hint="In process of sending to your bank account."
        />
        <Figure
          icon={CheckCircle2}
          label="Paid out"
          amount={balance.paid}
          hint="Sent to your bank account."
        />
      </div>

      {nextDate && (
        <Strip icon={CalendarClock}>
          Next earnings available on{" "}
          <span className={styles.emphasis}>{nextDate}</span>.
        </Strip>
      )}

      {belowMinimum && (
        <Strip icon={Wallet}>
          The minimum withdrawal is{" "}
          <span className={styles.emphasis}>
            {balance.minimumPayout?.display}
          </span>
          . You currently have{" "}
          <span className={styles.emphasis}>{balance.available?.display}</span>{" "}
          available. A transaction fee of about 1% is deducted from each
          withdrawal. <br />
          You'll see the exact fee before you confirm.
        </Strip>
      )}

      {(balance.reserved?.minor ?? 0) > 0 && (
        <Strip icon={ArrowRight}>
          <span className={styles.emphasis}>{balance.reserved.display}</span> Is being held for a pending withdrawal and is not available to use.
        </Strip>
      )}

      {(balance.negativeBalance?.minor ?? 0) > 0 && (
        <Strip icon={Ban}>
          A refund reversed more commission than your balance covered.{" "}
          <span className={styles.emphasis}>
            {balance.negativeBalance.display}
          </span>{" "}
          will be offset by future earnings before you can withdraw again.
        </Strip>
      )}
    </Section>
  );
}

export default EarningsSummary;
