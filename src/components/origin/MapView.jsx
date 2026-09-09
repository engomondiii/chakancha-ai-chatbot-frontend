"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  ExternalLink,
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  CloudSnow,
} from "lucide-react";
import { fetchOriginWeather } from "@/lib/api/content";
import styles from "./MapView.module.css";

/**
 * Pick an icon for a MET Norway symbol code.
 * Codes look like "partlycloudy_day" / "lightrainshowers_night".
 */
function weatherIcon(symbolCode) {
  const code = String(symbolCode || "");
  const night = code.endsWith("_night");
  const base = code.split("_")[0];

  if (base.includes("thunder")) return CloudLightning;
  if (base.includes("snow") || base.includes("sleet")) return CloudSnow;
  if (base.includes("lightrain") || base.includes("drizzle")) return CloudDrizzle;
  if (base.includes("rain") || base.includes("showers")) return CloudRain;
  if (base === "fog") return CloudFog;
  if (base === "cloudy") return Cloud;
  if (base === "partlycloudy" || base === "fair") return night ? CloudMoon : CloudSun;
  if (base === "clearsky") return night ? Moon : Sun;
  return Cloud;
}

export function MapView() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // Weather is decorative: a failure must never disturb the map.
    fetchOriginWeather().then((data) => {
      if (!cancelled) setWeather(data);
    });

    // Refresh while the page stays open. The backend caches upstream, so this
    // is cheap and never hits the provider more often than its own TTL allows.
    const timer = setInterval(() => {
      fetchOriginWeather().then((data) => {
        if (!cancelled && data) setWeather(data);
      });
    }, 15 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const Icon = weather ? weatherIcon(weather.symbol_code) : null;

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

        {/* LIVE WEATHER — rendered only when a reading is available */}
        {weather && (
          <div className={styles.weatherCard} aria-live="polite">
            <div className={styles.weatherMain}>
              {Icon && (
                <Icon
                  size={26}
                  strokeWidth={1.6}
                  color="var(--color-tea-green)"
                  aria-hidden="true"
                />
              )}
              <span className={styles.weatherTemp}>
                {Math.round(weather.temperature)}°C
              </span>
            </div>

            <p className={styles.weatherCondition}>{weather.condition}</p>

            <p className={styles.weatherDetail}>
              {typeof weather.humidity === "number" && (
                <span>{Math.round(weather.humidity)}% humidity</span>
              )}
              {typeof weather.wind_speed === "number" && (
                <span> · {weather.wind_speed} m/s wind</span>
              )}
            </p>

            <p className={styles.weatherSource}>
              <a
                href={weather.attribution_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.weatherSourceLink}
              >
                {weather.attribution}
              </a>
            </p>
          </div>
        )}

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
