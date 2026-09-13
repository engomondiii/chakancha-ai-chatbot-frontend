/**
 * src/components/payouts/EarningsStatement.jsx
 * Every commission entry and when it becomes available. Stacks into cards on
 * narrow screens instead of scrolling sideways.
 */

"use client";

import React from "react";
import { Receipt } from "lucide-react";

import { Section } from "./Section";
import { ENTRY_WORDS, formatDate } from "./format";
import styles from "./payouts.module.css";

function entryTone(state) {
  if (state === "PAID" || state === "AVAILABLE") return styles.badgeGood;
  if (state === "PENDING") return styles.badgeNeutral;
  return styles.badgeWarn;
}

export function EarningsStatement({ entries }) {
  return (
    <Section id="payout-statement" icon={Receipt} title="Earnings statement"
             note={`${entries.count} entr${entries.count === 1 ? "y" : "ies"}`}>
      <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
        {entries.results.length === 0 ? (
          <p className={styles.empty}>
            No commission earned yet. You earn when someone in your Chakan Tree buys tea.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${styles.statementTable}`}>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Level</th>
                  <th scope="col" className={styles.numeric}>Amount</th>
                  <th scope="col">Status</th>
                  <th scope="col">Available on</th>
                </tr>
              </thead>
              <tbody>
                {entries.results.map((e) => (
                  <tr key={e.id}>
                    <td data-label="Order">{e.order || "—"}</td>
                    <td data-label="Level">{e.level ? `Level ${e.level}` : "Adjustment"}</td>
                    <td data-label="Amount" className={styles.numeric}>{e.amount?.display}</td>
                    <td data-label="Status">
                      <span className={`${styles.badge} ${entryTone(e.state)}`}>
                        {ENTRY_WORDS[e.state] || "Updated"}
                      </span>
                    </td>
                    <td data-label="Available on">{formatDate(e.maturesAt) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Section>
  );
}

export default EarningsStatement;
