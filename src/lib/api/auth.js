/**
 * src/lib/api/auth.js
 * Authentication API functions — Integration Phase 1.
 *
 * What changed from the original:
 *  - All functions now use the Axios api client (not raw fetch)
 *    so they benefit from the interceptors (token injection, 401 retry, error normalisation)
 *  - Response shapes updated to match the real backend serializer output:
 *      login/signup → { user: {...}, tokens: { access, refresh } }
 *      profile GET  → { id, email, name, phone, avatar_url, is_verified, ... }
 *      profile PUT  → same as GET (DRF ModelSerializer)
 *      preferences  → { currency, locale, notifications, newsletter }
 *  - changePassword field names corrected:
 *      backend expects: current_password, new_password, confirm_password
 *  - logout now sends the refresh token in the request body (Django SimpleJWT requires it)
 *  - refreshToken reads the refresh from localStorage (not httpOnly cookie)
 *  - verifyEmail / resetPassword field names corrected to match backend serializers
 */

import api from './client';
import { ENDPOINTS } from './endpoints';

// ─── Token helpers ────────────────────────────────────────────────────────────
// Refresh token is stored in localStorage (not httpOnly cookie)
// because the frontend needs to send it in the POST body for Django SimpleJWT.
const REFRESH_KEY = 'chakancha_refresh_token';

export function getStoredRefreshToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function storeRefreshToken(token) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(REFRESH_KEY, token);
}

export function clearRefreshToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(REFRESH_KEY);
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────

/**
 * Login with email + password.
 *
 * Backend response:
 *   { user: { id, email, name, phone, avatar, is_verified, created_at },
 *     tokens: { access, refresh } }
 *
 * Returns the same shape — callers destructure { user, tokens }.
 */
export async function login(email, password) {
  const data = await api.post(ENDPOINTS.AUTH.LOGIN, { email, password });
  // Store refresh token for later silent refreshes
  if (data.tokens?.refresh) {
    storeRefreshToken(data.tokens.refresh);
  }
  return data;
}

/**
 * Register a new account.
 *
 * Backend response:
 *   { user: {...}, tokens: { access, refresh },
 *     message: "Account created. Please verify your email." }
 */
export async function signup(name, email, password) {
  const data = await api.post(ENDPOINTS.AUTH.SIGNUP, { name, email, password });
  if (data.tokens?.refresh) {
    storeRefreshToken(data.tokens.refresh);
  }
  return data;
}

/**
 * Logout — blacklists the refresh token on the backend.
 * Django SimpleJWT requires the refresh token in the POST body.
 */
export async function logout() {
  const refresh = getStoredRefreshToken();
  try {
    if (refresh) {
      await api.post(ENDPOINTS.AUTH.LOGOUT, { refresh });
    }
  } catch {
    // Fire-and-forget — always clear local state
  } finally {
    clearRefreshToken();
  }
}

/**
 * Refresh the access token.
 * Sends the stored refresh token to get a new access token.
 *
 * Backend response: { access: "new_access_token" }
 * (SimpleJWT also returns a new refresh when ROTATE_REFRESH_TOKENS=True)
 */
export async function refreshToken() {
  const refresh = getStoredRefreshToken();
  if (!refresh) throw new Error('No refresh token available');

  const data = await api.post(ENDPOINTS.AUTH.REFRESH, { refresh });

  // Store the new refresh token if rotation is enabled
  if (data.refresh) {
    storeRefreshToken(data.refresh);
  }
  return data; // { access: "...", refresh?: "..." }
}

/**
 * Request a password reset email.
 * Backend always returns 200 regardless of whether email exists
 * (prevents email enumeration).
 */
export async function forgotPassword(email) {
  return api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
}

/**
 * Complete a password reset with the token from the email link.
 *
 * Backend expects: { token, new_password, confirm_password }
 */
export async function resetPassword(token, newPassword) {
  return api.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
    token,
    new_password:     newPassword,
    confirm_password: newPassword,
  });
}

/**
 * Verify email address with the token from the verification email.
 *
 * Backend expects: { token }
 */
export async function verifyEmail(token) {
  return api.post(ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
}

// ─── User/profile endpoints ───────────────────────────────────────────────────

/**
 * Get the current authenticated user's profile.
 *
 * Backend response (UserProfileSerializer):
 *   { id, email, name, phone, avatar_url, is_verified, created_at, updated_at }
 *
 * Note: The backend returns the user object directly (not nested under "user")
 * from ProfileView.get() → UserProfileSerializer(request.user).data
 */
export async function getProfile() {
  return api.get(ENDPOINTS.USER.PROFILE);
}

/**
 * Update the current user's profile.
 *
 * Backend expects (partial=True): { name?, phone?, avatar? }
 * Returns updated UserProfileSerializer data.
 */
export async function updateProfile(updates) {
  return api.put(ENDPOINTS.USER.UPDATE_PROFILE, updates);
}

/**
 * Change the authenticated user's password.
 *
 * Backend expects: { current_password, new_password, confirm_password }
 * Frontend field names are camelCase — we convert here.
 */
export async function changePassword(currentPassword, newPassword) {
  return api.post(ENDPOINTS.USER.CHANGE_PASSWORD, {
    current_password: currentPassword,
    new_password:     newPassword,
    confirm_password: newPassword,
  });
}

/**
 * Get user preferences.
 *
 * Backend response (UserPreferencesSerializer):
 *   { currency, locale, notifications, newsletter, updated_at }
 */
export async function getPreferences() {
  return api.get(ENDPOINTS.USER.PREFERENCES);
}

/**
 * Update user preferences.
 *
 * Backend expects (partial=True): { currency?, locale?, notifications?, newsletter? }
 */
export async function updatePreferences(prefs) {
  return api.put(ENDPOINTS.USER.PREFERENCES, prefs);
}

// ─── Default export ───────────────────────────────────────────────────────────

export default {
  login,
  signup,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getProfile,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences,
  getStoredRefreshToken,
  storeRefreshToken,
  clearRefreshToken,
};