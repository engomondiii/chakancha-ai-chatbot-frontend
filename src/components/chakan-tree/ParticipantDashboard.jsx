/**
 * src/components/chakan-tree/ParticipantDashboard.jsx
 *
 * Chakan Tree participant dashboard.
 *
 * Includes:
 *  - Referral code
 *  - Overall rewards
 *  - MGM level earnings
 *  - Visual referral tree
 *  - Impact metrics
 *  - Existing detailed referral list
 *
 * Referral tree behavior:
 *  - Uses dashboard.referralTree / dashboard.referral_tree when available
 *  - Falls back to dashboard.referrals as Level 1 children
 *  - Root user is always shown even with zero referrals
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";

import { Users, TrendingUp, Network, Layers3 } from "lucide-react";

import { getDashboard, getImpact } from "@/lib/api/chakanTree";

import { ReferralCode } from "./ReferralCode";
import { ImpactTracker } from "./ImpactTracker";
import { RewardsSummary } from "./RewardsSummary";
import ReferralTree from "./chakanTree";

import { Skeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/store";

/* =========================================================
   TREE NORMALIZATION
========================================================= */

function normalizeTreeNode(node) {
  if (!node) return null;

  const children = node.children || node.referrals || [];

  return {
    id: node.id || node.userId || node.user_id || null,

    name:
      node.name ||
      node.nickname ||
      node.fullName ||
      node.full_name ||
      "Participant",

    nickname: node.nickname || null,

    referralCode: node.referralCode || node.referral_code || null,

    purchases: Number(node.purchases ?? node.purchase_count ?? 0),

    valueGenerated: Number(node.valueGenerated ?? node.value_generated ?? 0),

    children: Array.isArray(children)
      ? children.map(normalizeTreeNode).filter(Boolean)
      : [],
  };
}

/* =========================================================
   BUILD TREE

   Priority:
   1. Real hierarchical MGM tree from backend
   2. Current flat referrals as Level 1 fallback
========================================================= */

function buildReferralTree(dashboard, membership) {
  const backendTree =
    dashboard?.referralTree ||
    dashboard?.referral_tree ||
    dashboard?.tree ||
    null;

  /*
   * Real multi-generation tree.
   */
  if (backendTree) {
    const normalized = normalizeTreeNode(backendTree);

    return {
      ...normalized,

      id: normalized?.id || membership?.id || "root-user",

      name: "You",

      referralCode:
        membership?.referralCode || normalized?.referralCode || null,
    };
  }

  /*
   * Temporary fallback using the current
   * direct-referral list.
   *
   * These become Level 1 nodes.
   */
  const referrals = Array.isArray(dashboard?.referrals)
    ? dashboard.referrals
    : [];

  return {
    id: membership?.id || "root-user",

    name: "You",

    referralCode: membership?.referralCode || null,

    children: referrals
      .map((referral) => ({
        ...normalizeTreeNode(referral),
        children: [],
      }))
      .filter(Boolean),
  };
}

/* =========================================================
   TREE MEMBER COUNT
========================================================= */

function countTreeMembers(node) {
  if (!node) return 0;

  return (
    1 +
    (node.children || []).reduce(
      (total, child) => total + countTreeMembers(child),
      0,
    )
  );
}

/* =========================================================
   LEVEL EARNINGS NORMALIZATION
========================================================= */

function normalizeLevelEarnings(data) {
  if (!data) return [];

  /*
   * Preferred backend format:
   *
   * [
   *   {
   *     level: 1,
   *     participants: 4,
   *     earnings: 20
   *   }
   * ]
   */
  if (Array.isArray(data)) {
    return data
      .map((item, index) => ({
        level: Number(item.level ?? item.generation ?? index + 1),

        participants: Number(
          item.participants ??
            item.people ??
            item.members ??
            item.member_count ??
            0,
        ),

        earnings: Number(item.earnings ?? item.amount ?? item.total ?? 0),
      }))
      .sort((a, b) => a.level - b.level);
  }

  /*
   * Also support:
   *
   * {
   *   "1": 20,
   *   "2": 10,
   *   "3": 5
   * }
   */
  if (typeof data === "object") {
    return Object.entries(data)
      .map(([level, value]) => {
        if (value && typeof value === "object") {
          return {
            level: Number(level),

            participants: Number(
              value.participants ?? value.people ?? value.members ?? 0,
            ),

            earnings: Number(
              value.earnings ?? value.amount ?? value.total ?? 0,
            ),
          };
        }

        return {
          level: Number(level),
          participants: 0,
          earnings: Number(value || 0),
        };
      })
      .filter((item) => Number.isFinite(item.level))
      .sort((a, b) => a.level - b.level);
  }

  return [];
}

/* =========================================================
   CURRENCY
========================================================= */

function formatMoney(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(Number(amount || 0));
  } catch {
    return `$${Number(amount || 0).toFixed(2)}`;
  }
}

/* =========================================================
   LEVEL EARNINGS UI
========================================================= */

function LevelEarnings({ levels, currency = "USD" }) {
  return (
    <div
      style={{
        background: "var(--color-surface-card)",

        border: "1px solid var(--color-border-soft)",

        borderRadius: "var(--radius-card)",

        overflow: "hidden",
      }}
    >
      {levels.length > 0 ? (
        <>
          {/* Table header */}
          <div
            style={{
              display: "grid",

              gridTemplateColumns: "1fr 1fr 1fr",

              padding: "12px var(--spacing-md)",

              background: "var(--color-background-soft)",

              borderBottom: "1px solid var(--color-border-soft)",
            }}
          >
            <TableHeading>Level</TableHeading>

            <TableHeading align="center">Members</TableHeading>

            <TableHeading align="right">Earnings</TableHeading>
          </div>

          {/* Rows */}
          {levels.map((level, index) => (
            <div
              key={level.level}
              style={{
                display: "grid",

                gridTemplateColumns: "1fr 1fr 1fr",

                alignItems: "center",

                padding: "14px var(--spacing-md)",

                borderBottom:
                  index < levels.length - 1
                    ? "1px solid var(--color-divider-soft)"
                    : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,

                    borderRadius: "50%",

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    border: "1px solid var(--color-accent-muted-gold)",

                    background: "var(--color-background-main)",

                    fontFamily: "var(--font-family-primary)",

                    fontSize: 11,
                    fontWeight: 700,

                    color: "var(--color-text-primary)",
                  }}
                >
                  {level.level}
                </div>

                <span
                  style={{
                    fontFamily: "var(--font-family-primary)",

                    fontSize: 13,

                    fontWeight: 600,

                    color: "var(--color-text-primary)",
                  }}
                >
                  Level {level.level}
                </span>
              </div>

              <span
                style={{
                  textAlign: "center",

                  fontFamily: "var(--font-family-primary)",

                  fontSize: 13,

                  color: "var(--color-text-secondary)",
                }}
              >
                {level.participants}
              </span>

              <span
                style={{
                  textAlign: "right",

                  fontFamily: "var(--font-family-primary)",

                  fontSize: 14,

                  fontWeight: 700,

                  color: "var(--color-accent-dark-olive)",
                }}
              >
                {formatMoney(level.earnings, currency)}
              </span>
            </div>
          ))}
        </>
      ) : (
        <div
          style={{
            padding: "var(--spacing-lg)",

            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,

              fontFamily: "var(--font-family-primary)",

              fontSize: 13,

              lineHeight: 1.6,

              color: "var(--color-text-muted)",
            }}
          >
            No level earnings recorded yet. Your MGM earnings will appear here
            as your Chakan Tree grows.
          </p>
        </div>
      )}
    </div>
  );
}

function TableHeading({ children, align = "left" }) {
  return (
    <span
      style={{
        textAlign: align,

        fontFamily: "var(--font-family-primary)",

        fontSize: 10,

        fontWeight: 700,

        textTransform: "uppercase",

        letterSpacing: "0.08em",

        color: "var(--color-text-muted)",
      }}
    >
      {children}
    </span>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

export function ParticipantDashboard() {
  const membership = useStore((state) => state.membership);

  const [dashboard, setDashboard] = useState(null);

  const [impact, setImpact] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.all([getDashboard(), getImpact()])
      .then(([dashboardData, impactData]) => {
        if (!active) return;

        setDashboard(dashboardData);

        setImpact(impactData);
      })
      .catch((err) => {
        if (!active) return;

        setError(err?.message || "Unable to load your Chakan Tree dashboard.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  /* -------------------------------------------------------
     Membership / referral code
  ------------------------------------------------------- */

  const referralCode = membership?.referralCode || null;

  const referralLink = referralCode
    ? `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://chakancha.com"
      }?ref=${referralCode}`
    : null;

  /* -------------------------------------------------------
     Loading
  ------------------------------------------------------- */

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",

          gap: "var(--spacing-lg)",
        }}
      >
        <Skeleton variant="rect" height="120px" />

        <Skeleton variant="rect" height="150px" />

        <Skeleton variant="rect" height="420px" />

        <Skeleton variant="rect" height="200px" />
      </div>
    );
  }

  /* -------------------------------------------------------
     API data
  ------------------------------------------------------- */

  const referrals = Array.isArray(dashboard?.referrals)
    ? dashboard.referrals
    : [];

  const rewards = dashboard?.rewards || null;

  const rawLevelEarnings =
    dashboard?.levelEarnings ||
    dashboard?.level_earnings ||
    dashboard?.earningsByLevel ||
    dashboard?.earnings_by_level ||
    [];

  const levelEarnings = normalizeLevelEarnings(rawLevelEarnings);

  const currency = rewards?.currency || dashboard?.currency || "USD";

  /* -------------------------------------------------------
     Tree data
  ------------------------------------------------------- */

  const referralTree = useMemo(
    () => buildReferralTree(dashboard, membership),
    [dashboard, membership],
  );

  const peopleInTree = Math.max(countTreeMembers(referralTree) - 1, 0);

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */

  return (
    <div
      style={{
        display: "flex",

        flexDirection: "column",

        gap: "var(--spacing-2xl)",
      }}
    >
      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div
          style={{
            padding: "var(--spacing-md)",

            border: "1px solid var(--color-error)",

            borderRadius: "var(--radius-card)",

            background: "var(--color-surface-card)",

            fontFamily: "var(--font-family-primary)",

            fontSize: 13,

            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      {/* ===================================================
          REFERRAL CODE
      =================================================== */}

      {referralCode && (
        <ReferralCode code={referralCode} referralLink={referralLink} />
      )}

      {/* ===================================================
          OVERALL REWARDS
      =================================================== */}

      {rewards && (
        <section>
          <SectionTitle icon={TrendingUp}>Your Rewards</SectionTitle>

          <RewardsSummary rewards={rewards} />
        </section>
      )}

      {/* ===================================================
          MGM LEVEL EARNINGS
      =================================================== */}

      <section>
        <SectionTitle icon={Layers3}>Level Earnings</SectionTitle>

        <p
          style={{
            margin: "calc(var(--spacing-sm) * -1) 0 var(--spacing-md)",

            fontFamily: "var(--font-family-primary)",

            fontSize: 13,

            lineHeight: 1.6,

            color: "var(--color-text-muted)",
          }}
        >
          See how earnings are distributed across each generation of your
          referral network.
        </p>

        <LevelEarnings levels={levelEarnings} currency={currency} />
      </section>

      {/* ===================================================
          ACTUAL CHAKAN TREE
      =================================================== */}

      <section>
        <div
          style={{
            display: "flex",

            alignItems: "flex-end",

            justifyContent: "space-between",

            gap: "var(--spacing-md)",

            marginBottom: "var(--spacing-md)",

            flexWrap: "wrap",
          }}
        >
          <div>
            <SectionTitle icon={Network} marginBottom={6}>
              Your Referral Tree
            </SectionTitle>

            <p
              style={{
                margin: 0,

                fontFamily: "var(--font-family-primary)",

                fontSize: 13,

                lineHeight: 1.6,

                color: "var(--color-text-muted)",
              }}
            >
              You are the root. Each connected branch represents another
              participant in your MGM network.
            </p>
          </div>

          <div
            style={{
              display: "inline-flex",

              alignItems: "center",

              gap: 6,

              padding: "7px 12px",

              borderRadius: "var(--radius-button)",

              border: "1px solid var(--color-border-soft)",

              background: "var(--color-background-soft)",

              fontFamily: "var(--font-family-primary)",

              fontSize: 11,

              fontWeight: 600,

              color: "var(--color-text-secondary)",
            }}
          >
            <Users size={13} />
            {peopleInTree} participant
            {peopleInTree === 1 ? "" : "s"}
          </div>
        </div>

        {/*
         * ReferralTree always receives
         * a root for active members.
         *
         * Therefore:
         *
         * 0 referrals
         * → root circle only
         *
         * direct referrals only
         * → Level 1 tree
         *
         * hierarchical backend tree
         * → full MGM tree automatically
         */}
        <ReferralTree root={referralTree} />
      </section>

      {/* ===================================================
          IMPACT
      =================================================== */}

      {impact && (
        <section>
          <SectionTitle icon={Users}>Your Impact</SectionTitle>

          <ImpactTracker impact={impact} />
        </section>
      )}

      {/* ===================================================
          EXISTING REFERRAL TABLE — KEEP
      =================================================== */}

      <section>
        <SectionTitle icon={Users}>
          People You've Invited
          {referrals.length > 0 ? ` (${referrals.length})` : ""}
        </SectionTitle>

        {referrals.length > 0 ? (
          <div
            style={{
              background: "var(--color-surface-card)",

              border: "1px solid var(--color-border-soft)",

              borderRadius: "var(--radius-card)",

              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",

                gridTemplateColumns: "minmax(140px, 1fr) 110px 130px",

                gap: "var(--spacing-sm)",

                padding: "11px var(--spacing-md)",

                background: "var(--color-background-soft)",

                borderBottom: "1px solid var(--color-border-soft)",
              }}
            >
              <TableHeading>Participant</TableHeading>

              <TableHeading align="center">Purchases</TableHeading>

              <TableHeading align="right">Value Generated</TableHeading>
            </div>

            {referrals.map((referral, index) => {
              const purchases = Number(referral.purchases || 0);

              const value = Number(
                referral.valueGenerated ?? referral.value_generated ?? 0,
              );

              return (
                <div
                  key={
                    referral.id ||
                    referral.referralCode ||
                    referral.referral_code ||
                    index
                  }
                  style={{
                    display: "grid",

                    gridTemplateColumns: "minmax(140px, 1fr) 110px 130px",

                    alignItems: "center",

                    gap: "var(--spacing-sm)",

                    padding: "14px var(--spacing-md)",

                    borderBottom:
                      index < referrals.length - 1
                        ? "1px solid var(--color-divider-soft)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,

                        overflow: "hidden",

                        textOverflow: "ellipsis",

                        whiteSpace: "nowrap",

                        fontFamily: "var(--font-family-primary)",

                        fontSize: 13,

                        fontWeight: 600,

                        color: "var(--color-text-primary)",
                      }}
                    >
                      {referral.name || referral.nickname || "Participant"}
                    </p>

                    {(referral.referralCode || referral.referral_code) && (
                      <p
                        style={{
                          margin: "2px 0 0",

                          fontFamily: "var(--font-family-mono)",

                          fontSize: 9,

                          color: "var(--color-text-muted)",
                        }}
                      >
                        {referral.referralCode || referral.referral_code}
                      </p>
                    )}
                  </div>

                  <span
                    style={{
                      textAlign: "center",

                      fontFamily: "var(--font-family-primary)",

                      fontSize: 13,

                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {purchases}
                  </span>

                  <span
                    style={{
                      textAlign: "right",

                      fontFamily: "var(--font-family-primary)",

                      fontSize: 13,

                      fontWeight: 700,

                      color: "var(--color-accent-dark-olive)",
                    }}
                  >
                    {formatMoney(value, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",

              padding: "var(--spacing-2xl)",

              background: "var(--color-background-soft)",

              border: "1px solid var(--color-border-soft)",

              borderRadius: "var(--radius-card)",
            }}
          >
            <p
              style={{
                margin: 0,

                fontFamily: "var(--font-family-primary)",

                fontSize: 13,

                lineHeight: 1.6,

                color: "var(--color-text-muted)",
              }}
            >
              No referrals yet. Your root node is active — share your referral
              code to grow your first branch.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   SHARED SECTION TITLE
========================================================= */

function SectionTitle({
  children,
  icon: Icon,
  marginBottom = "var(--spacing-md)",
}) {
  return (
    <h3
      style={{
        margin: `0 0 ${marginBottom}`,

        display: "flex",

        alignItems: "center",

        gap: 8,

        fontFamily: "var(--font-family-display)",

        fontSize: 18,

        fontWeight: 600,

        color: "var(--color-text-primary)",
      }}
    >
      {Icon && <Icon size={16} color="var(--color-accent-muted-gold)" />}

      {children}
    </h3>
  );
}

export default ParticipantDashboard;
