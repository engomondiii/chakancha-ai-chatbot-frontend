/**
 * src/config/features.js
 * Integration Phase 1 — feature flags updated.
 *
 * What changed:
 *  - aiChat.enabled defaults to true in dev (was env-var gated)
 *  - aiChat.model updated to 'claude-sonnet-4-20250514' (actual backend model)
 *  - chakanTree.enabled defaults to true in dev
 *  - commerce.freeShippingThreshold set to 50 USD (matches backend constants)
 *  - Phase 9 features added: imageGeneration, webSearch, unifiedSearch
 *  - No breaking changes to existing feature paths
 */

export const features = {

  // ── AI Features ─────────────────────────────────────────────────────────
  aiChat: {
    // Default true in dev so you don't need env vars to test locally
    enabled:          process.env.NEXT_PUBLIC_ENABLE_AI_CHAT !== 'false',
    // Must match the model in agents/nodes.py MODEL constant
    model:            'claude-sonnet-4-20250514',
    maxTokens:        1024,
    streamingEnabled: true,
    // The frontend streams from the backend — not directly from Anthropic
    // The NEXT_PUBLIC_CLAUDE_API_KEY env var is NOT used (backend handles all AI calls)
  },

  // ── Phase 9: Image Generation ────────────────────────────────────────────
  imageGeneration: {
    enabled:   process.env.NEXT_PUBLIC_ENABLE_IMAGE_GEN === 'true',
    // Backend endpoint: POST /api/v1/ai/generate-image/
    // Cost: ~$0.04 per image via DALL-E 3
  },

  // ── Phase 9: Web Search ──────────────────────────────────────────────────
  webSearch: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_WEB_SEARCH === 'true',
  },

  // ── Phase 9: Unified Search ──────────────────────────────────────────────
  unifiedSearch: {
    // Backend endpoint: POST /api/v1/search/
    // Returns {ai_response, results[], result_count}
    enabled: true, // always available — Phase 9 is live
    modes:   ['search', 'ai', 'both'],
    defaultMode: 'both',
  },

  // ── Chakan Tree ──────────────────────────────────────────────────────────
  chakanTree: {
    enabled:                  process.env.NEXT_PUBLIC_ENABLE_CHAKAN_TREE !== 'false',
    layers:                   3,
    referralRewardPercentage: 5,  // base tier — backend handles 5/7/10%
    minimumPurchaseForInvite: 50, // USD — matches backend invite threshold
    // Invitation shown after this many AI messages
    inviteAfterMessages:      5,  // matches generate_response_node logic
  },

  // ── E-commerce ───────────────────────────────────────────────────────────
  commerce: {
    subscriptionsEnabled:   process.env.NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS === 'true',
    giftCardsEnabled:       false,
    wishlistEnabled:        true,
    reviewsEnabled:         true,

    cartSessionDuration:    30,   // days
    maxQuantityPerItem:     10,   // matches cart/models.py CartItem quantity max

    guestCheckoutEnabled:   true,
    expressCheckoutEnabled: false,

    defaultCurrency:        'USD',
    supportedCurrencies:    ['USD', 'EUR', 'GBP', 'KES'],

    // Must match backend services/shipping_service.py
    freeShippingThreshold:  50,   // USD
    shippingEstimateEnabled: true,

    // Kenya VAT — matches utils/constants.py TAX_RATE
    taxRate:                0.16,
  },

  // ── Content ──────────────────────────────────────────────────────────────
  content: {
    blogEnabled:             false,
    newsletterEnabled:       true,
    customerStoriesEnabled:  true,
  },

  // ── Social ───────────────────────────────────────────────────────────────
  social: {
    socialLoginEnabled:      false,
    socialSharingEnabled:    true,
    referralProgramEnabled:  true,
  },

  // ── Analytics ────────────────────────────────────────────────────────────
  analytics: {
    googleAnalyticsEnabled: !!process.env.NEXT_PUBLIC_GA_ID,
    mixpanelEnabled:        !!process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
    pixelTrackingEnabled:   false,
  },

  // ── Performance ──────────────────────────────────────────────────────────
  performance: {
    imageLazyLoadingEnabled: true,
    preloadCriticalAssets:   true,
    serviceWorkerEnabled:    false,
  },

  // ── Accessibility ─────────────────────────────────────────────────────────
  accessibility: {
    highContrastModeEnabled:        false,
    keyboardNavigationOptimized:    true,
    screenReaderOptimized:          true,
  },

  // ── i18n ─────────────────────────────────────────────────────────────────
  i18n: {
    enabled:          false,
    defaultLocale:    'en',
    supportedLocales: ['en'],
  },

  // ── Development ──────────────────────────────────────────────────────────
  development: {
    debugMode:              process.env.NODE_ENV === 'development',
    showPerformanceMetrics: process.env.NODE_ENV === 'development',
    logApiCalls:            process.env.NODE_ENV === 'development',
  },
};

/**
 * isFeatureEnabled
 * Check if a feature flag is enabled using dot-notation path.
 * @param {string} featurePath  e.g. 'aiChat.enabled', 'commerce.reviewsEnabled'
 * @returns {boolean}
 */
export function isFeatureEnabled(featurePath) {
  const keys    = featurePath.split('.');
  let   current = features;
  for (const key of keys) {
    if (current[key] === undefined) return false;
    current = current[key];
  }
  return current === true;
}

/**
 * getFeatureConfig
 * Get a feature's full config object or a specific value.
 * @param {string} featurePath  e.g. 'aiChat', 'commerce.taxRate'
 * @returns {any}
 */
export function getFeatureConfig(featurePath) {
  const keys    = featurePath.split('.');
  let   current = features;
  for (const key of keys) {
    if (current[key] === undefined) return null;
    current = current[key];
  }
  return current;
}

export default features;