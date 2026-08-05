/**
 * src/app/about/page.jsx
 * About Chakancha Global — mission, model, team context.
 */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Heart, Globe, ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/common/Logo";

const PILLARS = [
  {
    useBrandMark: true,
    title: "Single origin",
    desc: "Every tea we sell comes from a specific estate in Nandi Hills, Kenya — not a blend of anonymous sources. You know exactly where it was grown.",
  },
  {
    icon: Heart,
    title: "Living wage",
    desc: "We pay tea pickers a living wage — above the legal minimum, verified annually. 10% of revenue goes directly to pickers; 5% to the regional community.",
  },
  {
    icon: Globe,
    title: "Transparent commerce",
    desc: "Our value chain is documented and published. We believe transparency is not a feature — it is the foundation of trust.",
  },
];
export default function AboutPage() {
  const router = useRouter();

  return (
    <div
      style={{
        maxWidth: "var(--max-width-content)",
        margin: "0 auto",
        padding:
          "calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)",
      }}
    >
      {/* Hero */}
      <div style={{ maxWidth: 700, marginBottom: "var(--spacing-3xl)" }}>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--color-muted-olive)",
            margin: "0 0 16px",
          }}
        >
          About Chakancha Global
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(36px, 5vw, 60px)",
            fontWeight: 500,
            color: "var(--color-earth-brown)",
            margin: "0 0 24px",
            lineHeight: 1.2,
          }}
        >
          The world's first{" "}
          <span style={{ color: "var(--color-tea-green)" }}>AI-native</span>{" "}
          specialty tea platform
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 18,
            color: "var(--color-text-secondary)",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Chakancha was built on a simple belief: that exceptional tea should be
          accessible to anyone, anywhere — and that the people who grow it
          should share in its value.
        </p>
      </div>

      {/* Mission */}
      <div
        style={{
          backgroundColor: "var(--color-warm-cream)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--spacing-2xl)",
          marginBottom: "var(--spacing-3xl)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--color-muted-olive)",
            margin: "0 0 12px",
          }}
        >
          Our mission
        </p>
        <blockquote
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontStyle: "italic",
            color: "var(--color-earth-brown)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          "From the tea fields of Nandi Hills to your cup — with everyone in
          between living a better life for it."
        </blockquote>
      </div>

      {/* Pillars */}
      <div style={{ marginBottom: "var(--spacing-3xl)" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--font-size-h2)",
            fontWeight: 600,
            color: "var(--color-earth-brown)",
            margin: "0 0 var(--spacing-xl)",
          }}
        >
          What we stand for
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "var(--spacing-lg)",
          }}
        >
          {PILLARS.map((p) => (
            <div
              key={p.title}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "var(--spacing-xl)",
                backgroundColor: "white",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-xl)",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-background-soft)",
                  border: "1px solid var(--color-border-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {p.useBrandMark ? (
                  <LogoMark tone="dark" size="sm" clickable={false} />
                ) : (
                  <p.icon
                    size={20}
                    color="var(--color-accent-dark-olive)"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--color-earth-brown)",
                    margin: "0 0 8px",
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Company context */}
      <div style={{ maxWidth: 700, marginBottom: "var(--spacing-3xl)" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--font-size-h2)",
            fontWeight: 600,
            color: "var(--color-earth-brown)",
            margin: "0 0 var(--spacing-lg)",
          }}
        >
          The company
        </h2>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            color: "var(--color-text-secondary)",
            lineHeight: 1.7,
            margin: "0 0 16px",
          }}
        >
          Chakancha Global Ltd is headquartered at origin — Nandi Hills, Rift
          Valley, Kenya. We work in partnership with CKC (Chakancha Global
          Corporation), with collaborative ties across East Africa and
          international markets including the Korean market served through KG
          Inicis.
        </p>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            color: "var(--color-text-secondary)",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Our AI platform uses Claude (Anthropic) to create the world's first
          tea sommelier, supply-chain guide, and order assistant — all in one
          conversational interface. We believe AI should make the premium
          accessible, not replace the human story behind it.
        </p>
      </div>

      {/* CTAs */}
      <div
        style={{ display: "flex", gap: "var(--spacing-md)", flexWrap: "wrap" }}
      >
        <button
          type="button"
          onClick={() => router.push("/origin")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "var(--color-tea-green)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "12px 28px",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Visit Nandi Hills <ArrowRight size={14} />
        </button>
        <button
          type="button"
          onClick={() => router.push("/impact")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "transparent",
            color: "var(--color-tea-green)",
            border: "1px solid var(--color-tea-green)",
            borderRadius: "var(--radius-md)",
            padding: "12px 28px",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          See our impact
        </button>
      </div>
    </div>
  );
}
