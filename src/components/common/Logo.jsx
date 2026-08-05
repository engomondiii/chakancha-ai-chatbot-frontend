"use client";

import Link from "next/link";

const logoFiles = {
  mark: {
    dark: "/images/icons/chakancha-mark-dark.svg",
    white: "/images/icons/chakancha-mark-white.svg",
  },

  wordmark: {
    dark: "/images/icons/chakancha-wordmark-dark.svg",
    white: "/images/icons/chakancha-wordmark-white.svg",
  },

  lockup: {
    dark: "/images/icons/chakancha-lockup-dark.svg",
    white: "/images/icons/chakancha-lockup-white.svg",
  },
};

const logoWidths = {
  mark: {
    sm: 16,
    md: 24,
    lg: 32,
  },

  wordmark: {
    sm: 120,
    md: 160,
    lg: 200,
  },

  lockup: {
    sm: 84,
    md: 90,
    lg: 220,
  },
};

export function Logo({
  variant = "lockup",
  tone = "dark",
  size = "md",
  clickable = true,
  className = "",
}) {
  const normalizedVariant = variant === "full" ? "lockup" : variant;

  const selectedVariant = logoFiles[normalizedVariant] || logoFiles.lockup;

  const selectedSizes = logoWidths[normalizedVariant] || logoWidths.lockup;

  const src = selectedVariant[tone] || selectedVariant.dark;
  const width = selectedSizes[size] || selectedSizes.md;

  const logoImage = (
    <img
      src={src}
      alt="Chakancha"
      width={width}
      className={className}
      draggable="false"
      style={{
        display: "block",
        width: `${width}px`,
        height: "auto",
      }}
    />
  );

  if (!clickable) {
    return logoImage;
  }

  return (
    <Link
      href="/"
      aria-label="Chakancha home"
      style={{
        display: "inline-flex",
        alignItems: "center",
        textDecoration: "none",
      }}
    >
      {logoImage}
    </Link>
  );
}

export const LogoMark = (props) => <Logo variant="mark" {...props} />;

export const LogoWordmark = (props) => <Logo variant="wordmark" {...props} />;

export const LogoLockup = (props) => <Logo variant="lockup" {...props} />;

export const LogoFull = (props) => <Logo variant="lockup" {...props} />;
