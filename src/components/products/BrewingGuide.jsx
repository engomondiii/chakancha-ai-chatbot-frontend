/**
 * src/components/products/BrewingGuide.jsx
 *
 * Product-specific brewing instructions.
 *
 * Supports both camelCase and snake_case backend fields:
 *  - brewingTemp || brewing_temp
 *  - brewingTime || brewing_time
 *  - teaAmount   || tea_amount
 */

"use client";

import React, { useId, useState } from "react";
import {
  Thermometer,
  Clock,
  Scale,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { LogoMark } from "@/components/common/Logo";

function BrewingStep({
  icon: Icon,
  label,
  value,
  highlight = false,
}) {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",

        minWidth: 96,
        minHeight: 112,

        gap: "var(--space-1)",
        padding: "var(--space-2)",

        textAlign: "center",

        color: "var(--color-text-primary)",
        backgroundColor: highlight
          ? "var(--color-background-muted)"
          : "var(--color-surface-card)",

        border: `1px solid ${
          highlight
            ? "var(--color-accent-sand)"
            : "var(--color-border-soft)"
        }`,

        borderRadius: "var(--radius-card)",

        transition: `
          background-color var(--transition-fast) var(--ease-out),
          border-color var(--transition-fast) var(--ease-out)
        `,
      }}
    >
      <Icon
        size={18}
        color={
          highlight
            ? "var(--color-accent-dark-olive)"
            : "var(--color-text-muted)"
        }
        aria-hidden="true"
      />

      <span
        style={{
          fontFamily: "var(--font-family-primary)",
          fontSize: "var(--font-size-caption)",
          fontWeight: "var(--font-weight-semibold)",
          lineHeight: "var(--line-height-caption)",

          color: "var(--color-text-primary)",
        }}
      >
        {value}
      </span>

      <span
        style={{
          fontFamily: "var(--font-family-primary)",
          fontSize: "var(--font-size-small)",
          fontWeight: "var(--font-weight-medium)",
          lineHeight: "var(--line-height-caption)",

          color: "var(--color-text-muted)",

          textTransform: "uppercase",
          letterSpacing: "var(--letter-spacing-wide)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function BrewingGuide({
  product,
  collapsed = false,
}) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const contentId = useId();

  if (!product) return null;

  // Support both frontend and backend naming formats.
  const brewingTemp =
    product.brewingTemp ||
    product.brewing_temp ||
    "";

  const brewingTime =
    product.brewingTime ||
    product.brewing_time ||
    "";

  const teaAmount =
    product.teaAmount ||
    product.tea_amount ||
    "";

  const resteeps =
    product.resteeps ??
    product.re_steeps ??
    null;

  const hasBrewingData =
    brewingTemp ||
    brewingTime ||
    teaAmount ||
    resteeps !== null;

  if (!hasBrewingData) return null;

  return (
    <section
      style={{
        overflow: "hidden",

        backgroundColor: "var(--color-background-soft)",

        border: "1px solid var(--color-border-soft)",
        borderRadius: "var(--radius-card)",
      }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          width: "100%",

          gap: "var(--space-2)",
          padding: "var(--space-2) var(--space-3)",

          color: "var(--color-text-primary)",
          backgroundColor: "transparent",

          border: "none",

          cursor: "pointer",
          textAlign: "left",

          transition: `
            background-color var(--transition-fast) var(--ease-out)
          `,
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",

            gap: "var(--space-1)",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              width: 32,
              height: 32,

              backgroundColor: "var(--color-background-main)",

              border: "1px solid var(--color-border-soft)",
              borderRadius: "var(--radius-button)",
            }}
          >
            <LogoMark
              tone="dark"
              size="sm"
              clickable={false}
            />
          </span>

          <span
            style={{
              fontFamily: "var(--font-family-primary)",
              fontSize: "var(--font-size-caption)",
              fontWeight: "var(--font-weight-semibold)",
              lineHeight: "var(--line-height-caption)",

              color: "var(--color-text-primary)",
            }}
          >
            Brewing Guide
          </span>
        </span>

        {isExpanded ? (
          <ChevronUp
            size={17}
            color="var(--color-text-muted)"
            aria-hidden="true"
          />
        ) : (
          <ChevronDown
            size={17}
            color="var(--color-text-muted)"
            aria-hidden="true"
          />
        )}
      </button>

      {isExpanded && (
        <div
          id={contentId}
          style={{
            display: "flex",
            flexDirection: "column",

            gap: "var(--space-2)",
            padding:
              "0 var(--space-3) var(--space-3)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(110px, 1fr))",

              gap: "var(--space-1)",
            }}
          >
            {brewingTemp && (
              <BrewingStep
                icon={Thermometer}
                label="Temperature"
                value={brewingTemp}
                highlight
              />
            )}

            {brewingTime && (
              <BrewingStep
                icon={Clock}
                label="Steep time"
                value={brewingTime}
                highlight
              />
            )}

            {teaAmount && (
              <BrewingStep
                icon={Scale}
                label="Per cup"
                value={teaAmount}
              />
            )}

            {resteeps !== null && (
              <BrewingStep
                icon={RotateCcw}
                label="Resteeps"
                value={`${resteeps}×`}
              />
            )}
          </div>

          <p
            style={{
              margin: 0,

              fontFamily: "var(--font-family-primary)",
              fontSize: "var(--font-size-small)",
              fontWeight: "var(--font-weight-regular)",
              lineHeight: "var(--line-height-body)",

              color: "var(--color-text-muted)",
            }}
          >
            For best results, use filtered water and pre-warm your cup.
            Adjust the steeping time according to your preferred strength.
          </p>
        </div>
      )}
    </section>
  );
}

export default BrewingGuide;