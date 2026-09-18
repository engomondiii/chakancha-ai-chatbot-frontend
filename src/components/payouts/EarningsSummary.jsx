/**
 * src/components/payouts/EarningsSummary.jsx
 *
 * Four figures, never one: Total earned · Pending · Available · Paid out.
 * Every amount is the API's display string; nothing is added or subtracted here.
 */

"use client";

import React from "react";
import {
  ArrowRight,
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock,
  Coins,
  TrendingUp,
  Wallet,
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
          icon={Coins}
          label="Total earned"
          amount={balance.totalEarned}
          hint="Everything your network has earned you."
        />
        <Figure
          icon={Clock}
          label="Pending earnings"
          amount={balance.pending}
          hint="Commission is held until the order's return and refund window closes."
        />
        <Figure
          primary
          icon={Wallet}
          label="Available to withdraw"
          amount={balance.available}
          hint="Available to withdraw now."
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
          <span className={styles.emphasis}>{balance.reserved.display}</span> is
          held for a withdrawal in progress and is not counted as available.
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
