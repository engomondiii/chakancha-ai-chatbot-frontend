/**
 * Features Configuration
 * Feature flags and configuration for conditional features
 */

export const features = {
  // AI Features
  aiChat: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_AI_CHAT === 'true',
    model: 'claude-3-sonnet-20240229',
    maxTokens: 1024,
    temperature: 0.7,
    streamingEnabled: true,
  },
  
  // Chakan Tree
  chakanTree: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_CHAKAN_TREE === 'true',
    layers: 3,
    referralRewardPercentage: 5, // 5% of referral purchases
    minimumPurchaseForInvite: 50, // USD
  },
  
  // E-commerce
  commerce: {
    subscriptionsEnabled: process.env.NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS === 'true',
    giftCardsEnabled: false,
    wishlistEnabled: true,
    reviewsEnabled: true,
    
    // Cart
    cartSessionDuration: 30, // days
    maxQuantityPerItem: 10,
    
    // Checkout
    guestCheckoutEnabled: true,
    expressChekcoutEnabled: false, // Future: Apple Pay, Google Pay
    
    // Currency
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'KES'],
    
    // Shipping
    freeShippingThreshold: 50, // USD
    shippingEstimateEnabled: true,
  },
  
  // Content
  content: {
    blogEnabled: false, // Future feature
    newsletterEnabled: true,
    customerStoriesEnabled: true,
  },
  
  // Social
  social: {
    socialLoginEnabled: false, // Future: Google, Facebook
    socialSharingEnabled: true,
    referralProgramEnabled: true, // Part of Chakan Tree
  },
  
  // Analytics & Tracking
  analytics: {
    googleAnalyticsEnabled: !!process.env.NEXT_PUBLIC_GA_ID,
    mixpanelEnabled: !!process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
    pixelTrackingEnabled: false, // Future: Facebook Pixel
  },
  
  // Performance
  performance: {
    imageLazyLoadingEnabled: true,
    preloadCriticalAssets: true,
    serviceWorkerEnabled: false, // Future: PWA
  },
  
  // Accessibility
  accessibility: {
    highContrastModeEnabled: false, // Future
    keyboardNavigationOptimized: true,
    screenReaderOptimized: true,
  },
  
  // Internationalization
  i18n: {
    enabled: false, // Future: Multi-language
    defaultLocale: 'en',
    supportedLocales: ['en'],
  },
  
  // Development
  development: {
    debugMode: process.env.NODE_ENV === 'development',
    showPerformanceMetrics: process.env.NODE_ENV === 'development',
    logApiCalls: process.env.NODE_ENV === 'development',
  },
};

/**
 * Check if a feature is enabled
 * @param {string} featurePath - Dot-notation path to feature (e.g., 'aiChat.enabled')
 * @returns {boolean}
 */
export function isFeatureEnabled(featurePath) {
  const keys = featurePath.split('.');
  let current = features;
  
  for (const key of keys) {
    if (current[key] === undefined) return false;
    current = current[key];
  }
  
  return current === true;
}

/**
 * Get feature configuration
 * @param {string} featurePath - Dot-notation path to feature
 * @returns {any}
 */
export function getFeatureConfig(featurePath) {
  const keys = featurePath.split('.');
  let current = features;
  
  for (const key of keys) {
    if (current[key] === undefined) return null;
    current = current[key];
  }
  
  return current;
}

export default features;