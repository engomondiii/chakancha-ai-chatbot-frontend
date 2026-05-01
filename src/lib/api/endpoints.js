/**
 * src/lib/api/endpoints.js
 * Integration Phase 1 — all backend URLs mapped to constants.
 *
 * What changed from the original:
 *  - Trailing slashes added to every URL to match Django's APPEND_SLASH
 *  - ORDERS.CREATE corrected to '/orders/create/' (was '/orders')
 *  - USER.UPDATE_PROFILE corrected to '/user/profile/' (same endpoint, PUT method)
 *  - USER.CHANGE_PASSWORD corrected to '/user/password/change/'
 *  - CART endpoints corrected to match cart/urls.py path names
 *  - AI endpoints added (chat, stream, generate-image, conversations, feedback)
 *  - SEARCH endpoint added (Phase 9)
 *  - CONTACT endpoint corrected
 *  - All helper functions (slug, id) kept and verified against backend urls.py
 */

export const ENDPOINTS = {

  // ── Auth (/api/v1/auth/) ──────────────────────────────────────────────────
  // Matches accounts/urls.py exactly
  AUTH: {
    LOGIN:           '/auth/login/',
    SIGNUP:          '/auth/signup/',
    LOGOUT:          '/auth/logout/',
    REFRESH:         '/auth/refresh/',
    FORGOT_PASSWORD: '/auth/forgot-password/',
    RESET_PASSWORD:  '/auth/reset-password/',
    VERIFY_EMAIL:    '/auth/verify-email/',
  },

  // ── User (/api/v1/user/) ──────────────────────────────────────────────────
  // Matches accounts/user_urls.py exactly
  USER: {
    PROFILE:         '/user/profile/',
    UPDATE_PROFILE:  '/user/profile/',          // PUT to same endpoint
    CHANGE_PASSWORD: '/user/password/change/',
    PREFERENCES:     '/user/preferences/',
  },

  // ── Products (/api/v1/products/) ──────────────────────────────────────────
  // Matches products/urls.py
  PRODUCTS: {
    LIST:            '/products/',
    DETAIL:          (slug)  => `/products/${slug}/`,
    CATEGORIES:      '/products/categories/',
    SEARCH:          '/products/search/',
    FEATURED:        '/products/featured/',
    RECOMMENDATIONS: '/products/recommendations/',
  },

  // ── Cart (/api/v1/cart/) ──────────────────────────────────────────────────
  // Matches cart/urls.py
  CART: {
    GET:      '/cart/',
    ADD:      '/cart/add/',
    UPDATE:   '/cart/update/',
    REMOVE:   '/cart/remove/',
    CLEAR:    '/cart/clear/',
    VALIDATE: '/cart/validate/',
  },

  // ── Checkout (/api/v1/checkout/) ─────────────────────────────────────────
  // Matches orders/checkout_urls.py
  CHECKOUT: {
    INITIALIZE:         '/checkout/initialize/',
    CALCULATE_SHIPPING: '/checkout/shipping/',
    APPLY_COUPON:       '/checkout/coupon/',
    // Unified payment initialisation endpoint — handles Stripe + PayPal + KG Inicis
    // POST { payment_method, subtotal, currency, order_id }
    // Returns: { client_secret } for Stripe, { approval_url } for PayPal
    PROCESS_PAYMENT:    '/checkout/payment/',
    // Stripe webhook — registered in Stripe Dashboard, not called by frontend
    STRIPE_WEBHOOK:     '/checkout/stripe/webhook/',
  },

  // ── Orders (/api/v1/orders/) ──────────────────────────────────────────────
  // Matches orders/urls.py
  ORDERS: {
    CREATE: '/orders/create/',
    LIST:   '/orders/',
    DETAIL: (id) => `/orders/${id}/`,
    CANCEL: (id) => `/orders/${id}/cancel/`,
    TRACK:  (id) => `/orders/${id}/track/`,
  },

  // ── Subscriptions (/api/v1/subscriptions/) ────────────────────────────────
  // Matches subscriptions/urls.py
  SUBSCRIPTIONS: {
    LIST:   '/subscriptions/',
    CREATE: '/subscriptions/create/',
    DETAIL: (id) => `/subscriptions/${id}/`,
    UPDATE: (id) => `/subscriptions/${id}/update/`,
    CANCEL: (id) => `/subscriptions/${id}/cancel/`,
    PAUSE:  (id) => `/subscriptions/${id}/pause/`,
    RESUME: (id) => `/subscriptions/${id}/resume/`,
  },

  // ── Reviews (/api/v1/reviews/) ────────────────────────────────────────────
  // Matches reviews/urls.py
  REVIEWS: {
    LIST:   (slug) => `/reviews/product/${slug}/`,
    CREATE: '/reviews/create/',
    UPDATE: (id)   => `/reviews/${id}/update/`,
    DELETE: (id)   => `/reviews/${id}/delete/`,
  },

  // ── Content (/api/v1/content/) ────────────────────────────────────────────
  // Matches content/urls.py
  CONTENT: {
    ORIGIN_STORY:   '/content/origin/',
    TEA_PICKERS:    '/content/tea-pickers/',
    IMPACT_METRICS: '/content/impact/',
    BREWING_GUIDES: '/content/brewing-guides/',
  },

  // ── Chakan Tree (/api/v1/chakan-tree/) ────────────────────────────────────
  // Matches chakan_tree/urls.py
  CHAKAN_TREE: {
    INFO:      '/chakan-tree/',
    JOIN:      '/chakan-tree/join/',
    DASHBOARD: '/chakan-tree/dashboard/',
    REFERRALS: '/chakan-tree/referrals/',
    REWARDS:   '/chakan-tree/rewards/',
    IMPACT:    '/chakan-tree/impact/',
  },

  // ── Newsletter (/api/v1/newsletter/) ─────────────────────────────────────
  // Matches newsletter/urls.py
  NEWSLETTER: {
    SUBSCRIBE:   '/newsletter/subscribe/',
    UNSUBSCRIBE: '/newsletter/unsubscribe/',
  },

  // ── AI / Chat (/api/v1/ai/) ───────────────────────────────────────────────
  // Matches chatbot/urls.py
  AI: {
    CHAT:              '/ai/chat/',
    STREAM:            '/ai/stream/',
    GENERATE_IMAGE:    '/ai/generate-image/',
    CONVERSATIONS:     '/ai/conversations/',
    CONVERSATION:      (sessionId) => `/ai/conversations/${sessionId}/`,
    DELETE_CONVERSATION: (sessionId) => `/ai/conversations/${sessionId}/delete/`,
    FEEDBACK:          '/ai/feedback/',
    HEALTH:            '/ai/health/',
  },

  // ── Search (/api/v1/search/) ──────────────────────────────────────────────
  // Phase 9 — matches search/urls.py
  SEARCH: {
    QUERY: '/search/',
  },

  // ── Payments (frontend-facing keys for Stripe.js and PayPal SDK) ──────────
  // These are public keys safe to use in the browser
  PAYMENTS: {
    // Stripe publishable key — used to initialise Stripe.js
    // Value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    // PayPal client ID — used to load PayPal JS SDK
    // Value: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  },

  // ── Contact ───────────────────────────────────────────────────────────────
  CONTACT: {
    SUBMIT: '/contact/submit/',
  },

  // ── Health ────────────────────────────────────────────────────────────────
  HEALTH: '/health/',
};

export default ENDPOINTS;