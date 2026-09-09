/**
 * src/app/chakan-tree/payouts/page.jsx
 * Member payout page.
 *
 * Gated the same way as the Chakan Tree dashboard: a member who is not
 * authenticated is sent to join, because every payout endpoint requires an
 * active membership and a verified account.
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { PayoutDashboard } from "@/components/payouts/PayoutDashboard";
import { useStore } from "@/store";

export default function PayoutsPage() {
  const router = useRouter();
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  const [mounted, setMounted] = useState(false);

  // Keeping the first server/client render identical avoids a hydration
  // mismatch with persisted Zustand state — same pattern as the dashboard.
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) router.replace("/chakan-tree/join");
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return (
      <main style={{ display: "flex", justifyContent: "center", padding: "4rem 1rem" }}>
        <Loader2 size={20} aria-hidden />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 650, letterSpacing: "-0.02em" }}>
          Withdraw your earnings
        </h1>
        <p style={{ marginTop: "0.5rem", color: "var(--color-text-muted, #7b7263)" }}>
          Commission from your Chakan Tree network, and how to cash it out.
        </p>
      </header>

      <PayoutDashboard />
    </main>
  );
}
