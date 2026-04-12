/**
 * API Endpoints Constants
 * Centralized API endpoint definitions
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = 'v1';

const createEndpoint = (path) => `${API_BASE_URL}/api/${API_VERSION}${path}`;

export const API_ENDPOINTS = {
  // AI & Chat
  AI: {
    CHAT: createEndpoint('/ai/chat'),
    STREAM: createEndpoint('/ai/stream'),
    CONVERSATION: createEndpoint('/ai/conversations'),
    CONVERSATION_BY_ID: (id) => createEndpoint(`/ai/conversations/${id}`),
  },
  
  // Products
  PRODUCTS: {
    LIST: createEndpoint('/products'),
    DETAIL: (slug) => createEndpoint(`/products/${slug}`),
    CATEGORIES: createEndpoint('/products/categories'),
    SEARCH: createEndpoint('/products/search'),
    FEATURED: createEndpoint('/products/featured'),
    RECOMMENDATIONS: createEndpoint('/products/recommendations'),
  },
  
  // Cart
  CART: {
    GET: createEndpoint('/cart'),
    ADD: createEndpoint('/cart/add'),
    UPDATE: createEndpoint('/cart/update'),
    REMOVE: createEndpoint('/cart/remove'),
    CLEAR: createEndpoint('/cart/clear'),
  },
  
  // Orders
  ORDERS: {
    CREATE: createEndpoint('/orders'),
    LIST: createEndpoint('/orders'),
    DETAIL: (orderId) => createEndpoint(`/orders/${orderId}`),
    CANCEL: (orderId) => createEndpoint(`/orders/${orderId}/cancel`),
    TRACK: (orderId) => createEndpoint(`/orders/${orderId}/track`),
  },
  
  // Checkout
  CHECKOUT: {
    INITIALIZE: createEndpoint('/checkout/initialize'),
    CALCULATE_SHIPPING: createEndpoint('/checkout/shipping'),
    APPLY_COUPON: createEndpoint('/checkout/coupon'),
    PROCESS_PAYMENT: createEndpoint('/checkout/payment'),
  },
  
  // User & Auth
  AUTH: {
    LOGIN: createEndpoint('/auth/login'),
    SIGNUP: createEndpoint('/auth/signup'),
    LOGOUT: createEndpoint('/auth/logout'),
    REFRESH: createEndpoint('/auth/refresh'),
    FORGOT_PASSWORD: createEndpoint('/auth/forgot-password'),
    RESET_PASSWORD: createEndpoint('/auth/reset-password'),
    VERIFY_EMAIL: createEndpoint('/auth/verify-email'),
  },
  
  USER: {
    PROFILE: createEndpoint('/user/profile'),
    UPDATE_PROFILE: createEndpoint('/user/profile/update'),
    CHANGE_PASSWORD: createEndpoint('/user/password/change'),
    PREFERENCES: createEndpoint('/user/preferences'),
  },
  
  // Chakan Tree
  CHAKAN_TREE: {
    INFO: createEndpoint('/chakan-tree'),
    JOIN: createEndpoint('/chakan-tree/join'),
    DASHBOARD: createEndpoint('/chakan-tree/dashboard'),
    REFERRALS: createEndpoint('/chakan-tree/referrals'),
    REWARDS: createEndpoint('/chakan-tree/rewards'),
    IMPACT: createEndpoint('/chakan-tree/impact'),
  },
  
  // Subscriptions
  SUBSCRIPTIONS: {
    LIST: createEndpoint('/subscriptions'),
    CREATE: createEndpoint('/subscriptions/create'),
    DETAIL: (subId) => createEndpoint(`/subscriptions/${subId}`),
    UPDATE: (subId) => createEndpoint(`/subscriptions/${subId}/update`),
    CANCEL: (subId) => createEndpoint(`/subscriptions/${subId}/cancel`),
    PAUSE: (subId) => createEndpoint(`/subscriptions/${subId}/pause`),
    RESUME: (subId) => createEndpoint(`/subscriptions/${subId}/resume`),
  },
  
  // Content
  CONTENT: {
    ORIGIN_STORY: createEndpoint('/content/origin'),
    TEA_PICKERS: createEndpoint('/content/tea-pickers'),
    IMPACT_METRICS: createEndpoint('/content/impact'),
    BREWING_GUIDES: createEndpoint('/content/brewing-guides'),
  },
  
  // Newsletter
  NEWSLETTER: {
    SUBSCRIBE: createEndpoint('/newsletter/subscribe'),
    UNSUBSCRIBE: createEndpoint('/newsletter/unsubscribe'),
  },
  
  // Contact
  CONTACT: {
    SUBMIT: createEndpoint('/contact/submit'),
  },
  
  // Reviews
  REVIEWS: {
    LIST: (productSlug) => createEndpoint(`/reviews/product/${productSlug}`),
    CREATE: createEndpoint('/reviews/create'),
    UPDATE: (reviewId) => createEndpoint(`/reviews/${reviewId}/update`),
    DELETE: (reviewId) => createEndpoint(`/reviews/${reviewId}/delete`),
  },
};

/**
 * Helper function to build query string
 * @param {object} params - Query parameters
 * @returns {string}
 */
export function buildQueryString(params) {
  const query = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => query.append(key, v));
      } else {
        query.append(key, value);
      }
    }
  });
  
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Build full URL with query parameters
 * @param {string} endpoint - Base endpoint
 * @param {object} params - Query parameters
 * @returns {string}
 */
export function buildUrl(endpoint, params = {}) {
  const queryString = buildQueryString(params);
  return `${endpoint}${queryString}`;
}

export default API_ENDPOINTS;