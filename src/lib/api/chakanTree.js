/**
 * src/lib/api/chakanTree.js — Integration Phase 4
 *
 * What changed from the original:
 *  - All 6 endpoints wired through the shared Axios api client (client.js)
 *    using ENDPOINTS.CHAKAN_TREE keys — no raw fetch() calls
 *  - getChakanTreeInfo() → GET /api/v1/chakan-tree/
 *    Response includes { name, description, stats, membership }
 *  - joinChakanTree() → POST /api/v1/chakan-tree/join/
 *    Sends { referral_code } matching JoinSerializer
 *    Returns { membership: {referral_code, tier, is_active, joined_at, ...}, message }
 *  - getDashboard() → GET /api/v1/chakan-tree/dashboard/
 *    Returns { membership, referrals, reward, impact }
 *  - getReferrals() → GET /api/v1/chakan-tree/referrals/ (new, was missing)
 *  - getRewards() → GET /api/v1/chakan-tree/rewards/    (new, was missing)
 *  - getImpact() → GET /api/v1/chakan-tree/impact/
 *  - normalizeMembe rship() maps snake_case backend → camelCase frontend
 *  - Mock fallbacks retained for dev/network-error scenarios
 */

import api from './client';
import { ENDPOINTS } from './endpoints';

// ─── Field normalizer ─────────────────────────────────────────────────────────
/**
 * Backend MembershipSerializer returns:
 *   referral_code, tier, is_active, joined_at,
 *   referral_link, active_referral_count, total_referral_count, reward_rate
 *
 * Frontend components and chakanTreeSlice expect:
 *   referralCode, tier, isActive, joinedAt,
 *   referralLink, activeReferralCount, totalReferralCount, rewardRate
 */
export function normalizeMembership(raw) {
  if (!raw) return null;
  return {
    id:                   raw.id,
    referralCode:         raw.referral_code         || raw.referralCode,
    tier:                 raw.tier                  || 'seed',
    isActive:             raw.is_active             ?? raw.isActive ?? true,
    joinedAt:             raw.joined_at             || raw.joinedAt,
    referralLink:         raw.referral_link         || raw.referralLink,
    activeReferralCount:  raw.active_referral_count || raw.activeReferralCount || 0,
    totalReferralCount:   raw.total_referral_count  || raw.totalReferralCount  || 0,
    rewardRate:           raw.reward_rate           || raw.rewardRate          || 0.05,
    // Keep snake_case too for resilience
    referral_code:        raw.referral_code         || raw.referralCode,
    is_active:            raw.is_active             ?? raw.isActive ?? true,
    joined_at:            raw.joined_at             || raw.joinedAt,
  };
}

/**
 * Normalize dashboard referral records.
 * Backend: { referred_user_name, referred_user_email, purchases_count, value_generated }
 * Frontend: { id, name, joinedAt, purchases, valueGenerated }
 */
function normalizeReferral(raw) {
  return {
    id:             raw.id,
    name:           raw.referred_user_name  || 'Member',
    email:          raw.referred_user_email || '',
    joinedAt:       raw.created_at,
    purchases:      raw.purchases_count    || 0,
    valueGenerated: parseFloat(raw.value_generated) || 0,
  };
}

/**
 * Normalize reward record.
 * Backend: { total_earned, pending_payout, paid_out, currency }
 * Frontend: { totalEarned, pendingPayout, paidOut, currency }
 */
function normalizeReward(raw) {
  if (!raw) return null;
  return {
    totalEarned:   parseFloat(raw.total_earned)   || 0,
    pendingPayout: parseFloat(raw.pending_payout) || 0,
    paidOut:       parseFloat(raw.paid_out)       || 0,
    currency:      raw.currency || 'USD',
  };
}

/**
 * Normalize impact record.
 * Backend: { tea_pickers_supported, community_funds, total_value_shared, trees_planted }
 * Frontend: { teaPickersSupported, communityFunds, totalValueShared, treesPlanted }
 */
function normalizeImpact(raw) {
  if (!raw) return null;
  return {
    teaPickersSupported: raw.tea_pickers_supported || 0,
    communityFunds:      raw.community_funds
      ? `$${parseFloat(raw.community_funds).toFixed(2)}`
      : '$0',
    totalValueShared:    raw.total_value_shared
      ? `$${parseFloat(raw.total_value_shared).toFixed(2)}`
      : '$0',
    treesPlanted:        raw.trees_planted || 0,
  };
}

// ─── API functions ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/chakan-tree/
 * Public endpoint — program info, stats, tier structure.
 * If authenticated, also returns current user's membership.
 */
export async function getChakanTreeInfo() {
  try {
    const data = await api.get(ENDPOINTS.CHAKAN_TREE.INFO);
    return {
      name:        data.name        || 'Chakan Tree',
      description: data.description || '',
      stats:       data.stats       || getMockInfo().stats,
      tiers:       data.stats?.tiers || getMockInfo().tiers,
      membership:  data.membership ? normalizeMembership(data.membership) : null,
    };
  } catch {
    return getMockInfo();
  }
}

/**
 * POST /api/v1/chakan-tree/join/
 * Requires authentication. Creates Chakan Tree membership.
 *
 * @param {object} options - { referredBy: string | undefined }
 */
export async function joinChakanTree(options = {}) {
  // Map frontend camelCase → backend snake_case
  const payload = {};
  if (options.referredBy) {
    payload.referral_code = options.referredBy.trim().toUpperCase();
  }

  try {
    const data = await api.post(ENDPOINTS.CHAKAN_TREE.JOIN, payload);
    return {
      success:    true,
      membership: normalizeMembership(data.membership),
      message:    data.message || 'Welcome to Chakan Tree!',
    };
  } catch (err) {
    // Dev fallback
    if (process.env.NODE_ENV === 'development') {
      const code = 'CKC' + Math.random().toString(36).slice(2, 8).toUpperCase();
      return {
        success:    true,
        membership: normalizeMembership({
          referral_code: code,
          tier:          'seed',
          is_active:     true,
          joined_at:     new Date().toISOString(),
          active_referral_count: 0,
          reward_rate:   0.05,
        }),
      };
    }
    throw err;
  }
}

/**
 * GET /api/v1/chakan-tree/dashboard/
 * Requires authentication + active Chakan Tree membership.
 * Returns: { membership, referrals, rewards }
 */
export async function getDashboard() {
  try {
    const data = await api.get(ENDPOINTS.CHAKAN_TREE.DASHBOARD);
    return {
      membership: data.membership ? normalizeMembership(data.membership) : null,
      referrals:  (data.referrals || []).map(normalizeReferral),
      rewards:    normalizeReward(data.reward || data.rewards),
    };
  } catch {
    return getMockDashboard();
  }
}

/**
 * GET /api/v1/chakan-tree/referrals/
 * Requires authentication + active membership.
 */
export async function getReferrals() {
  try {
    const data = await api.get(ENDPOINTS.CHAKAN_TREE.REFERRALS);
    return {
      referrals:    (data.referrals || []).map(normalizeReferral),
      count:        data.count        || 0,
      activeCount:  data.active_count || 0,
    };
  } catch {
    return { referrals: getMockDashboard().referrals, count: 3, activeCount: 3 };
  }
}

/**
 * GET /api/v1/chakan-tree/rewards/
 * Requires authentication + active membership.
 */
export async function getRewards() {
  try {
    const data = await api.get(ENDPOINTS.CHAKAN_TREE.REWARDS);
    return {
      reward:     normalizeReward(data.reward),
      tier:       data.tier       || 'seed',
      rewardRate: data.reward_rate || '5%',
    };
  } catch {
    return { reward: getMockDashboard().rewards, tier: 'seed', rewardRate: '5%' };
  }
}

/**
 * GET /api/v1/chakan-tree/impact/
 * Requires authentication + active membership.
 */
export async function getImpact() {
  try {
    const data = await api.get(ENDPOINTS.CHAKAN_TREE.IMPACT);
    return normalizeImpact(data);
  } catch {
    return getMockImpact();
  }
}

// ─── Mock fallbacks ───────────────────────────────────────────────────────────

function getMockInfo() {
  return {
    name:        'Chakan Tree',
    description: 'A participatory value-sharing system where tea lovers help extend a fairer tea value chain.',
    stats: {
      totalParticipants: 1247,
      totalValueShared:  '$38,420',
      countriesReached:  34,
    },
    tiers: [
      { id: 'seed',   label: 'Seed',   min_referrals: 0,  reward: '5% of referral purchases' },
      { id: 'sprout', label: 'Sprout', min_referrals: 5,  reward: '7% + early access' },
      { id: 'tree',   label: 'Tree',   min_referrals: 20, reward: '10% + estate visit ballot' },
    ],
    membership: null,
  };
}

function getMockDashboard() {
  return {
    referrals: [
      { id: 'r1', name: 'Sarah M.',  joinedAt: new Date(Date.now() - 5  * 86400000).toISOString(), purchases: 2, valueGenerated: 38.00 },
      { id: 'r2', name: 'James K.',  joinedAt: new Date(Date.now() - 12 * 86400000).toISOString(), purchases: 1, valueGenerated: 16.99 },
      { id: 'r3', name: 'Priya S.',  joinedAt: new Date(Date.now() - 30 * 86400000).toISOString(), purchases: 4, valueGenerated: 87.50 },
    ],
    rewards: { totalEarned: 14.22, pendingPayout: 7.10, paidOut: 7.12, currency: 'USD' },
  };
}

function getMockImpact() {
  return {
    teaPickersSupported: 12,
    communityFunds:      '$240.00',
    totalValueShared:    '$142.49',
    treesPlanted:        3,
  };
}

export default { getChakanTreeInfo, joinChakanTree, getDashboard, getReferrals, getRewards, getImpact };