/**
 * src/store/slices/chakanTreeSlice.js — Integration Phase 4
 *
 * What changed from the original:
 *  - All raw fetch() calls replaced with functions from chakanTree.js API layer
 *    which use the shared Axios client (auth headers, error handling, etc.)
 *  - fetchMembership() uses getChakanTreeInfo() which includes membership if authenticated
 *  - joinChakanTree() uses joinChakanTree() from API layer
 *  - fetchDashboard() uses getDashboard() + getImpact() from API layer
 *  - All responses normalized via normalizeMembership() in chakanTree.js
 *  - showNotification → uses uiSlice showSuccess/showError via get()
 *  - getReferralLink() uses NEXT_PUBLIC_SITE_URL env var
 *  - shareReferralCode() unchanged in UI logic
 */

import {
  getChakanTreeInfo,
  joinChakanTree as apiJoinChakanTree,
  getDashboard   as apiGetDashboard,
  getImpact      as apiGetImpact,
  normalizeMembership,
} from '@/lib/api/chakanTree';

export const createChakanTreeSlice = (set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  membership: null,   // null | normalized membership object
  referrals:  [],
  rewards:    null,
  impact:     null,
  isLoading:  false,
  error:      null,

  // ── Computed ───────────────────────────────────────────────────────────────
  isJoined:     () => !!get().membership?.isActive,
  referralCode: () => get().membership?.referralCode || null,

  // ── fetchMembership ────────────────────────────────────────────────────────
  /**
   * Fetch Chakan Tree membership for the currently authenticated user.
   * Called on account page mount and after login.
   * Uses getChakanTreeInfo() which returns { membership } when authenticated.
   */
  fetchMembership: async () => {
    const { accessToken } = get();
    if (!accessToken) return;

    set({ isLoading: true, error: null });
    try {
      const info = await getChakanTreeInfo();
      set({
        membership: info.membership || null,
        isLoading:  false,
      });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // ── joinChakanTree ─────────────────────────────────────────────────────────
  /**
   * Join the Chakan Tree program.
   * POST /api/v1/chakan-tree/join/
   *
   * @param {object} options - { referredBy: string | undefined }
   */
  joinChakanTree: async (options = {}) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiJoinChakanTree(options);

      if (result.success && result.membership) {
        set({ membership: result.membership, isLoading: false });

        get().showSuccess?.(
          result.message || `Welcome to Chakan Tree! Your code: ${result.membership.referralCode}`,
          6000
        );
        return { success: true, membership: result.membership };
      }

      set({ isLoading: false });
      return { success: false, error: 'Join failed — please try again.' };

    } catch (err) {
      const msg = err.message || 'Could not join Chakan Tree. Please try again.';
      set({ error: msg, isLoading: false });
      get().showError?.(msg);
      return { success: false, error: msg };
    }
  },

  // ── fetchDashboard ─────────────────────────────────────────────────────────
  /**
   * Fetch dashboard data: referrals, rewards, and impact.
   * GET /api/v1/chakan-tree/dashboard/ + GET /api/v1/chakan-tree/impact/
   */
  fetchDashboard: async () => {
    const { accessToken } = get();
    if (!accessToken) return;

    set({ isLoading: true, error: null });
    try {
      const [dashData, impactData] = await Promise.all([
        apiGetDashboard(),
        apiGetImpact(),
      ]);

      set({
        referrals: dashData.referrals || [],
        rewards:   dashData.rewards   || null,
        impact:    impactData         || null,
        isLoading: false,
      });

      // Also refresh membership from dashboard if available
      if (dashData.membership) {
        set({ membership: dashData.membership });
      }

    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // ── getReferralLink ────────────────────────────────────────────────────────
  getReferralLink: () => {
    const code = get().membership?.referralCode;
    if (!code) return null;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chakancha.com';
    return `${baseUrl}?ref=${code}`;
  },

  // ── shareReferralCode ─────────────────────────────────────────────────────
  /**
   * Share via Web Share API or copy to clipboard.
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
      await navigator.clipboard.writeText(link);
      get().showSuccess?.('Referral link copied to clipboard!', 3000);
      return 'copied';
    } catch {
      return 'error';
    }
  },

  clearChakanTreeError: () => set({ error: null }),
});

export default createChakanTreeSlice;