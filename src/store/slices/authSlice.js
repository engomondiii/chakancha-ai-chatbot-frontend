/**
 * src/store/slices/authSlice.js
 * Zustand auth slice — Integration Phase 1.
 *
 * What changed from the original:
 *  - apiFetch replaced with the real Axios api client (imported lazily
 *    to avoid circular dependency: store → client → store)
 *  - API_ENDPOINTS import replaced with ENDPOINTS from endpoints.js
 *  - Response shapes updated to match real backend:
 *      login/signup → { user, tokens: { access, refresh } }
 *      profile GET  → user object directly (not wrapped in { user: ... })
 *  - accessToken now stores tokens.access (the JWT access token)
 *  - refreshToken stores tokens.refresh separately in localStorage
 *    and sends it in the POST body (Django SimpleJWT requirement)
 *  - verifyToken calls GET /user/profile/ and handles the flat response
 *  - updateProfile handles flat response from DRF ModelSerializer
 *  - changePassword field names corrected to snake_case for backend
 *  - logout sends { refresh } in POST body, clears both tokens
 *  - refreshAccessToken sends { refresh } in POST body, updates both tokens
 *  - refreshToken key 'chakancha_refresh_token' added to localStorage
 */

import { ENDPOINTS } from '@/lib/api/endpoints';

// ─── Storage keys ─────────────────────────────────────────────────────────────
const ACCESS_TOKEN_KEY  = 'chakancha_access_token';
const REFRESH_TOKEN_KEY = 'chakancha_refresh_token';
const USER_STORAGE_KEY  = 'chakancha_user';

// ─── Base URL ─────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_ROOT = `${API_BASE}/api/v1`;

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadStoredAuth() {
  if (typeof window === 'undefined') return { user: null, accessToken: null, refreshToken: null };
  try {
    return {
      accessToken:  window.localStorage.getItem(ACCESS_TOKEN_KEY) || null,
      refreshToken: window.localStorage.getItem(REFRESH_TOKEN_KEY) || null,
      user:         JSON.parse(window.localStorage.getItem(USER_STORAGE_KEY) || 'null'),
    };
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
}

function persistAuth(user, accessToken, refreshToken) {
  if (typeof window === 'undefined') return;
  try {
    if (accessToken)  window.localStorage.setItem(ACCESS_TOKEN_KEY,  accessToken);
    if (refreshToken) window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (user)         window.localStorage.setItem(USER_STORAGE_KEY,  JSON.stringify(user));
  } catch { /* storage quota */ }
}

function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(USER_STORAGE_KEY);
  } catch { /* ignore */ }
}

// ─── API helper ───────────────────────────────────────────────────────────────
// Thin fetch wrapper used only inside this slice.
// Uses the base URL directly to avoid the Axios circular import at slice init time.
// After init, all other slices and hooks use the Axios client normally.

async function authFetch(path, options = {}, token = null) {
  const url = `${API_ROOT}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers, credentials: 'omit' });

  // Try to parse JSON — fall back to empty object on non-JSON responses
  let body = {};
  try { body = await res.json(); } catch { /* empty */ }

  if (!res.ok) {
    // Extract message using the same priority as ApiError in client.js
    const msg =
      body?.detail ||
      body?.error  ||
      body?.message ||
      (body?.errors ? Object.values(body.errors).flat()[0] : null) ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data   = body;
    throw err;
  }

  return body;
}

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createAuthSlice = (set, get) => {
  const stored = loadStoredAuth();

  return {
    // ── State ────────────────────────────────────────────────────────────────
    user:            stored.user,
    isAuthenticated: !!(stored.user && stored.accessToken),
    authLoading:     false,
    authError:       null,
    accessToken:     stored.accessToken,
    refreshToken:    stored.refreshToken,

    // ── Login ─────────────────────────────────────────────────────────────────
    /**
     * POST /auth/login/
     * Backend response: { user: {...}, tokens: { access, refresh } }
     */
    login: async (email, password) => {
      set({ authLoading: true, authError: null });
      try {
        const data = await authFetch(ENDPOINTS.AUTH.LOGIN, {
          method: 'POST',
          body:   JSON.stringify({ email, password }),
        });

        // Backend returns tokens.access + tokens.refresh
        const user         = data.user;
        const accessToken  = data.tokens?.access;
        const refreshToken = data.tokens?.refresh;

        persistAuth(user, accessToken, refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true, authLoading: false });
        return { success: true, user };
      } catch (err) {
        set({ authError: err.message, authLoading: false });
        return { success: false, error: err.message };
      }
    },

    // ── Signup ────────────────────────────────────────────────────────────────
    /**
     * POST /auth/signup/
     * Backend response: { user: {...}, tokens: { access, refresh }, message }
     */
    signup: async (name, email, password) => {
      set({ authLoading: true, authError: null });
      try {
        const data = await authFetch(ENDPOINTS.AUTH.SIGNUP, {
          method: 'POST',
          body:   JSON.stringify({ name, email, password }),
        });

        const user         = data.user;
        const accessToken  = data.tokens?.access;
        const refreshToken = data.tokens?.refresh;

        persistAuth(user, accessToken, refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true, authLoading: false });
        return { success: true, user, message: data.message };
      } catch (err) {
        set({ authError: err.message, authLoading: false });
        return { success: false, error: err.message };
      }
    },

    // ── Logout ────────────────────────────────────────────────────────────────
    /**
     * POST /auth/logout/
     * Django SimpleJWT requires { refresh } in POST body to blacklist the token.
     */
    logout: async () => {
      const { accessToken, refreshToken } = get();
      try {
        if (refreshToken) {
          await authFetch(
            ENDPOINTS.AUTH.LOGOUT,
            { method: 'POST', body: JSON.stringify({ refresh: refreshToken }) },
            accessToken,
          );
        }
      } catch { /* fire-and-forget */ }

      clearStoredAuth();
      set({
        user:            null,
        accessToken:     null,
        refreshToken:    null,
        isAuthenticated: false,
        authError:       null,
      });
    },

    // ── Update profile ────────────────────────────────────────────────────────
    /**
     * PUT /user/profile/
     * Backend returns updated UserProfileSerializer data (flat object, not wrapped).
     */
    updateProfile: async (updates) => {
      const { accessToken } = get();
      set({ authLoading: true, authError: null });
      try {
        // ProfileView returns the flat serializer data, not { user: {...} }
        const updatedUser = await authFetch(
          ENDPOINTS.USER.UPDATE_PROFILE,
          { method: 'PUT', body: JSON.stringify(updates) },
          accessToken,
        );

        const merged = { ...get().user, ...updatedUser };
        persistAuth(merged, accessToken, get().refreshToken);
        set({ user: merged, authLoading: false });
        return { success: true, user: merged };
      } catch (err) {
        set({ authError: err.message, authLoading: false });
        return { success: false, error: err.message };
      }
    },

    // ── Change password ───────────────────────────────────────────────────────
    /**
     * POST /user/password/change/
     * Backend expects snake_case: current_password, new_password, confirm_password
     */
    changePassword: async (currentPassword, newPassword) => {
      const { accessToken } = get();
      set({ authLoading: true, authError: null });
      try {
        await authFetch(
          ENDPOINTS.USER.CHANGE_PASSWORD,
          {
            method: 'POST',
            body:   JSON.stringify({
              current_password: currentPassword,
              new_password:     newPassword,
              confirm_password: newPassword,
            }),
          },
          accessToken,
        );
        set({ authLoading: false });
        return { success: true };
      } catch (err) {
        set({ authError: err.message, authLoading: false });
        return { success: false, error: err.message };
      }
    },

    // ── Request password reset ────────────────────────────────────────────────
    requestPasswordReset: async (email) => {
      set({ authLoading: true, authError: null });
      try {
        await authFetch(ENDPOINTS.AUTH.FORGOT_PASSWORD, {
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

    // ── Reset password ────────────────────────────────────────────────────────
    /**
     * Backend expects: { token, new_password, confirm_password }
     */
    resetPassword: async (token, newPassword) => {
      set({ authLoading: true, authError: null });
      try {
        await authFetch(ENDPOINTS.AUTH.RESET_PASSWORD, {
          method: 'POST',
          body:   JSON.stringify({
            token,
            new_password:     newPassword,
            confirm_password: newPassword,
          }),
        });
        set({ authLoading: false });
        return { success: true };
      } catch (err) {
        set({ authError: err.message, authLoading: false });
        return { success: false, error: err.message };
      }
    },

    // ── Refresh access token ──────────────────────────────────────────────────
    /**
     * POST /auth/refresh/
     * Django SimpleJWT requires { refresh } in POST body.
     * Response: { access: "new_token", refresh?: "rotated_token" }
     */
    refreshAccessToken: async () => {
      const { refreshToken } = get();
      if (!refreshToken) {
        get().logout();
        return { success: false };
      }

      try {
        const data = await authFetch(ENDPOINTS.AUTH.REFRESH, {
          method: 'POST',
          body:   JSON.stringify({ refresh: refreshToken }),
        });

        const newAccessToken  = data.access;
        const newRefreshToken = data.refresh || refreshToken; // rotated or same

        persistAuth(get().user, newAccessToken, newRefreshToken);
        set({
          accessToken:  newAccessToken,
          refreshToken: newRefreshToken,
          isAuthenticated: true,
        });
        return { success: true };
      } catch {
        // Refresh token invalid/expired — force logout
        get().logout();
        return { success: false };
      }
    },

    // ── Verify stored token ───────────────────────────────────────────────────
    /**
     * Called on app mount to validate the stored access token.
     * Hits GET /user/profile/ — returns flat user object from UserProfileSerializer.
     */
    verifyToken: async () => {
      const { accessToken } = get();
      if (!accessToken) return;

      try {
        // ProfileView returns flat object: { id, email, name, ... }
        const user = await authFetch(
          ENDPOINTS.USER.PROFILE,
          { method: 'GET' },
          accessToken,
        );

        // Guard: only update if we got a real user object back
        if (user?.id) {
          persistAuth(user, accessToken, get().refreshToken);
          set({ user, isAuthenticated: true });
        }
      } catch (err) {
        // 401 or 403 — token invalid, clear everything
        if (err.status === 401 || err.status === 403) {
          // Try refresh before giving up
          const refreshResult = await get().refreshAccessToken();
          if (!refreshResult.success) {
            clearStoredAuth();
            set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          }
        }
        // Other errors (network, 5xx) — keep existing auth state, try again later
      }
    },

    // ── Clear error ───────────────────────────────────────────────────────────
    clearAuthError: () => set({ authError: null }),
  };
};

export default createAuthSlice;