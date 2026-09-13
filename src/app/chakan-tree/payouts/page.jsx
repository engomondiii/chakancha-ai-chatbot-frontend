/**
 * src/app/chakan-tree/payouts/page.jsx
 * Member payout page.
 *
 * Gated the same way as the Chakan Tree dashboard: a member who is not
 * authenticated is sent to join, because every payout endpoint requires an
 * active membership and a verified account.
 *
 * A <div>, not a <main>: the root layout already renders <main id="main-content">.
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { PayoutDashboard } from "@/components/payouts/PayoutDashboard";
import styles from "@/components/payouts/payouts.module.css";
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
      <div className={styles.pageLoading}>
        <Loader2 size={20} aria-hidden />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Withdraw your earnings</h1>
        <p className={styles.pageSubtitle}>
          Commission from your Chakan Tree network, and how to cash it out.
        </p>
      </header>

      <PayoutDashboard />
    </div>
  );
}
