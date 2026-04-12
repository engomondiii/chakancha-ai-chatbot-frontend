/**
 * useAuth.js
 * Custom hook for authentication functionality.
 * Fully wired to authSlice in the Zustand store.
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'next/navigation';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ─── Primary hook ──────────────────────────────────────────────────────────────

/**
 * useAuth
 * Full authentication state and all actions.
 */
export function useAuth() {
  // ── State ──────────────────────────────────────────────────────────────────
  const user            = useStore((s) => s.user);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const authLoading     = useStore((s) => s.authLoading);
  const authError       = useStore((s) => s.authError);
  const accessToken     = useStore((s) => s.accessToken);

  // ── Actions ────────────────────────────────────────────────────────────────
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

  // ── Computed ───────────────────────────────────────────────────────────────
  const userName     = user?.name || user?.email || 'Guest';
  const userInitials = user ? getInitials(user.name || user.email) : '';
  const hasProfile   = user !== null;
  const isGuest      = !isAuthenticated;

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
 * useAuthStatus — lightweight auth status check.
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
 * useAuthActions — actions only (no re-renders on state change).
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
 * Redirects to /login if user is not authenticated.
 * Calls verifyToken on mount to handle page refresh.
 *
 * @param {string} [redirectTo] - Path to return to after login
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
 * Redirects authenticated users away (for login/signup pages).
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
 * Called from StoreProvider or layout.
 */
export function useAutoLogin() {
  const verifyToken     = useStore((s) => s.verifyToken);
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      verifyToken();
    }
  }, [verifyToken, isAuthenticated]);
}

/**
 * useLogout
 * Enhanced logout that also clears cart and conversation.
 *
 * @returns {function} logout(redirectTo?)
 */
export function useLogout() {
  const router          = useRouter();
  const logout          = useStore((s) => s.logout);
  const clearCart       = useStore((s) => s.clearCart);
  const clearConversation = useStore((s) => s.clearConversation);

  return useCallback(
    async (redirectTo = '/') => {
      await logout();
      clearCart();
      clearConversation();
      router.push(redirectTo);
    },
    [logout, clearCart, clearConversation, router]
  );
}

export default useAuth;