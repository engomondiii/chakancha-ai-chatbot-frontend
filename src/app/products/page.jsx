/**
 * src/app/products/page.jsx
 * The /products route — full tea catalog.
 *
 * Changes from previous version:
 *  - Page title changed from "Our Teas" to more compelling "Discover Exceptional Teas"
 *  - Added a rich hero section with origin badge, headline, and a strong
 *    call-to-action description driving the user to shop
 *  - Two trust badges: no added costs, and what the farmers are paid
 *  - Subtitle rewritten to be more evocative and purchase-driving
 *  - All product grid logic unchanged
 */

"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Tag, Heart, Star } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ShopSection } from "@/components/products/ShopSection";
import { useProducts, useProductCategories } from "@/lib/hooks/useProducts";
import { LogoMark } from "@/components/common/Logo";

function ProductCatalog() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams?.get("category") || null;

  const { products, isLoading, error } = useProducts({
    category: categoryParam,
  });
  const categories = useProductCategories();

  //
  // The shop sells three kinds of thing and shows each in its own section.
  // A product with no kind is treated as a tea: that is what everything in
  // the shop was before kinds existed, and an older backend that does not
  // send the field should still fill the tea section rather than empty it.
  //
  const everything = Array.isArray(products) ? products : [];
  const ofKind = (kind) => everything.filter((p) => (p?.kind || "tea") === kind);

  const teas        = ofKind("tea");
  const bundles     = ofKind("bundle");
  const accessories = ofKind("accessory");

  return (
    <div
      style={{
        maxWidth: "var(--max-width-content)",
        margin: "0 auto",
        padding:
          "calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)",
      }}
    >
      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div
        style={{
          marginBottom: "var(--spacing-3xl)",
          padding: "48px 40px",
          background:
            "linear-gradient(135deg, rgba(45,80,22,0.05) 0%, rgba(212,165,116,0.08) 100%)",
          border: "1px solid rgba(45,80,22,0.1)",
          borderRadius: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative leaf background */} 
        {/* <div
          style={{
            position: "absolute",
            right: -20,
            top: -20,
            fontSize: 160,
            opacity: 0.04,
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          🍃
        </div> */}
{/* 
        {/* Origin badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "var(--color-background-soft)",
            border: "1px solid var( --color-accent-sand)",
            borderRadius: "999px",
            padding: "5px 14px",
            marginBottom: 16,
          }}
        >
          <LogoMark tone="dark" size="sm" clickable={false} />
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--color-background-charcoal)",
            }}
          >
            Single-Origin · Nandi Hills, Kenya · 2,000m Altitude
          </span>
        </div>

        {/* Main headline */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 600,
            color: "var(--color-earth-brown)",
            margin: "0 0 16px",
            lineHeight: 1.15,
            maxWidth: 640,
          }}
        >
          Teas Worth Travelling For
        </h1>

        {/* Description — drives purchase */}
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 17,
            color: "var(--color-text-secondary)",
            margin: "0 0 12px",
            maxWidth: 560,
            lineHeight: 1.7,
          }}
        >
          Every tea on this page was grown at high altitude by farmers earning a
          living wage — not just a minimum wage. When you buy Chakancha tea, you
          taste the difference that dignity makes.
        </p>

        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            color: "#8B8C5A",
            margin: 0,
            maxWidth: 480,
            lineHeight: 1.6,
          }}
        >
          Black, green, purple, white — each one a different expression of the
          same extraordinary hills. Find your cup below.
        </p>

        {/* Trust badges */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 28,
            flexWrap: "wrap",
          }}
        >
          {[
            //
            // No figure and no carrier. The old badge promised free shipping
            // over $50, which made a customer under $50 wonder what shipping
            // would cost them -- a question this shop does not want asked,
            // because the answer is nothing at any basket size. So it says
            // the thing itself instead of the condition on it.
            //
            // The satisfaction guarantee that stood beside these two is gone:
            // a promise nobody has written a returns policy behind is worse
            // than no promise, because the first customer to try to use it
            // finds out there is nothing there.
            //
            { icon: Tag, text: "No added costs" },
            //
            // "Ethical, farmer-first teas" was two adjectives and no fact --
            // the sort of line every tea shop has and no customer believes,
            // because anybody can type it. The paragraph above it already
            // says the true version in plain words, so the badge says that
            // instead: a wage is something a farmer is either paid or not.
            //
            { icon: Heart, text: "Farmers paid a living wage" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon size={15} color="#4A7C2C" />
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#6B5544",
                }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Shop CTA strip ────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--spacing-xl)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--color-earth-brown)",
              margin: "0 0 4px",
            }}
          >
            Shop All Teas
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            {isLoading
              ? "Loading teas…"
              : `${teas.length} teas available — order by noon for same-day dispatch`}
          </p>
        </div>

        {/* Star rating social proof */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(212,160,23,0.08)",
            border: "1px solid rgba(212,160,23,0.2)",
            borderRadius: "999px",
            padding: "8px 16px",
          }}
        >
          <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={13} fill="#D4A017" color="#D4A017" />
            ))}
          </div>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 600,
              color: "#7a5800",
            }}
          >
            4.9 · Loved by 2,000+ tea drinkers
          </span>
        </div>
      </div>

      {/* ── The teas ─────────────────────────────────────────────────────── */}
      {/*
        Only the teas carry the category filters. A filter row above two
        accessories would offer to narrow a list that is already as narrow as
        it goes, and the categories it lists are tea categories.
      */}
      <ProductGrid
        products={teas}
        isLoading={isLoading}
        error={error}
        showFilters
        categories={categories}
      />

      {/* ── Bundles and accessories ──────────────────────────────────────── */}
      {/*
        Each kind gets its own section rather than sitting among the teas,
        because a $100 bundle beside a $70 tea reads as the more expensive tea
        until you notice it is two of them.
      */}
      <ShopSection
        title="Bundles"
        blurb="Two teas together, at less than two teas."
        products={bundles}
        isLoading={isLoading}
      />
      <ShopSection
        title="Keep it fresh"
        blurb="Somewhere dark and airtight for the leaves to live."
        products={accessories}
        isLoading={isLoading}
      />

      {/* ── Bottom AI nudge ───────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background:
            "linear-gradient(135deg, rgba(45,80,22,0.06) 0%, rgba(212,165,116,0.08) 100%)",
          border: "1px solid rgba(45,80,22,0.12)",
          borderRadius: 16,
          padding: "24px 32px",
          flexWrap: "wrap",
          textAlign: "center",
          marginTop: "var(--spacing-3xl)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 16,
            color: "#6b5544",
            margin: 0,
          }}
        >
          Not sure which tea is right for you?
        </p>
        <a
          href="/"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 16,
            fontWeight: 600,
            color: "var( --color-accent-sand)",
            textDecoration: "none",
            borderBottom: "1px solid var(--color-accent-muted-gold)",
            paddingBottom: 0,
            transition: "border-color 150ms ease, color 150ms ease",
          }}
        >
          Ask our AI — it knows every leaf
        </a>
        <span>
          <LogoMark tone="dark" size="sm" clickable={true} />
        </span>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: "calc(72px + var(--spacing-2xl)) var(--spacing-lg)",
            maxWidth: "var(--max-width-content)",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              height: 32,
              width: 200,
              backgroundColor: "var(--color-mist-gray)",
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--spacing-xl)",
              animation: "shimmer 1.5s infinite",
            }}
          />
        </div>
      }
    >
      <ProductCatalog />
    </Suspense>
  );
}
