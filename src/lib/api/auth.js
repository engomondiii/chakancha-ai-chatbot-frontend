/**
 * src/lib/api/auth.js
 * Authentication API functions — thin wrappers over the Axios client.
 * The authSlice in the Zustand store calls these directly.
 * Exported here for any component that needs direct API access.
 */

import api from './client';
import { ENDPOINTS } from './endpoints';

/**
 * Sign in with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {{ user, accessToken }}
 */
export async function login(email, password) {
  return api.post(ENDPOINTS.AUTH.LOGIN, { email, password });
}

/**
 * Register a new account.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {{ user, accessToken }}
 */
export async function signup(name, email, password) {
  return api.post(ENDPOINTS.AUTH.SIGNUP, { name, email, password });
}

/**
 * Sign out.
 */
export async function logout() {
  return api.post(ENDPOINTS.AUTH.LOGOUT).catch(() => {}); // Fire-and-forget
}

/**
 * Refresh the access token using the httpOnly refresh cookie.
 * @returns {{ accessToken }}
 */
export async function refreshToken() {
  return api.post(ENDPOINTS.AUTH.REFRESH);
}

/**
 * Request a password reset email.
 * @param {string} email
 */
export async function forgotPassword(email) {
  return api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
}

/**
 * Complete a password reset.
 * @param {string} token       - Reset token from the email link
 * @param {string} newPassword
 */
export async function resetPassword(token, newPassword) {
  return api.post(ENDPOINTS.AUTH.RESET_PASSWORD, { token, newPassword });
}

/**
 * Verify the current user's email address.
 * @param {string} token - Verification token from the email link
 */
export async function verifyEmail(token) {
  return api.post(ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
}

/**
 * Get the current user's profile (also used for token verification).
 * @returns {{ user }}
 */
export async function getProfile() {
  return api.get(ENDPOINTS.USER.PROFILE);
}

/**
 * Update the current user's profile.
 * @param {object} updates - { name, phone, preferences, etc. }
 */
export async function updateProfile(updates) {
  return api.put(ENDPOINTS.USER.UPDATE_PROFILE, updates);
}

/**
 * Change the current user's password.
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export async function changePassword(currentPassword, newPassword) {
  return api.post(ENDPOINTS.USER.CHANGE_PASSWORD, { currentPassword, newPassword });
}

/**
 * Get user preferences.
 */
export async function getPreferences() {
  return api.get(ENDPOINTS.USER.PREFERENCES);
}

/**
 * Update user preferences.
 * @param {object} prefs - { currency, locale, notifications, etc. }
 */
export async function updatePreferences(prefs) {
  return api.put(ENDPOINTS.USER.PREFERENCES, prefs);
}

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
};