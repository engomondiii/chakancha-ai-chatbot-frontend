/**
 * src/components/payouts/Section.jsx
 * A titled block on the payout page, matching the dashboard's section idiom.
 */

"use client";

import React from "react";

import styles from "./payouts.module.css";

export function Section({ id, icon: Icon, title, note, children }) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} className={styles.section} aria-labelledby={headingId}>
      <div className={styles.sectionHead}>
        <h2 id={headingId} className={styles.sectionTitle}>
          {Icon && <Icon size={18} aria-hidden />}
          {title}
        </h2>
        {note && <span className={styles.sectionNote}>{note}</span>}
      </div>
      {children}
    </section>
  );
}

export default Section;
