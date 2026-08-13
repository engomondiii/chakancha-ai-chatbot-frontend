"use client";

import React from "react";
import { Users } from "lucide-react";

import styles from "./PeopleSection.module.css";

export function PeopleSection() {
  const peopleImage = "/images/backgrounds/peopleImg.svg";

  return (
    <section className={styles.section}>
      {/* Image */}
      <div className={styles.imageWrapper}>
        <img
          src={peopleImage}
          alt="Tea plucker holding fresh tea leaves in Nandi Hills"
          className={styles.image}
        />
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.eyebrow}>
          <Users size={16} strokeWidth={1.8} />
          <span>THE PEOPLE</span>
        </div>

        <h2 className={styles.title}>Skilled Hands, Quiet Pride</h2>

        <p className={styles.description}>
          Amina has been a selective plucker for 11 years. She knows which
          leaves are ready by touch — the tender two-and-a-bud that make the
          finest grades. Her precision is not labour; it is craft. Every cup of
          Chakancha begins with someone like Amina, whose expertise shapes the
          tea long before any machine does.
        </p>

        <p className={styles.quote}>
          “I can tell the quality before it leaves my hand.”
        </p>
      </div>
    </section>
  );
}

export default PeopleSection;
