/**
 * src/lib/api/endpoints.js
 * API endpoint definitions for the Phase 2 API layer.
 * Mirrors apiEndpoints.js constants but exports path-only strings
 * so they work with the Axios client (which already knows the base URL).
 */

export const ENDPOINTS = {
  // ── Products ──────────────────────────────────────────────────────────────
  PRODUCTS: {
    LIST:            '/products',
    DETAIL:          (slug)  => `/products/${slug}`,
    CATEGORIES:      '/products/categories',
    SEARCH:          '/products/search',
    FEATURED:        '/products/featured',
    RECOMMENDATIONS: '/products/recommendations',
  },

  // ── Cart ──────────────────────────────────────────────────────────────────
  CART: {
    GET:    '/cart',
    ADD:    '/cart/add',
    UPDATE: '/cart/update',
    REMOVE: '/cart/remove',
    CLEAR:  '/cart/clear',
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  ORDERS: {
    CREATE: '/orders',
    LIST:   '/orders',
    DETAIL: (id) => `/orders/${id}`,
    CANCEL: (id) => `/orders/${id}/cancel`,
    TRACK:  (id) => `/orders/${id}/track`,
  },

  // ── Checkout ──────────────────────────────────────────────────────────────
  CHECKOUT: {
    INITIALIZE:        '/checkout/initialize',
    CALCULATE_SHIPPING:'/checkout/shipping',
    APPLY_COUPON:      '/checkout/coupon',
    PROCESS_PAYMENT:   '/checkout/payment',
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  AUTH: {
    LOGIN:           '/auth/login',
    SIGNUP:          '/auth/signup',
    LOGOUT:          '/auth/logout',
    REFRESH:         '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD:  '/auth/reset-password',
    VERIFY_EMAIL:    '/auth/verify-email',
  },

  // ── User ──────────────────────────────────────────────────────────────────
  USER: {
    PROFILE:         '/user/profile',
    UPDATE_PROFILE:  '/user/profile/update',
    CHANGE_PASSWORD: '/user/password/change',
    PREFERENCES:     '/user/preferences',
  },

  // ── Chakan Tree ───────────────────────────────────────────────────────────
  CHAKAN_TREE: {
    INFO:      '/chakan-tree',
    JOIN:      '/chakan-tree/join',
    DASHBOARD: '/chakan-tree/dashboard',
    REFERRALS: '/chakan-tree/referrals',
    REWARDS:   '/chakan-tree/rewards',
    IMPACT:    '/chakan-tree/impact',
  },

  // ── Subscriptions ─────────────────────────────────────────────────────────
  SUBSCRIPTIONS: {
    LIST:   '/subscriptions',
    CREATE: '/subscriptions/create',
    DETAIL: (id) => `/subscriptions/${id}`,
    UPDATE: (id) => `/subscriptions/${id}/update`,
    CANCEL: (id) => `/subscriptions/${id}/cancel`,
    PAUSE:  (id) => `/subscriptions/${id}/pause`,
    RESUME: (id) => `/subscriptions/${id}/resume`,
  },

  // ── Content ───────────────────────────────────────────────────────────────
  CONTENT: {
    ORIGIN_STORY:   '/content/origin',
    TEA_PICKERS:    '/content/tea-pickers',
    IMPACT_METRICS: '/content/impact',
    BREWING_GUIDES: '/content/brewing-guides',
  },

  // ── Newsletter ────────────────────────────────────────────────────────────
  NEWSLETTER: {
    SUBSCRIBE:   '/newsletter/subscribe',
    UNSUBSCRIBE: '/newsletter/unsubscribe',
  },

  // ── Contact ───────────────────────────────────────────────────────────────
  CONTACT: {
    SUBMIT: '/contact/submit',
  },

  // ── Reviews ───────────────────────────────────────────────────────────────
  REVIEWS: {
    LIST:   (slug)     => `/reviews/product/${slug}`,
    CREATE: '/reviews/create',
    UPDATE: (id)       => `/reviews/${id}/update`,
    DELETE: (id)       => `/reviews/${id}/delete`,
  },
};

export default ENDPOINTS;