"use client";

import React from "react";
import Image from "next/image";

export function AIAvatar({ isStreaming = false, size = "md" }) {
  const sizeMap = { sm: 28, md: 36, lg: 44 };
  const px = sizeMap[size] || 36;

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: "50%",
        backgroundColor: "var(--color-background-dark)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(17, 17, 17, 0.18)",
        animation: isStreaming
          ? "aiAvatarPulse 1.8s ease-in-out infinite"
          : "none",
        position: "relative",
      }}
      aria-label="Chakancha AI"
    >
      <Image
        src="/images/icons/chakancha-mark-dark.svg"
        alt="Chakancha AI"
        width={Math.round(px * 0.5)}
        height={Math.round(px * 0.5)}
        style={{
          width: `${Math.round(px * 0.5)}px`,
          height: "auto",
          display: "block",
        }}
      />

      {isStreaming && (
        <div
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: "50%",
            border: "2px solid var(--color-accent-muted-gold)",
            animation: "aiAvatarRing 1.8s ease-in-out infinite",
            opacity: 0,
          }}
        />
      )}

      <style>{`
        @keyframes aiAvatarPulse {
          0%, 100% { box-shadow: 0 2px 8px rgba(17, 17, 17, 0.18); }
          50%      { box-shadow: 0 4px 16px rgba(17, 17, 17, 0.28); }
        }

        @keyframes aiAvatarRing {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(1.45); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default AIAvatar;
