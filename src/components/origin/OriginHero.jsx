"use client";

import React from "react";
import { MapPin } from "lucide-react";

import styles from "./OriginHero.module.css";

export function OriginHero() {
  const bgImage = "/images/backgrounds/beautiful-tea-fields.jpg";

  return (
    <section className={styles.hero}>
      {/* Background */}
      <div
        className={styles.bg}
        style={{
          backgroundImage: `url("${bgImage}")`,
        }}
      />

      {/* Gradient overlay */}
      <div className={styles.overlay} />

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.location}>
          <MapPin
            size={15}
            strokeWidth={1.8}
            color="var(--color-sunrise-gold)"
          />

          <span className={styles.eyebrow}>
            Nandi Hills, Kenya · 2,100m elevation
          </span>
        </div>

        <h1 className={styles.title}>
          From the Hills of
          <br />
          <span className={styles.accent}>Heaven</span>
        </h1>

        <p className={styles.subtitle}>
          A grounded origin story about altitude, craft, people,
          <br className={styles.desktopBreak} />
          and a tea landscape that deserves to be named.
        </p>
      </div>
    </section>
  );
}

export default OriginHero;
