/**
 * src/lib/api/chakanTree.js
 *
 * All 6 Chakan Tree endpoints wired through the shared Axios api client
 * (client.js) using ENDPOINTS.CHAKAN_TREE keys.
 *
 * Normalizers map snake_case backend fields → camelCase frontend fields.
 * They shape whatever the backend sent; they never invent values.
 *
 * Errors propagate to the caller. Callers render an error state so a
 * failing endpoint is visible rather than being disguised as empty or
 * placeholder data.
 */

import api from "./client";
import { ENDPOINTS } from "./endpoints";

// ─── Field normalizers ────────────────────────────────────────────────────────

/**
 * Backend MembershipSerializer returns:
 *   id, name, referral_code, tier, is_active, joined_at,
 *   referral_link, active_referral_count, total_referral_count, reward_rate
 *
 * Frontend components and chakanTreeSlice expect camelCase equivalents.
 */
export function normalizeMembership(raw) {
  if (!raw) return null;

  return {
    id: raw.id ?? null,
    // The member's own display name — labels the root of the referral tree
    name: raw.name ?? null,
    referralCode: raw.referral_code ?? null,
    tier: raw.tier ?? null,
    isActive: raw.is_active ?? null,
    joinedAt: raw.joined_at ?? null,
    referralLink: raw.referral_link ?? null,
    activeReferralCount: raw.active_referral_count ?? 0,
    totalReferralCount: raw.total_referral_count ?? 0,
    rewardRate: raw.reward_rate ?? null,
  };
}

/**
 * Normalize dashboard referral records.
 * Backend: { id, referred_user_name, referred_user_email,
 *            purchases_count, value_generated, created_at }
 */
function normalizeReferral(raw) {
  if (!raw) return null;

  return {
    id: raw.id ?? null,
    name: raw.referred_user_name ?? null,
    email: raw.referred_user_email ?? null,
    joinedAt: raw.created_at ?? null,
    purchases: raw.purchases_count ?? 0,
    valueGenerated: toNumber(raw.value_generated),
  };
}

/**
 * Normalize a referral tree node, recursively.
 *
 * Backend: { id, name, referral_code, level, tier, purchases,
 *            value_generated, children: [...] }
 *
 * The tree nests to the backend's maximum depth, so this must recurse —
 * a flat map would silently drop every generation below the first.
 */
function normalizeTreeNode(raw) {
  if (!raw) return null;

  const children = Array.isArray(raw.children) ? raw.children : [];

  return {
    id: raw.id ?? null,
    name: raw.name ?? null,
    referralCode: raw.referral_code ?? null,
    level: Number.isFinite(Number(raw.level)) ? Number(raw.level) : null,
    tier: raw.tier ?? null,
    purchases: raw.purchases ?? 0,
    valueGenerated: toNumber(raw.value_generated),
    children: children.map(normalizeTreeNode).filter(Boolean),
  };
}

/**
 * Normalize the per-generation earnings breakdown.
 * Backend: [{ level, participants, earnings, rate }]
 *
 * The backend decides how many levels exist and what each pays; this
 * passes that through in level order without assuming a count.
 */
function normalizeLevelEarnings(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((row) => ({
      level: Number(row.level),
      participants: row.participants ?? 0,
      earnings: toNumber(row.earnings),
      rate: row.rate ?? null,
    }))
    .filter((row) => Number.isFinite(row.level))
    .sort((a, b) => a.level - b.level);
}

/**
 * Normalize reward record.
 * Backend: { total_earned, pending_payout, paid_out, currency }
 */
function normalizeReward(raw) {
  if (!raw) return null;

  return {
    totalEarned: toNumber(raw.total_earned),
    pendingPayout: toNumber(raw.pending_payout),
    paidOut: toNumber(raw.paid_out),
    currency: raw.currency ?? null,
  };
}

/**
 * Normalize impact record.
 * Backend: { tea_pickers_supported, community_funds,
 *            total_value_shared, trees_planted }
 *
 * Monetary values stay numeric here. Formatting is the component's job,
 * so currency and locale are decided at render time rather than baked
 * into a string at the transport layer.
 */
function normalizeImpact(raw) {
  if (!raw) return null;

  return {
    teaPickersSupported: raw.tea_pickers_supported ?? 0,
    communityFunds: toNumber(raw.community_funds),
    totalValueShared: toNumber(raw.total_value_shared),
    treesPlanted: raw.trees_planted ?? 0,
  };
}

/**
 * Parse a backend decimal string to a number.
 * Returns null for absent values so "no data" stays distinguishable
 * from a real zero.
 */
function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

// ─── API functions ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/chakan-tree/
 * Public endpoint — program info, stats, tier structure, MGM level rates.
 * If authenticated, also returns the current user's membership.
 */
export async function getChakanTreeInfo() {
  const data = await api.get(ENDPOINTS.CHAKAN_TREE.INFO);

  const stats = data.stats ?? {};

  return {
    name: data.name ?? null,
    description: data.description ?? null,
    stats,
    tiers: stats.tiers ?? [],
    // MGM reward cascade — the backend defines the rates and the depth
    levels: stats.levels ?? [],
    maxDepth: stats.max_depth ?? null,
    membership: data.membership ? normalizeMembership(data.membership) : null,
  };
}

/**
 * POST /api/v1/chakan-tree/join/
 * Requires authentication. Creates a Chakan Tree membership.
 *
 * @param {object} options - { referredBy?: string }
 */
export async function joinChakanTree(options = {}) {
  // Map frontend camelCase → backend snake_case
  const payload = {};

  if (options.referredBy) {
    payload.referral_code = options.referredBy.trim().toUpperCase();
  }

  const data = await api.post(ENDPOINTS.CHAKAN_TREE.JOIN, payload);

  return {
    membership: normalizeMembership(data.membership),
    message: data.message ?? null,
  };
}

/**
 * GET /api/v1/chakan-tree/dashboard/
 * Requires authentication + active Chakan Tree membership.
 *
 * Returns: {
 *   membership,
 *   referrals,      — direct referrals, flat
 *   rewards,        — aggregate totals
 *   impact,
 *   referralTree,   — nested to the backend's maximum depth
 *   levelEarnings,  — per-generation breakdown
 * }
 */
export async function getDashboard() {
  const data = await api.get(ENDPOINTS.CHAKAN_TREE.DASHBOARD);

  return {
    membership: data.membership ? normalizeMembership(data.membership) : null,
    referrals: (data.referrals ?? []).map(normalizeReferral).filter(Boolean),
    rewards: normalizeReward(data.reward),
    impact: normalizeImpact(data.impact),

    /*
     * MGM structure. Both were previously dropped by this function,
     * which is why the tree only ever rendered one generation.
     */
    referralTree: normalizeTreeNode(data.referral_tree),
    levelEarnings: normalizeLevelEarnings(data.level_earnings),
  };
}

/**
 * GET /api/v1/chakan-tree/referrals/
 * Requires authentication + active membership.
 */
export async function getReferrals() {
  const data = await api.get(ENDPOINTS.CHAKAN_TREE.REFERRALS);

  return {
    referrals: (data.referrals ?? []).map(normalizeReferral).filter(Boolean),
    count: data.count ?? 0,
    activeCount: data.active_count ?? 0,
  };
}

/**
 * GET /api/v1/chakan-tree/rewards/
 * Requires authentication + active membership.
 */
export async function getRewards() {
  const data = await api.get(ENDPOINTS.CHAKAN_TREE.REWARDS);

  return {
    reward: normalizeReward(data.reward),
    tier: data.tier ?? null,
    rewardRate: data.reward_rate ?? null,
  };
}

/**
 * GET /api/v1/chakan-tree/impact/
 * Requires authentication + active membership.
 */
export async function getImpact() {
  const data = await api.get(ENDPOINTS.CHAKAN_TREE.IMPACT);

  return normalizeImpact(data);
}

export default {
  getChakanTreeInfo,
  joinChakanTree,
  getDashboard,
  getReferrals,
  getRewards,
  getImpact,
};
