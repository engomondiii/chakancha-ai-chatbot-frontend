/**
 * src/app/about/page.jsx
 * About CKC / Chakancha — hero, mission, pillars, team, story, CTA.
 */

"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  HeartHandshake,
  ShieldCheck,
  Search,
  Award,
  Target,
  ArrowRight,
} from "lucide-react";

/*
 * Update these paths to the actual assets in /public.
 */
const HERO_IMAGE = "/images/about/ckc-team-field.png";
const TEAM_IMAGE = "/images/about/ckc-team.png";

const PILLARS = [
  {
    icon: MapPin,
    title: "Single Origin",
    desc: "Every tea traced to one named estate",
  },
  {
    icon: HeartHandshake,
    title: "Living Wage",
    desc: "40% above Kenya's statutory minimum",
  },
  {
    icon: ShieldCheck,
    title: "Food Hygiene",
    desc: "Certified protocols field to package",
  },
  {
    icon: Search,
    title: "Traceability",
    desc: "Lot codes link every batch to its origin",
  },
  {
    icon: Award,
    title: "Specialty Quality",
    desc: "Handpicked orthodox, never mass CTC",
  },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1720,
        margin: "0 auto",
        padding:
          "calc(72px + var(--spacing-lg)) var(--spacing-2xl) var(--spacing-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-3xl)",
      }}
    >
      {/* ===================================================
          HERO
      =================================================== */}
      <section
        style={{
          position: "relative",
          minHeight: 380,
          borderRadius: "var(--radius-panel)",
          overflow: "hidden",
        }}
      >
        <Image
          src={HERO_IMAGE}
          alt="The CKC / Chakancha team among the tea fields of Nandi Hills"
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
          style={{
            objectFit: "cover",
            objectPosition: "center 40%",
          }}
        />

        {/* Left-weighted overlay for readable white text */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(100deg, rgba(17, 17, 17, 0.72) 0%, rgba(17, 17, 17, 0.5) 38%, rgba(17, 17, 17, 0.18) 62%, rgba(17, 17, 17, 0) 80%), linear-gradient(to top, rgba(17, 17, 17, 0.35) 0%, rgba(17, 17, 17, 0) 30%)",
          }}
        />

        <div
          style={{
            position: "relative",
            maxWidth: 560,
            padding: "var(--spacing-3xl) var(--spacing-2xl) var(--spacing-2xl)",
          }}
        >
          <h1
            style={{
              margin: "0 0 var(--spacing-md)",
              fontFamily: "var(--font-family-display)",
              fontSize: "clamp(32px, 4.5vw, 52px)",
              fontWeight: 500,
              lineHeight: 1.15,
              color: "#FFFFFF",
            }}
          >
            CKC / Chakancha
            <br />
            tea
          </h1>

          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-family-primary)",
              fontSize: 16,
              lineHeight: 1.7,
              color: "rgba(255, 255, 255, 0.92)",
              marginTop: "36px",
            }}
          >
            The world's first AI-native specialty tea platform Chakancha was
            built on a simple belief: that exceptional tea should be accessible
            to anyone, anywhere — and that the people who grow it should share
            in its value.
          </p>
        </div>
      </section>

      {/* ===================================================
          OUR MISSION
      =================================================== */}
      <section
        style={{
          background: "var(--color-background-soft)",
          border: "1px solid var(--color-border-soft)",
          borderRadius: "var(--radius-panel)",
          padding: "var(--spacing-xl)",
          gap: "var(--spacing-3xl)",
        }}
      >
        <h2
          style={{
            margin: "0 0 var(--spacing-md)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "var(--font-family-display)",
            fontSize: "var(--font-size-h3)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          <Target
            size={22}
            color="var(--color-accent-dark-olive)"
            aria-hidden="true"
          />
          Our Mission
        </h2>

        <p
          style={{
            margin: 0,
            maxWidth: 980,
            fontFamily: "var(--font-family-primary)",
            fontSize: 15,
            lineHeight: 1.8,
            color: "var(--color-text-secondary)",
          }}
        >
          Our mission is to prove that premium tea and fair compensation are not
          opposites — they are partners. We source single-origin tea from Nandi
          Hills, pay living wages, maintain full traceability, and build direct
          relationships that bypass the broken auction system.
        </p>
      </section>

      {/* ===================================================
          WHAT WE STAND FOR
      =================================================== */}
      <section
        style={{
          padding: "var(--spacing-2xl)",
          gap: "var(--spacing-3xl)",
        }}
      >
        <h2
          style={{
            margin: "0 0 var(--spacing-xl)",
            fontFamily: "var(--font-family-display)",
            fontSize: "var(--font-size-h3)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          What We Stand For
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "var(--spacing-2xl) var(--spacing-lg)",
          }}
        >
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <pillar.icon
                size={20}
                color="var(--color-text-primary)"
                aria-hidden="true"
              />

              <h3
                style={{
                  margin: 0,
                  fontFamily: "var(--font-family-primary)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                {pillar.title}
              </h3>

              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-family-primary)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--color-text-muted)",
                }}
              >
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================
          TEAM + STORY
      =================================================== */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "var(--spacing-4xl)",
          alignItems: "stretch",
        }}
      >
        {/* The Team */}
        <div
          style={{
            background: "var(--color-background-soft)",
            borderRadius: "var(--radius-panel)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
            }}
          >
            <Image
              src={TEAM_IMAGE}
              alt="The CKC team in the Nandi Hills tea fields"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{
                objectFit: "cover",
              }}
            />
          </div>

          <div style={{ padding: "var(--spacing-xl)" }}>
            <h2
              style={{
                margin: "0 0 var(--spacing-sm)",
                fontFamily: "var(--font-family-display)",
                fontSize: "var(--font-size-h3)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
              }}
            >
              The Team
            </h2>

            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-family-primary)",
                fontSize: 14,
                lineHeight: 1.7,
                color: "var(--color-text-secondary)",
              }}
            >
              CKC is led by people who know the estate, the process, and the
              market. Our team spans Nandi Hills and Nairobi — from selective
              pluckers to quality specialists to logistics coordinators.
            </p>
          </div>
        </div>

        {/* Our Story */}
        <div
          style={{
            padding: "var(--spacing-xl)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2
            style={{
              margin: "0 0 var(--spacing-md)",
              fontFamily: "var(--font-family-display)",
              fontSize: "var(--font-size-h3)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            Our Story
          </h2>

          <p
            style={{
              margin: "0 0 var(--spacing-md)",
              fontFamily: "var(--font-family-primary)",
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--color-text-secondary)",
            }}
          >
            Chakancha was born from a simple observation: the world's finest
            Kenyan teas were being sold through an auction system that erased
            their origin, undervalued the people who grew them, and made
            traceability impossible.
          </p>

          <p
            style={{
              margin: "0 0 var(--spacing-lg)",
              fontFamily: "var(--font-family-primary)",
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--color-text-secondary)",
            }}
          >
            CKC built a different path — direct from Nandi Hills to your cup. No
            auction. No middlemen. Every batch is traceable. Every worker is
            paid a living wage. Every cup tells you where it came from.
          </p>

          <p
            style={{
              margin: "auto 0 0",
              fontFamily: "var(--font-family-primary)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            Est. 2024{" "}
            <span
              style={{
                fontWeight: 400,
                color: "var(--color-text-muted)",
              }}
            >
              · Nandi Hills, Kenya
            </span>
          </p>
        </div>
      </section>

      {/* ===================================================
          CTA BANNER
      =================================================== */}
      <section
        style={{
          background: "var(--color-background-charcoal)",
          borderRadius: "var(--radius-panel)",
          padding: "var(--spacing-xl)",
          gap: "var(--spacing-2xl) var(--spacing-lg)",
        }}
      >
        <h2
          style={{
            margin: "0 0 var(--spacing-lg)",
            maxWidth: 900,
            fontFamily: "var(--font-family-display)",
            fontSize: "clamp(20px, 3vw, 30px)",
            fontWeight: 500,
            lineHeight: 1.35,
            color: "var(--color-text-inverse)",
          }}
        >
          Behind every cup of Chakancha is a place, a process, and a team worth
          knowing.
        </h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--spacing-lg)",
          }}
        >
          {[
            { label: "Explore our teas", href: "/products" },
            { label: "Visit Nandi Hills", href: "/origin" },
            { label: "Talk to our AI", href: "/chat" },
          ].map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => router.push(link.href)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: 0,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-family-primary)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-text-inverse)",
              }}
            >
              {link.label} <ArrowRight size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
