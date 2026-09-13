/**
 * src/components/payouts/DestinationList.jsx
 *
 * Where earnings can be sent, in the member's terms: country, "Bank account",
 * the last four digits, the currency the bank receives. Never a payment rail,
 * a provider name, or a recipient reference.
 */

"use client";

import React from "react";
import { Landmark, Plus, Trash2 } from "lucide-react";

import { Section } from "./Section";
import styles from "./payouts.module.css";

function accountLine(d) {
  const method = d.methodLabel || "Bank account";
  const account = d.last4 ? `${method} ••••${d.last4}` : method;
  return [account, d.currency].filter(Boolean).join(" · ");
}

export function DestinationList({ destinations, busy, onRemove, onAdd, form }) {
  return (
    <Section id="payout-destinations" icon={Landmark} title="Payout destinations"
             note="We never store your full account number.">
      {destinations.length === 0 && !form && (
        <div className={styles.card}>
          <p className={styles.empty}>No payout destination yet.</p>
          <div className={styles.actions} style={{ marginTop: 0, justifyContent: "center" }}>
            <button type="button" className={`${styles.button} ${styles.buttonGhost}`} onClick={onAdd}>
              <Plus size={15} aria-hidden /> Add bank account
            </button>
          </div>
        </div>
      )}

      {destinations.length > 0 && (
        <ul className={styles.list}>
          {destinations.map((d) => (
            <li key={d.id} className={styles.destItem}>
              <div className={styles.destMeta}>
                <span className={styles.destHint}>{d.countryName || d.country || d.methodLabel || "Bank account"}</span>
                <span className={styles.destSub}>
                  {accountLine(d)}
                  {d.isDefault ? " · Default" : ""}
                  {d.status && d.status !== "VERIFIED" ? " · Not verified" : ""}
                </span>
              </div>
              <button type="button" className={`${styles.button} ${styles.buttonQuiet}`}
                      disabled={busy} onClick={() => onRemove(d.id)}
                      aria-label={`Remove ${[d.countryName || d.country, accountLine(d)].filter(Boolean).join(" ")}`}>
                <Trash2 size={14} aria-hidden /> Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {form ? (
        <div className={styles.card} style={{ marginTop: destinations.length ? "var(--spacing-md)" : 0 }}>
          {form}
        </div>
      ) : destinations.length > 0 && (
        <div className={styles.actions}>
          <button type="button" className={`${styles.button} ${styles.buttonGhost}`} onClick={onAdd}>
            <Plus size={15} aria-hidden /> Add bank account
          </button>
        </div>
      )}
    </Section>
  );
}

export default DestinationList;
