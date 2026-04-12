/**
 * Site Configuration
 * Central configuration for site metadata and settings
 */

export const siteConfig = {
  // Site Info
  name: 'Chakancha Global',
  shortName: 'Chakancha',
  description: 'Premium tea from Nandi Hills, Kenya. AI-powered tea discovery with transparent sourcing and living wages for tea pickers.',
  tagline: 'From the tea fields of Nandi Hills to your cup. Ask anything.',
  
  // URLs
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://chakancha.com',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  
  // Company Info
  company: {
    name: 'Chakancha Global',
    legalName: 'Chakancha Global Ltd.',
    address: {
      street: 'Nandi Hills',
      city: 'Nandi Hills',
      region: 'Rift Valley',
      country: 'Kenya',
      countryCode: 'KE',
    },
    email: 'hello@chakancha.com',
    phone: '+254 700 000 000',
  },
  
  // Social Media
  social: {
    twitter: '@chakancha',
    twitterUrl: 'https://twitter.com/chakancha',
    instagram: '@chakancha',
    instagramUrl: 'https://instagram.com/chakancha',
    facebook: 'chakancha',
    facebookUrl: 'https://facebook.com/chakancha',
    linkedin: 'company/chakancha',
    linkedinUrl: 'https://linkedin.com/company/chakancha',
  },
  
  // SEO
  seo: {
    defaultTitle: 'Chakancha - Premium Tea from Nandi Hills',
    titleTemplate: '%s | Chakancha',
    defaultDescription: 'Discover exceptional tea from Nandi Hills, Kenya. AI-powered tea discovery with transparent sourcing and living wages.',
    keywords: [
      'premium tea',
      'Kenyan tea',
      'Nandi Hills',
      'AI tea discovery',
      'ethical tea',
      'specialty tea',
      'living wage tea',
      'transparent sourcing',
      'black tea',
      'green tea',
    ],
    ogImage: '/images/og/chakancha-og.jpg',
    twitterCard: 'summary_large_image',
  },
  
  // Features
  features: {
    aiChat: process.env.NEXT_PUBLIC_ENABLE_AI_CHAT === 'true',
    chakanTree: process.env.NEXT_PUBLIC_ENABLE_CHAKAN_TREE === 'true',
    subscriptions: process.env.NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS === 'true',
    newsletter: true,
    blog: false, // Future feature
    reviews: true,
  },
  
  // Analytics
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
    mixpanelToken: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
  },
  
  // Locale
  locale: {
    default: 'en',
    supported: ['en'],
    currency: 'USD',
    dateFormat: 'MMM dd, yyyy',
    timeFormat: 'HH:mm',
  },
  
  // Contact
  contact: {
    email: 'hello@chakancha.com',
    supportEmail: 'support@chakancha.com',
    salesEmail: 'sales@chakancha.com',
    phone: '+254 700 000 000',
  },
  
  // Business Hours (Kenya Time - EAT)
  businessHours: {
    timezone: 'Africa/Nairobi',
    days: 'Monday - Friday',
    hours: '9:00 AM - 5:00 PM',
  },
  
  // Legal
  legal: {
    privacyPolicyUrl: '/privacy',
    termsOfServiceUrl: '/terms',
    cookiePolicyUrl: '/cookies',
    refundPolicyUrl: '/refund',
  },
};

export default siteConfig;