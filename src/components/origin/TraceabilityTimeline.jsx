"use client";

import React from "react";
import { Leaf, Factory, Package, Truck, Coffee } from "lucide-react";

/*
 * Two side-by-side background photographs, per the design:
 * tea fields on the left, the pouring shot on the right,
 * under one uniform light overlay.
 */
const BG_LEFT = "/images/impact/traceability-fields.jpg";
const BG_RIGHT = "/images/impact/traceability-pour.jpg";

const STEPS = [
  {
    icon: Leaf,
    title: "Plucking",
    desc: "Two leaves and a bud — hand-picked by skilled pickers at dawn.",
  },
  {
    icon: Factory,
    title: "Processing",
    desc: "Withered, rolled, and dried at the estate factory. Never offsite.",
  },
  {
    icon: Package,
    title: "Packaging",
    desc: "Sealed within 48 hours of processing to lock in freshness.",
  },
  {
    icon: Truck,
    title: "Dispatch",
    desc: "DHL collects directly from the estate for international delivery.",
  },
  {
    icon: Coffee,
    title: "Your Cup",
    desc: "From field to cup in under 3 weeks.",
  },
];

export function TraceabilityTimeline() {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        paddingTop:"45px",

        /*
         * Full-bleed breakout: the section escapes the
         * page's max-width container and spans the whole
         * viewport, regardless of where it is rendered.
         */
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        display:"flex",
        justifyContent:"center"
      }}
    >
      {/* =================================================
          BACKGROUND — two photos side by side
      ================================================= */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: "50%",
            backgroundImage: `url("${BG_LEFT}")`,
            backgroundSize: "cover",
            backgroundPosition: "center 60%",
          }}
        />
        <div
          style={{
            width: "50%",
            backgroundImage: `url("${BG_RIGHT}")`,
            backgroundSize: "cover",
            backgroundPosition: "center 35%",
          }}
        />
      </div>

      {/* Uniform light overlay (white at 84%, per design) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255, 255, 255, 0.84)",
        }}
        aria-hidden="true"
      />

      {/* =================================================
          CONTENT — heading, intro, timeline
      ================================================= */}
      <div
        style={{
          position: "relative",
          maxWidth: 760,
          margin: "0 auto",
          padding: "var(--spacing-3xl) var(--spacing-lg)",
        }}
      >
        <h2
          style={{
            margin: "0 0 var(--spacing-md)",
            fontFamily: "var(--font-family-display)",
            fontSize: "var(--font-size-h2)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          From Field to Cup
        </h2>

        <p
          style={{
            margin: "0 0 var(--spacing-2xl)",
            maxWidth: 560,
            fontFamily: "var(--font-family-primary)",
            fontSize: 15,
            lineHeight: 1.7,
            color: "var(--color-text-secondary)",
          }}
        >
          Every Chakancha tea is traceable from the specific estate where it
          was grown to the moment it reaches you. Here is the journey.
        </p>

        {/* Timeline */}
        <div style={{ position: "relative" }}>
          {/* Connecting line */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 24,
              bottom: 24,
              width: 2,
              backgroundColor: "rgba(17, 17, 17, 0.25)",
              zIndex: 0,
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-lg)",
              position: "relative",
              zIndex: 1,
            }}
          >
            {STEPS.map((step) => (
              <div
                key={step.title}
                style={{
                  display: "flex",
                  gap: "var(--spacing-lg)",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    backgroundColor: "#1A1F1A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "3px solid var(--color-background-main)",
                    boxShadow: "0 2px 8px rgba(17, 17, 17, 0.18)",
                  }}
                >
                  <step.icon size={18} color="#FFFFFF" aria-hidden="true" />
                </div>

                <div style={{ paddingTop: 8 }}>
                  <h4
                    style={{
                      margin: "0 0 4px",
                      fontFamily: "var(--font-family-primary)",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {step.title}
                  </h4>

                  <p
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-family-primary)",
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TraceabilityTimeline;