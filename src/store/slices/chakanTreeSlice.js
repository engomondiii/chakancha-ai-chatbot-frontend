/**
 * chakanTreeSlice.js
 * Zustand slice for Chakan Tree participation state.
 * Tracks membership, referrals, rewards, and impact metrics.
 */

import { API_ENDPOINTS } from '@/lib/constants/apiEndpoints';

async function apiFetch(url, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return res.json();
}

export const createChakanTreeSlice = (set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  membership:   null,   // null | { referralCode, joinedAt, tier, isActive }
  referrals:    [],     // Array of referral records
  rewards:      null,   // { totalEarned, pendingPayout, paidOut }
  impact:       null,   // { teaPickersSupported, communityFunds, totalValue }
  isLoading:    false,
  error:        null,

  // ── Computed ───────────────────────────────────────────────────────────────

  isJoined: () => !!get().membership?.isActive,
  referralCode: () => get().membership?.referralCode || null,

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch current Chakan Tree membership status.
   * Called on account page mount and after login.
   */
  fetchMembership: async () => {
    const { accessToken } = get();
    if (!accessToken) return;

    set({ isLoading: true, error: null });

    try {
      const data = await apiFetch(
        API_ENDPOINTS.CHAKAN_TREE.INFO,
        { method: 'GET' },
        accessToken
      );
      set({ membership: data.membership || null, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  /**
   * Join the Chakan Tree program.
   *
   * @param {object} options - { referredBy: string|null }
   */
  joinChakanTree: async (options = {}) => {
    const { accessToken } = get();
    set({ isLoading: true, error: null });

    try {
      const data = await apiFetch(
        API_ENDPOINTS.CHAKAN_TREE.JOIN,
        { method: 'POST', body: JSON.stringify(options) },
        accessToken
      );

      set({
        membership: data.membership,
        isLoading:  false,
      });

      // Show success notification
      get().showNotification?.(
        'Welcome to Chakan Tree! Your referral code is ready.',
        'success',
        6000
      );

      return { success: true, membership: data.membership };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetch dashboard data: referrals, rewards, impact.
   */
  fetchDashboard: async () => {
    const { accessToken } = get();
    if (!accessToken) return;

    set({ isLoading: true, error: null });

    try {
      const [dashData, impactData] = await Promise.all([
        apiFetch(API_ENDPOINTS.CHAKAN_TREE.DASHBOARD, { method: 'GET' }, accessToken),
        apiFetch(API_ENDPOINTS.CHAKAN_TREE.IMPACT,    { method: 'GET' }, accessToken),
      ]);

      set({
        referrals: dashData.referrals || [],
        rewards:   dashData.rewards   || null,
        impact:    impactData.impact  || null,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  /**
   * Get referral link for sharing.
   */
  getReferralLink: () => {
    const code = get().membership?.referralCode;
    if (!code) return null;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chakancha.com';
    return `${baseUrl}?ref=${code}`;
  },

  /**
   * Share referral code via Web Share API or copy to clipboard.
   *
   * @returns {Promise<'shared'|'copied'|'error'>}
   */
  shareReferralCode: async () => {
    const link = get().getReferralLink?.() || get().getReferralLink();
    const code = get().membership?.referralCode;

    if (!link || !code) return 'error';

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join me on Chakancha — premium tea with a better value chain',
          text:  `Discover exceptional tea from Nandi Hills, Kenya. Use my referral code ${code} for an exclusive benefit.`,
          url:   link,
        });
        return 'shared';
      }

      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(link);
      get().showNotification?.(
        'Referral link copied to clipboard!',
        'success',
        3000
      );
      return 'copied';
    } catch {
      return 'error';
    }
  },

  clearChakanTreeError: () => set({ error: null }),
});

export default createChakanTreeSlice;