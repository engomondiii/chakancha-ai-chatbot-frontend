/**
 * src/components/ai/LogoLoader.jsx
 * The Chakancha mark on a dark disc, breathing, with a gold ring sweeping
 * around it. Shown while the AI prepares a reply and while /chat loads.
 */

"use client";

import React from "react";
import styles from "./LogoLoader.module.css";

const MARK_SRC = "/images/icons/chakancha-mark-white.svg";

export function LogoLoader({ size = "md", label = null }) {
  return (
    <div
      className={`${styles.loader} ${styles[size] || styles.md}`}
      role="status"
    >
      <span className={styles.badge} aria-hidden="true">
        <span className={styles.ring} />
        <img
          src={MARK_SRC}
          alt=""
          className={styles.mark}
          draggable="false"
        />
      </span>

      {label ? (
        <span className={styles.label}>{label}</span>
      ) : (
        <span className={styles.srOnly}>Chakancha AI is thinking</span>
      )}
    </div>
  );
}

export default LogoLoader;
