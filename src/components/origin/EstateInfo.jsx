"use client";

import React from "react";
import { Mountain } from "lucide-react";

import styles from "./EstateInfo.module.css";

export function EstateInfo() {
  const estateImage = "/images/backgrounds/landImg.svg";

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        {/* Eyebrow */}
        <div className={styles.eyebrow}>
          <Mountain size={16} strokeWidth={1.8} />
          <span>THE LAND</span>
        </div>

        {/* Heading */}
        <h2 className={styles.title}>Where Heaven Meets Earth</h2>

        {/* Description */}
        <p className={styles.description}>
          Nandi Hills sits in Kenya's Rift Valley at elevations between 1,900
          and 2,300 metres. The cool highland climate, volcanic soil, and
          consistent rainfall create ideal conditions for slow-growing,
          flavour-rich tea. It is one of the finest tea-growing regions on the
          planet — and one of the least well-known outside the specialty market.
          Volcanic red soils deliver mineral complexity. Afternoon mists wrap
          the hillsides, nurturing plants that have grown here for generations.
        </p>
      </div>

      {/* Image */}
      <div className={styles.imageWrapper}>
        <img
          src={estateImage}
          alt="Nandi Hills landscape in western Kenya"
          className={styles.image}
        />
      </div>
    </section>
  );
}

export default EstateInfo;
