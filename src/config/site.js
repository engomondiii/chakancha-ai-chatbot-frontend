/**
 * src/config/site.js
 *
 * What changed from previous version:
 *  - Feature flag logic made consistent across all flags:
 *      !== 'false'  → defaults ON  (safe default for core features)
 *      === 'true'   → defaults OFF (safe default for cost/optional features)
 *  - search flag added (was missing — Phase 9 unified search)
 *  - subscriptions changed from === 'true' to !== 'false'
 *    so it defaults ON in production (app is fully built)
 *  - webSearch changed from === 'true' to !== 'false'
 *    so it defaults ON in production (Tavily key is set)
 *  - imageGeneration stays === 'true' — defaults OFF (costs $0.04/image)
 *  - blog stays hardcoded false (not built yet)
 */

export const siteConfig = {
  name:        'Chakancha Global',
  shortName:   'Chakancha',
  description: 'Premium tea from Nandi Hills, Kenya. AI-powered tea discovery with transparent sourcing and living wages for tea pickers.',
  tagline:     'From the tea fields of Nandi Hills to your cup. Ask anything.',

  url:    process.env.NEXT_PUBLIC_SITE_URL || 'https://chakancha.com',
  apiUrl: process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:8000',

  company: {
    name:      'Chakancha Global',
    legalName: 'Chakancha Global Ltd.',
    address: {
      street:      'Nandi Hills',
      city:        'Nandi Hills',
      region:      'Rift Valley',
      country:     'Kenya',
      countryCode: 'KE',
    },
    email: 'info@chakancha.com',
    phone: '+254 700 000 000',
  },

  social: {
    twitter:      '@chakancha',
    twitterUrl:   'https://twitter.com/chakancha',
    instagram:    '@chakancha',
    instagramUrl: 'https://instagram.com/chakancha',
    facebook:     'chakancha',
    facebookUrl:  'https://facebook.com/chakancha',
    linkedin:     'company/chakancha',
    linkedinUrl:  'https://linkedin.com/company/chakancha',
  },

  seo: {
    defaultTitle:       'Chakancha - Premium Tea from Nandi Hills',
    titleTemplate:      '%s | Chakancha',
    defaultDescription: 'Discover exceptional tea from Nandi Hills, Kenya. AI-powered tea discovery with transparent sourcing and living wages.',
    keywords: [
      'premium tea', 'Kenyan tea', 'Nandi Hills', 'AI tea discovery',
      'ethical tea', 'specialty tea', 'living wage tea',
      'transparent sourcing', 'black tea', 'green tea',
    ],
    ogImage:      '/images/og/chakancha-og.jpg',
    twitterCard:  'summary_large_image',
  },

  // ── Feature flags ─────────────────────────────────────────────────────────
  //
  // Two patterns used intentionally:
  //
  //   !== 'false'  → feature is ON by default
  //                  turns OFF only when env var is explicitly set to 'false'
  //                  used for: core features that should always be active
  //
  //   === 'true'   → feature is OFF by default
  //                  turns ON only when env var is explicitly set to 'true'
  //                  used for: optional/costly features you consciously enable
  //
  features: {
    // ── Core features — ON by default ──────────────────────────────
    aiChat:        process.env.NEXT_PUBLIC_ENABLE_AI_CHAT        !== 'false',
    chakanTree:    process.env.NEXT_PUBLIC_ENABLE_CHAKAN_TREE     !== 'false',
    subscriptions: process.env.NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS  !== 'false',
    search:        process.env.NEXT_PUBLIC_ENABLE_SEARCH          !== 'false',
    webSearch:     process.env.NEXT_PUBLIC_ENABLE_WEB_SEARCH      !== 'false',
    newsletter:    true,
    reviews:       true,

    // ── Optional/costly features — OFF by default ──────────────────
    // imageGeneration: $0.04 per DALL-E 3 image — enable consciously
    imageGeneration: process.env.NEXT_PUBLIC_ENABLE_IMAGE_GEN    === 'true',
    blog:            false,   // not built yet

    // ── Payment methods — ON when public keys are configured ────────
    // Automatically enabled when the env vars are set (local or Vercel)
    stripePayments:  !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    paypalPayments:  !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  },

  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
    mixpanelToken:     process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
  },

  locale: {
    default:    'en',
    supported:  ['en'],
    currency:   'USD',
    dateFormat: 'MMM dd, yyyy',
    timeFormat: 'HH:mm',
  },

  contact: {
    email:        'info@chakancha.com',
    supportEmail: 'support@chakancha.com',
    salesEmail:   'sales@chakancha.com',
    phone:        '+254 700 000 000',
  },

  businessHours: {
    timezone: 'Africa/Nairobi',
    days:     'Monday - Friday',
    hours:    '9:00 AM - 5:00 PM',
  },

  legal: {
    privacyPolicyUrl:  '/privacy',
    termsOfServiceUrl: '/terms',
    cookiePolicyUrl:   '/cookies',
    refundPolicyUrl:   '/refund',
  },
};

export default siteConfig;