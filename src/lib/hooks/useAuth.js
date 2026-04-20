/**
 * src/lib/hooks/useAuth.js
 * Authentication hook — Integration Phase 1.
 *
 * What changed from the original:
 *  - useLogout now also clears refreshToken from localStorage
 *    (not just accessToken — required because backend blacklists refresh tokens)
 *  - useRequireAuth uses verifyToken which now handles the refresh flow internally
 *  - useAutoLogin is unchanged in interface but verifyToken now does more
 *  - All other hooks unchanged — they correctly read from the updated authSlice
 *
 * No API import needed — all auth actions go through authSlice.js
 * which uses authFetch internally at slice initialisation time.
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'next/navigation';
import { clearSessionId } from '@/lib/api/client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ─── Primary hook ──────────────────────────────────────────────────────────────

/**
 * useAuth
 * Full authentication state + all actions.
 * Use this in forms, nav, account pages, etc.
 */
export function useAuth() {
  const user            = useStore((s) => s.user);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const authLoading     = useStore((s) => s.authLoading);
  const authError       = useStore((s) => s.authError);
  const accessToken     = useStore((s) => s.accessToken);

  const {
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    refreshAccessToken,
    verifyToken,
    clearAuthError,
  } = useStore(
    useShallow((s) => ({
      login:                s.login,
      signup:               s.signup,
      logout:               s.logout,
      updateProfile:        s.updateProfile,
      changePassword:       s.changePassword,
      requestPasswordReset: s.requestPasswordReset,
      resetPassword:        s.resetPassword,
      refreshAccessToken:   s.refreshAccessToken,
      verifyToken:          s.verifyToken,
      clearAuthError:       s.clearAuthError,
    }))
  );

  // Computed
  const userName     = user?.name || user?.email || 'Guest';
  const userInitials = user ? getInitials(user.name || user.email) : '';
  const hasProfile   = user !== null;
  const isGuest      = !isAuthenticated;
  const isVerified   = user?.is_verified === true;

  return {
    // State
    user,
    isAuthenticated,
    authLoading,
    authError,
    accessToken,

    // Computed
    userName,
    userInitials,
    hasProfile,
    isGuest,
    isVerified,

    // Actions
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    refreshAccessToken,
    verifyToken,
    clearAuthError,
  };
}

// ─── Sub-hooks ─────────────────────────────────────────────────────────────────

/**
 * useAuthStatus — lightweight check (no actions, minimal re-renders).
 */
export function useAuthStatus() {
  return useStore(
    useShallow((s) => ({
      isAuthenticated: s.isAuthenticated,
      isLoading:       s.authLoading,
      isGuest:         !s.isAuthenticated,
    }))
  );
}

/**
 * useUser — current user object only.
 */
export function useUser() {
  return useStore((s) => s.user);
}

/**
 * useAuthActions — actions only (no state subscription, no re-renders).
 */
export function useAuthActions() {
  return useStore(
    useShallow((s) => ({
      login:         s.login,
      signup:        s.signup,
      logout:        s.logout,
      updateProfile: s.updateProfile,
    }))
  );
}

/**
 * useRequireAuth
 * Redirects to /login if the user is not authenticated.
 * Calls verifyToken on mount — verifyToken will silently refresh
 * the access token if it's expired, so page refreshes don't log users out.
 *
 * @param {string} [redirectTo] - URL-encoded return path after login
 */
export function useRequireAuth(redirectTo = null) {
  const router = useRouter();
  const { isAuthenticated, authLoading, verifyToken } = useAuth();

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const loginUrl = redirectTo
        ? `/login?redirect=${encodeURIComponent(redirectTo)}`
        : '/login';
      router.push(loginUrl);
    }
  }, [isAuthenticated, authLoading, redirectTo, router]);

  return { isAuthenticated, isLoading: authLoading };
}

/**
 * useGuestOnly
 * Redirects authenticated users away from login/signup pages.
 */
export function useGuestOnly() {
  const router = useRouter();
  const { isAuthenticated, authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  return { isAuthenticated, isLoading: authLoading };
}

/**
 * useAutoLogin
 * Verifies the stored token once on app mount.
 * Called from the root layout.jsx provider.
 * verifyToken handles the refresh flow internally — no extra logic needed here.
 */
export function useAutoLogin() {
  const verifyToken     = useStore((s) => s.verifyToken);
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  useEffect(() => {
    verifyToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount
}

/**
 * useLogout
 * Enhanced logout that:
 *  1. Calls backend to blacklist the refresh token
 *  2. Clears cart state
 *  3. Clears AI conversation state
 *  4. Clears the SSE session ID (new conversation on next visit)
 *  5. Redirects to the given path (default: '/')
 *
 * @returns {function} logout(redirectTo?)
 */
export function useLogout() {
  const router            = useRouter();
  const logout            = useStore((s) => s.logout);
  const clearCart         = useStore((s) => s.clearCart);
  const clearConversation = useStore((s) => s.clearConversation);

  return useCallback(
    async (redirectTo = '/') => {
      await logout();          // Blacklists token on backend + clears localStorage
      clearCart?.();           // Clears Zustand cart state
      clearConversation?.();   // Clears Zustand AI conversation state
      clearSessionId();        // Clears the SSE session UUID from localStorage
      router.push(redirectTo);
    },
    [logout, clearCart, clearConversation, router]
  );
}

export default useAuth;