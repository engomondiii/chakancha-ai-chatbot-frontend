"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { LogoMark } from "@/components/common/Logo";
import { ParticipantDashboard } from "@/components/chakan-tree/ParticipantDashboard";
import { useStore } from "@/store";

export default function ChakanTreeDashboardPage() {
  const router = useRouter();

  const membership = useStore((s) => s.membership);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const fetchMembership = useStore((s) => s.fetchMembership);

  const [mounted, setMounted] = useState(false);
  const [checked, setChecked] = useState(false);

  /* =======================================================
     CLIENT MOUNT

     Keeping the first server/client render identical helps
     avoid hydration mismatches with persisted Zustand state.
  ======================================================= */

  useEffect(() => {
    setMounted(true);
  }, []);

  /* =======================================================
     VERIFY CHAKAN TREE MEMBERSHIP
  ======================================================= */

  useEffect(() => {
    if (!mounted) return;

    let active = true;

    const checkMembership = async () => {
      /*
       * Not authenticated.
       */
      if (!isAuthenticated) {
        if (active) {
          setChecked(true);
        }

        router.replace("/chakan-tree/join");
        return;
      }

      /*
       * Refresh membership from the backend rather than
       * trusting potentially stale browser state.
       */
      try {
        await fetchMembership();
      } catch (error) {
        console.error("Failed to refresh Chakan Tree membership:", error);
      } finally {
        if (active) {
          setChecked(true);
        }
      }
    };

    checkMembership();

    return () => {
      active = false;
    };
  }, [mounted, isAuthenticated, fetchMembership, router]);

  /* =======================================================
     REDIRECT NON-MEMBERS
  ======================================================= */

  useEffect(() => {
    if (!mounted || !checked) return;

    if (!membership?.isActive) {
      router.replace("/chakan-tree/join");
    }
  }, [mounted, checked, membership, router]);

  /* =======================================================
     LOADING / REDIRECT STATE
  ======================================================= */

  if (!mounted || !checked || !membership?.isActive) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2
          size={30}
          color="var(--color-accent-muted-gold)"
          className="chakan-tree-loading"
          aria-label="Loading Chakan Tree"
        />

        <style jsx>{`
          .chakan-tree-loading {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .chakan-tree-loading {
              animation-duration: 2s;
            }
          }
        `}</style>
      </div>
    );
  }

  /* =======================================================
     ACTIVE MEMBER DASHBOARD
  ======================================================= */

  return (
    <main
      style={{
        width: "100%",
        maxWidth: "var(--max-width-content)",
        margin: "0 auto",

        padding:
          "calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",

          gap: "var(--spacing-md)",

          marginBottom: "var(--spacing-2xl)",
        }}
      >
        {/* Chakancha mark */}
        <div
          style={{
            width: 52,
            height: 52,

            flexShrink: 0,

            borderRadius: "50%",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            border: "2px solid var(--color-accent-muted-gold)",

            background: "var(--color-background-main)",
          }}
        >
          <LogoMark tone="dark" size="sm" clickable={false} />
        </div>

        {/* Heading */}
        <div>
          <p
            style={{
              margin: "0 0 3px",

              fontFamily: "var(--font-family-primary)",

              fontSize: 10,
              fontWeight: 700,

              letterSpacing: "0.1em",

              textTransform: "uppercase",

              color: "var(--color-text-muted)",
            }}
          >
            My Network
          </p>

          <h1
            style={{
              margin: 0,

              fontFamily: "var(--font-family-display)",

              fontSize: "var(--font-size-h2)",

              fontWeight: 600,

              color: "var(--color-text-primary)",
            }}
          >
            My Chakan Tree
          </h1>
        </div>
      </header>

      <ParticipantDashboard />
    </main>
  );
}
