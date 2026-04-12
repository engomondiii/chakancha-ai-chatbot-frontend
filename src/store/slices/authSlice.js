/**
 * authSlice.js
 * Zustand slice for authentication state.
 * Integrates with the backend auth API and manages JWT access tokens.
 */

import { API_ENDPOINTS } from '@/lib/constants/apiEndpoints';

const TOKEN_STORAGE_KEY = 'chakancha_access_token';
const USER_STORAGE_KEY  = 'chakancha_user';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadStoredAuth() {
  if (typeof window === 'undefined') return { user: null, accessToken: null };

  try {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    const user  = window.localStorage.getItem(USER_STORAGE_KEY);
    return {
      accessToken: token || null,
      user:        user ? JSON.parse(user) : null,
    };
  } catch {
    return { user: null, accessToken: null };
  }
}

function persistAuth(user, accessToken) {
  if (typeof window === 'undefined') return;
  try {
    if (accessToken) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    }
    if (user) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  } catch {
    // Fail silently
  }
}

function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Fail silently
  }
}

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

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createAuthSlice = (set, get) => {
  // Hydrate from localStorage on creation
  const stored = loadStoredAuth();

  return {
    // ── State ────────────────────────────────────────────────────────────────
    user:            stored.user,
    isAuthenticated: !!(stored.user && stored.accessToken),
    authLoading:     false,
    authError:       null,
    accessToken:     stored.accessToken,

    // ── Actions ──────────────────────────────────────────────────────────────

    /**
     * Sign in with email + password.
     */
    login: async (email, password) => {
      set({ authLoading: true, authError: null });

      try {
        const data = await apiFetch(API_ENDPOINTS.AUTH.LOGIN, {
          method: 'POST',
          body:   JSON.stringify({ email, password }),
        });

        const { user, accessToken } = data;
        persistAuth(user, accessToken);

        set({ user, accessToken, isAuthenticated: true, authLoading: false });
        return { success: true, user };
      } catch (err) {
        set({ authError: err.message, authLoading: false });
        return { success: false, error: err.message };
      }
    },

    /**
     * Register a new account.
     */
    signup: async (name, email, password) => {
      set({ authLoading: true, authError: null });

      try {
        const data = await apiFetch(API_ENDPOINTS.AUTH.SIGNUP, {
          method: 'POST',
          body:   JSON.stringify({ name, email, password }),
        });

        const { user, accessToken } = data;
        persistAuth(user, accessToken);

        set({ user, accessToken, isAuthenticated: true, authLoading: false });
        return { success: true, user };
      } catch (err) {
        set({ authError: err.message, authLoading: false });
        return { success: false, error: err.message };
      }
    },

    /**
     * Sign out.
     */
    logout: async () => {
      const { accessToken } = get();

      // Fire-and-forget logout call
      if (accessToken) {
        apiFetch(API_ENDPOINTS.AUTH.LOGOUT, { method: 'POST' }, accessToken).catch(
          () => {}
        );
      }

      clearStoredAuth();
      set({
        user:            null,
        accessToken:     null,
        isAuthenticated: false,
        authError:       null,
      });
    },

    /**
     * Update profile fields.
     */
    updateProfile: async (updates) => {
      const { accessToken } = get();
      set({ authLoading: true, authError: null });

      try {
        const data = await apiFetch(
          API_ENDPOINTS.USER.UPDATE_PROFILE,
          { method: 'PUT', body: JSON.stringify(updates) },
          accessToken
        );

        const updatedUser = { ...get().user, ...data.user };
        persistAuth(updatedUser, accessToken);
        set({ user: updatedUser, authLoading: false });
        return { success: true };
      } catch (err) {
        set({ authError: err.message, authLoading: false });
        return { success: false, error: err.message };
      }
    },

    /**
     * Change password.
     */
    changePassword: async (currentPassword, newPassword) => {
      const { accessToken } = get();
      set({ authLoading: true, authError: null });

      try {
        await apiFetch(
          API_ENDPOINTS.USER.CHANGE_PASSWORD,
          { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) },
          accessToken
        );
        set({ authLoading: false });
        return { success: true };
      } catch (err) {
        set({ authError: err.message, authLoading: false });
        return { success: false, error: err.message };
      }
    },

    /**
     * Request a password reset email.
     */
    requestPasswordReset: async (email) => {
      set({ authLoading: true, authError: null });

      try {
        await apiFetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
          method: 'POST',
          body:   JSON.stringify({ email }),
        });
        set({ authLoading: false });
        return { success: true };
      } catch (err) {
        set({ authError: err.message, authLoading: false });
        return { success: false, error: err.message };
      }
    },

    /**
     * Complete a password reset with a token.
     */
    resetPassword: async (token, newPassword) => {
      set({ authLoading: true, authError: null });

      try {
        await apiFetch(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
          method: 'POST',
          body:   JSON.stringify({ token, newPassword }),
        });
        set({ authLoading: false });
        return { success: true };
      } catch (err) {
        set({ authError: err.message, authLoading: false });
        return { success: false, error: err.message };
      }
    },

    /**
     * Refresh the access token using the refresh token (stored in httpOnly cookie).
     */
    refreshAccessToken: async () => {
      try {
        const data = await apiFetch(API_ENDPOINTS.AUTH.REFRESH, { method: 'POST' });
        const { accessToken } = data;

        if (accessToken) {
          persistAuth(get().user, accessToken);
          set({ accessToken, isAuthenticated: true });
        }

        return { success: true };
      } catch {
        // Refresh failed — log out
        get().logout();
        return { success: false };
      }
    },

    /**
     * Verify the stored token is still valid.
     * Called on app mount and by useRequireAuth.
     */
    verifyToken: async () => {
      const { accessToken } = get();
      if (!accessToken) return;

      try {
        const data = await apiFetch(
          API_ENDPOINTS.USER.PROFILE,
          { method: 'GET' },
          accessToken
        );

        if (data.user) {
          persistAuth(data.user, accessToken);
          set({ user: data.user, isAuthenticated: true });
        }
      } catch (err) {
        // Token invalid — clear auth
        if (err.message?.includes('401') || err.message?.includes('403')) {
          clearStoredAuth();
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      }
    },

    /**
     * Clear the auth error.
     */
    clearAuthError: () => set({ authError: null }),
  };
};

export default createAuthSlice;