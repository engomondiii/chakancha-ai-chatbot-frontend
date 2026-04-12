/**
 * Routes Constants
 * Centralized route definitions for type-safe navigation
 */

export const ROUTES = {
  // Public
  HOME: '/',
  
  // Products
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (slug) => `/products/${slug}`,
  PRODUCT_CATEGORY: (category) => `/products?category=${category}`,
  
  // Origin & Story
  ORIGIN: '/origin',
  ORIGIN_TRACEABILITY: '/origin/traceability',
  
  // Impact
  IMPACT: '/impact',
  IMPACT_STORIES: '/impact/stories',
  
  // Chakan Tree
  CHAKAN_TREE: '/chakan-tree',
  CHAKAN_TREE_JOIN: '/chakan-tree/join',
  CHAKAN_TREE_DASHBOARD: '/chakan-tree/dashboard',
  
  // Commerce
  CART: '/cart',
  CHECKOUT: '/checkout',
  CHECKOUT_SUCCESS: '/checkout/success',
  
  // Account
  ACCOUNT: '/account',
  ACCOUNT_ORDERS: '/account/orders',
  ACCOUNT_ORDER_DETAIL: (orderId) => `/account/orders/${orderId}`,
  ACCOUNT_PROFILE: '/account/profile',
  ACCOUNT_SUBSCRIPTIONS: '/account/subscriptions',
  
  // Auth (Future implementation)
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Content
  ABOUT: '/about',
  CONTACT: '/contact',
  
  // Help
  HELP: '/help',
  HELP_FAQ: '/help/faq',
  HELP_SHIPPING: '/help/shipping',
  HELP_RETURNS: '/help/returns',
  HELP_BREWING: '/help/brewing',
  
  // Legal
  PRIVACY: '/privacy',
  TERMS: '/terms',
  COOKIES: '/cookies',
  REFUND: '/refund',
  
  // AI Chat
  CHAT: '/chat',
  CHAT_WITH_QUERY: (query) => `/chat?q=${encodeURIComponent(query)}`,
};

/**
 * Route groups for authorization checks
 */
export const ROUTE_GROUPS = {
  PUBLIC: [
    ROUTES.HOME,
    ROUTES.PRODUCTS,
    ROUTES.ORIGIN,
    ROUTES.ORIGIN_TRACEABILITY,
    ROUTES.IMPACT,
    ROUTES.IMPACT_STORIES,
    ROUTES.CHAKAN_TREE,
    ROUTES.ABOUT,
    ROUTES.CONTACT,
    ROUTES.CHAT,
  ],
  
  PROTECTED: [
    ROUTES.ACCOUNT,
    ROUTES.ACCOUNT_ORDERS,
    ROUTES.ACCOUNT_PROFILE,
    ROUTES.ACCOUNT_SUBSCRIPTIONS,
    ROUTES.CHAKAN_TREE_DASHBOARD,
  ],
  
  COMMERCE: [
    ROUTES.CART,
    ROUTES.CHECKOUT,
    ROUTES.CHECKOUT_SUCCESS,
  ],
  
  AUTH: [
    ROUTES.LOGIN,
    ROUTES.SIGNUP,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.RESET_PASSWORD,
  ],
};

/**
 * Check if a route requires authentication
 * @param {string} pathname - Current pathname
 * @returns {boolean}
 */
export function isProtectedRoute(pathname) {
  return ROUTE_GROUPS.PROTECTED.some(route => pathname.startsWith(route));
}

/**
 * Check if a route is public
 * @param {string} pathname - Current pathname
 * @returns {boolean}
 */
export function isPublicRoute(pathname) {
  return ROUTE_GROUPS.PUBLIC.some(route => pathname.startsWith(route));
}

/**
 * Get route metadata
 * @param {string} pathname - Current pathname
 * @returns {object}
 */
export function getRouteMetadata(pathname) {
  const metadata = {
    requiresAuth: isProtectedRoute(pathname),
    isPublic: isPublicRoute(pathname),
    isCommerce: ROUTE_GROUPS.COMMERCE.some(route => pathname.startsWith(route)),
    isAuth: ROUTE_GROUPS.AUTH.some(route => pathname.startsWith(route)),
  };
  
  return metadata;
}

export default ROUTES;