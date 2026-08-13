"use client";

import React from "react";
import { MapPin, ExternalLink } from "lucide-react";
import styles from "./MapView.module.css";

export function MapView() {
  return (
    <div className={styles.mapWrapper}>
      <div className={styles.mapContainer}>
        {/* GOOGLE MAP */}
        <iframe
          src="https://www.google.com/maps?q=Nandi+Hills,+Kenya&z=12&output=embed"
          className={styles.mapIframe}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title="Nandi Hills, Kenya"
        />

        {/* LOCATION CARD */}
        <div className={styles.locationCard}>
          <MapPin size={22} strokeWidth={1.7} color="var(--color-tea-green)" />

          <div>
            <p className={styles.locationTitle}>Nandi Hills, Kenya</p>

            <p className={styles.locationSubtitle}>
              Rift Valley · Western Kenya
            </p>

            <a
              href="https://maps.google.com/?q=Nandi+Hills+Kenya"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mapLink}
            >
              View on Google Maps
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapView;
