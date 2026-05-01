/**
 * src/config/site.js
 * Integration Phase 1 — minor updates only.
 *
 * What changed:
 *  - apiUrl reads NEXT_PUBLIC_API_URL (already correct)
 *  - features.aiChat enabled by default in dev (was env-var gated which broke local dev)
 *  - features.chakanTree enabled by default in dev
 *  - No other changes — site metadata is unchanged
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

  // Feature flags — defaults to true in dev so local development works
  // without needing to set env vars
  features: {
    aiChat:        process.env.NEXT_PUBLIC_ENABLE_AI_CHAT        !== 'false',
    chakanTree:    process.env.NEXT_PUBLIC_ENABLE_CHAKAN_TREE     !== 'false',
    subscriptions: process.env.NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS  === 'true',
    newsletter:    true,
    blog:          false,
    reviews:       true,
    imageGeneration: process.env.NEXT_PUBLIC_ENABLE_IMAGE_GEN    === 'true',
    webSearch:       process.env.NEXT_PUBLIC_ENABLE_WEB_SEARCH   === 'true',
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
    privacyPolicyUrl: '/privacy',
    termsOfServiceUrl: '/terms',
    cookiePolicyUrl:  '/cookies',
    refundPolicyUrl:  '/refund',
  },
};

export default siteConfig;