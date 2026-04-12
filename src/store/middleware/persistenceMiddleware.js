/**
 * persistenceMiddleware.js
 * Zustand persistence middleware for cart and UI preferences.
 * Uses localStorage with versioned serialisation for safe upgrades.
 */

const CART_STORAGE_KEY = 'chakancha_cart_v1';
const PREFS_STORAGE_KEY = 'chakancha_prefs_v1';

// ─── Cart persistence ─────────────────────────────────────────────────────────

/**
 * Fields from the store that should be persisted for the cart.
 */
const CART_KEYS = [
  'cartItems',
  'appliedCoupon',
];

/**
 * Computed/derived keys regenerated from cartItems — NOT persisted.
 * They are recomputed on store hydration via addToCart/updateQuantity pattern.
 */

/**
 * Save cart state to localStorage.
 * @param {object} state - Full Zustand state
 */
export function saveCartToStorage(state) {
  if (typeof window === 'undefined') return;

  try {
    const toSave = {};
    CART_KEYS.forEach((key) => {
      if (state[key] !== undefined) {
        toSave[key] = state[key];
      }
    });

    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ data: toSave, savedAt: Date.now() })
    );
  } catch {
    // Storage quota exceeded — fail silently
  }
}

/**
 * Load cart state from localStorage.
 * @returns {object|null} - Persisted cart state or null
 */
export function loadCartFromStorage() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;

    const { data, savedAt } = JSON.parse(raw);

    // Expire cart after 30 days
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - savedAt > THIRTY_DAYS_MS) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Clear persisted cart.
 */
export function clearCartStorage() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // Fail silently
  }
}

// ─── User preferences persistence ────────────────────────────────────────────

const DEFAULT_PREFS = {
  currency:        'USD',
  preferredLocale: 'en',
};

export function savePrefsToStorage(prefs) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Fail silently
  }
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

// ─── Zustand middleware factory ───────────────────────────────────────────────

/**
 * createPersistenceMiddleware
 *
 * Wraps a Zustand set function to auto-save cart state to localStorage
 * whenever cart-related keys change.
 *
 * Usage (in store/index.js):
 *   const set = createPersistenceMiddleware(rawSet);
 */
export function createPersistenceMiddleware(set) {
  return (updater, replace) => {
    // Call the original set
    set(updater, replace);

    // After state update, check if cart-related keys changed and persist
    // We use a microtask to batch rapid successive updates
    queueMicrotask(() => {
      try {
        // Access store state via the updater result — in practice
        // we subscribe to the store in index.js instead (see below)
      } catch {
        // Fail silently
      }
    });
  };
}

/**
 * Subscribe to store changes and persist cart whenever it changes.
 * Call this once after the store is created.
 *
 * @param {object} store - Zustand store instance
 */
export function subscribeCartPersistence(store) {
  let previousCartItems    = store.getState().cartItems;
  let previousAppliedCoupon = store.getState().appliedCoupon;

  store.subscribe((state) => {
    const cartChanged =
      state.cartItems    !== previousCartItems ||
      state.appliedCoupon !== previousAppliedCoupon;

    if (cartChanged) {
      previousCartItems     = state.cartItems;
      previousAppliedCoupon = state.appliedCoupon;

      saveCartToStorage({
        cartItems:     state.cartItems,
        appliedCoupon: state.appliedCoupon,
      });
    }
  });
}

export default {
  saveCartToStorage,
  loadCartFromStorage,
  clearCartStorage,
  savePrefsToStorage,
  loadPrefsFromStorage,
  createPersistenceMiddleware,
  subscribeCartPersistence,
};