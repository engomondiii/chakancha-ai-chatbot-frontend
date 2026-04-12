/**
 * Analytics Utilities
 * Track user events, page views, and conversions
 */

/**
 * Initialize analytics (Google Analytics, Mixpanel, etc.)
 */
export function initAnalytics() {
  if (typeof window === 'undefined') return;
  
  // Google Analytics
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (gaId && window.gtag) {
    console.log('Analytics initialized:', gaId);
  }
  
  // Mixpanel
  const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (mixpanelToken && window.mixpanel) {
    console.log('Mixpanel initialized');
  }
}

/**
 * Track page view
 * @param {string} url - Page URL
 * @param {string} title - Page title
 */
export function trackPageView(url, title) {
  if (typeof window === 'undefined') return;
  
  // Google Analytics
  if (window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: url,
      page_title: title,
    });
  }
  
  // Mixpanel
  if (window.mixpanel) {
    window.mixpanel.track('Page View', {
      url,
      title,
    });
  }
  
  // Debug log
  if (process.env.NODE_ENV === 'development') {
    console.log('Page View:', { url, title });
  }
}

/**
 * Track custom event
 * @param {string} eventName - Event name
 * @param {object} properties - Event properties
 */
export function trackEvent(eventName, properties = {}) {
  if (typeof window === 'undefined') return;
  
  // Google Analytics
  if (window.gtag) {
    window.gtag('event', eventName, properties);
  }
  
  // Mixpanel
  if (window.mixpanel) {
    window.mixpanel.track(eventName, properties);
  }
  
  // Debug log
  if (process.env.NODE_ENV === 'development') {
    console.log('Event:', eventName, properties);
  }
}

/**
 * Track AI chat interaction
 * @param {string} action - Action type (prompt_sent, response_received, etc.)
 * @param {object} properties - Additional properties
 */
export function trackAIEvent(action, properties = {}) {
  trackEvent('AI Interaction', {
    action,
    ...properties,
  });
}

/**
 * Track product view
 * @param {object} product - Product object
 */
export function trackProductView(product) {
  trackEvent('Product View', {
    product_id: product.id,
    product_name: product.name,
    product_category: product.category,
    price: product.price,
    currency: product.currency || 'USD',
  });
}

/**
 * Track add to cart
 * @param {object} product - Product object
 * @param {number} quantity - Quantity added
 */
export function trackAddToCart(product, quantity = 1) {
  trackEvent('Add to Cart', {
    product_id: product.id,
    product_name: product.name,
    product_category: product.category,
    price: product.price,
    quantity,
    value: product.price * quantity,
    currency: product.currency || 'USD',
  });
}

/**
 * Track remove from cart
 * @param {object} product - Product object
 * @param {number} quantity - Quantity removed
 */
export function trackRemoveFromCart(product, quantity = 1) {
  trackEvent('Remove from Cart', {
    product_id: product.id,
    product_name: product.name,
    quantity,
  });
}

/**
 * Track begin checkout
 * @param {object} cart - Cart object with items and total
 */
export function trackBeginCheckout(cart) {
  trackEvent('Begin Checkout', {
    cart_total: cart.total,
    item_count: cart.items.length,
    currency: cart.currency || 'USD',
  });
}

/**
 * Track purchase
 * @param {object} order - Order object
 */
export function trackPurchase(order) {
  trackEvent('Purchase', {
    transaction_id: order.id,
    value: order.total,
    currency: order.currency || 'USD',
    tax: order.tax,
    shipping: order.shipping,
    items: order.items.map(item => ({
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  });
  
  // Google Analytics e-commerce
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: order.id,
      value: order.total,
      currency: order.currency || 'USD',
      tax: order.tax,
      shipping: order.shipping,
      items: order.items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  }
}

/**
 * Track search
 * @param {string} query - Search query
 * @param {number} resultCount - Number of results
 */
export function trackSearch(query, resultCount = 0) {
  trackEvent('Search', {
    search_term: query,
    result_count: resultCount,
  });
}

/**
 * Track newsletter signup
 * @param {string} email - Email address
 */
export function trackNewsletterSignup(email) {
  trackEvent('Newsletter Signup', {
    email_domain: email.split('@')[1],
  });
}

/**
 * Track Chakan Tree join
 * @param {string} referralCode - Referral code used (if any)
 */
export function trackChakanTreeJoin(referralCode = null) {
  trackEvent('Chakan Tree Join', {
    has_referral: !!referralCode,
    referral_code: referralCode,
  });
}

/**
 * Track social share
 * @param {string} platform - Social platform (facebook, twitter, etc.)
 * @param {string} contentType - Type of content shared
 * @param {string} contentId - ID of content shared
 */
export function trackSocialShare(platform, contentType, contentId) {
  trackEvent('Social Share', {
    platform,
    content_type: contentType,
    content_id: contentId,
  });
}

/**
 * Track user login
 * @param {string} method - Login method (email, google, facebook, etc.)
 */
export function trackLogin(method = 'email') {
  trackEvent('Login', {
    method,
  });
}

/**
 * Track user signup
 * @param {string} method - Signup method
 */
export function trackSignup(method = 'email') {
  trackEvent('Signup', {
    method,
  });
}

/**
 * Track error
 * @param {string} errorType - Type of error
 * @param {string} errorMessage - Error message
 * @param {string} location - Where error occurred
 */
export function trackError(errorType, errorMessage, location = '') {
  trackEvent('Error', {
    error_type: errorType,
    error_message: errorMessage,
    location,
  });
}

/**
 * Track timing (performance)
 * @param {string} category - Timing category
 * @param {string} variable - Timing variable
 * @param {number} value - Time value in milliseconds
 */
export function trackTiming(category, variable, value) {
  if (typeof window === 'undefined') return;
  
  if (window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: variable,
      value: value,
      event_category: category,
    });
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Timing:', category, variable, `${value}ms`);
  }
}

/**
 * Set user properties
 * @param {object} properties - User properties
 */
export function setUserProperties(properties) {
  if (typeof window === 'undefined') return;
  
  // Google Analytics
  if (window.gtag) {
    window.gtag('set', 'user_properties', properties);
  }
  
  // Mixpanel
  if (window.mixpanel) {
    window.mixpanel.people.set(properties);
  }
}

/**
 * Identify user
 * @param {string} userId - User ID
 * @param {object} traits - User traits
 */
export function identifyUser(userId, traits = {}) {
  if (typeof window === 'undefined') return;
  
  // Google Analytics
  if (window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      user_id: userId,
    });
  }
  
  // Mixpanel
  if (window.mixpanel) {
    window.mixpanel.identify(userId);
    window.mixpanel.people.set(traits);
  }
}

/**
 * Reset user identity (on logout)
 */
export function resetUser() {
  if (typeof window === 'undefined') return;
  
  // Mixpanel
  if (window.mixpanel) {
    window.mixpanel.reset();
  }
}

export default {
  initAnalytics,
  trackPageView,
  trackEvent,
  trackAIEvent,
  trackProductView,
  trackAddToCart,
  trackRemoveFromCart,
  trackBeginCheckout,
  trackPurchase,
  trackSearch,
  trackNewsletterSignup,
  trackChakanTreeJoin,
  trackSocialShare,
  trackLogin,
  trackSignup,
  trackError,
  trackTiming,
  setUserProperties,
  identifyUser,
  resetUser,
};