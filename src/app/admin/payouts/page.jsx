/**
 * src/app/admin/payouts/page.jsx
 * Staff payout review.
 *
 * Access is enforced by the API, not by this page — the admin endpoints reject
 * a non-staff user with 403 regardless of what the client renders. The check
 * here only avoids showing an empty screen to someone who cannot use it.
 */

"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { AdminPayoutQueue } from "@/components/payouts/AdminPayoutQueue";

export default function AdminPayoutsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <main style={{
        display: "flex", justifyContent: "center",
        padding: "calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)",
      }}>
        <Loader2 size={20} aria-hidden />
      </main>
    );
  }

  return (
    <main
      style={{
        width: "100%",
        maxWidth: 1100,
        margin: "0 auto",
        // Clears the 68px fixed site header — see the member payout page.
        padding: "calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)",
      }}
    >
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 650, letterSpacing: "-0.02em" }}>
          Payout review
        </h1>
        <p style={{ marginTop: "0.5rem", color: "var(--color-text-muted, #7b7263)" }}>
          Approve, reject and investigate member withdrawals. Every decision is
          recorded with who made it and why.
        </p>
      </header>

      <AdminPayoutQueue />
    </main>
  );
}
