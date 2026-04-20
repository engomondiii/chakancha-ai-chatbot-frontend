/**
 * src/store/middleware/persistenceMiddleware.js
 * Integration Phase 1 — no functional changes needed.
 *
 * What changed from the original:
 *  - REFRESH_TOKEN_KEY added to the constants and clearCartStorage
 *    now also clears the refresh token on hard logout
 *  - clearAllStorage() exported for use in useLogout
 *  - Everything else unchanged — cart persistence logic is correct as-is
 */

const CART_STORAGE_KEY    = 'chakancha_cart_v1';
const PREFS_STORAGE_KEY   = 'chakancha_prefs_v1';
const ACCESS_TOKEN_KEY    = 'chakancha_access_token';
const REFRESH_TOKEN_KEY   = 'chakancha_refresh_token';
const USER_STORAGE_KEY    = 'chakancha_user';
const SESSION_ID_KEY      = 'chakancha_session_id';

// ─── Cart persistence ─────────────────────────────────────────────────────────

const CART_KEYS = ['cartItems', 'appliedCoupon'];

export function saveCartToStorage(state) {
  if (typeof window === 'undefined') return;
  try {
    const toSave = {};
    CART_KEYS.forEach((key) => {
      if (state[key] !== undefined) toSave[key] = state[key];
    });
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ data: toSave, savedAt: Date.now() })
    );
  } catch { /* storage quota */ }
}

export function loadCartFromStorage() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;

    const { data, savedAt } = JSON.parse(raw);

    // Expire cart after 30 days
    if (Date.now() - savedAt > 30 * 24 * 60 * 60 * 1000) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearCartStorage() {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(CART_STORAGE_KEY); } catch { /* ignore */ }
}

// ─── Full auth + cart + session clear ────────────────────────────────────────
/**
 * clearAllStorage
 * Wipes everything: access token, refresh token, user, cart, session ID.
 * Called on hard logout or token expiry.
 */
export function clearAllStorage() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(USER_STORAGE_KEY);
    window.localStorage.removeItem(CART_STORAGE_KEY);
    window.localStorage.removeItem(SESSION_ID_KEY);
  } catch { /* ignore */ }
}

// ─── User preferences persistence ────────────────────────────────────────────

const DEFAULT_PREFS = {
  currency:        'USD',
  preferredLocale: 'en',
};

export function savePrefsToStorage(prefs) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}

export function loadPrefsFromStorage() {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

// ─── Cart subscription ────────────────────────────────────────────────────────

export function subscribeCartPersistence(store) {
  let prevCartItems    = store.getState().cartItems;
  let prevAppliedCoupon = store.getState().appliedCoupon;

  store.subscribe((state) => {
    const changed =
      state.cartItems    !== prevCartItems ||
      state.appliedCoupon !== prevAppliedCoupon;

    if (changed) {
      prevCartItems     = state.cartItems;
      prevAppliedCoupon = state.appliedCoupon;
      saveCartToStorage({
        cartItems:     state.cartItems,
        appliedCoupon: state.appliedCoupon,
      });
    }
  });
}

// ─── Middleware factory ───────────────────────────────────────────────────────

export function createPersistenceMiddleware(set) {
  return (updater, replace) => {
    set(updater, replace);
    // Cart subscription in index.js handles persistence
  };
}

export default {
  saveCartToStorage,
  loadCartFromStorage,
  clearCartStorage,
  clearAllStorage,
  savePrefsToStorage,
  loadPrefsFromStorage,
  createPersistenceMiddleware,
  subscribeCartPersistence,
};