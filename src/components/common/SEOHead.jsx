import React from 'react';
import Head from 'next/head';

/**
 * SEOHead Component - Meta tags and SEO optimization
 * Handles Open Graph, Twitter Cards, and standard meta tags
 */
export function SEOHead({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonicalUrl,
  noindex = false,
  nofollow = false,
  structuredData,
  children,
}) {
  // Site configuration
  const siteConfig = {
    siteName: 'Chakancha Global',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://chakancha.com',
    twitterHandle: '@chakancha',
    defaultOgImage: '/images/og/chakancha-og.jpg',
  };

  // Build full title
  const fullTitle = title 
    ? `${title} | ${siteConfig.siteName}`
    : `${siteConfig.siteName} - Premium Tea from Nandi Hills`;

  // Build description
  const fullDescription = description || 
    'Discover exceptional tea from Nandi Hills, Kenya. AI-powered tea discovery, transparent sourcing, and living wages for tea pickers. Ask anything about tea.';

  // Build canonical URL
  const canonical = canonicalUrl || siteConfig.siteUrl;

  // Build OG image URL
  const ogImageUrl = ogImage 
    ? (ogImage.startsWith('http') ? ogImage : `${siteConfig.siteUrl}${ogImage}`)
    : `${siteConfig.siteUrl}${siteConfig.defaultOgImage}`;

  // Build robots meta
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
  ].join(', ');

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonical} />

      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

      {/* Theme Color */}
      <meta name="theme-color" content="#2D5016" />

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteConfig.siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || 'Chakancha Global'} />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={siteConfig.twitterHandle} />
      <meta name="twitter:creator" content={siteConfig.twitterHandle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={ogImageUrl} />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}

      {/* Additional custom head elements */}
      {children}
    </Head>
  );
}

/**
 * Generate structured data for different page types
 */
export const structuredDataGenerators = {
  // Organization
  organization: () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Chakancha Global',
    url: 'https://chakancha.com',
    logo: 'https://chakancha.com/images/icons/chakancha-logo.svg',
    description: 'Premium tea from Nandi Hills, Kenya with transparent sourcing and AI-powered discovery.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'Kenya',
      addressRegion: 'Nandi Hills',
    },
    sameAs: [
      'https://twitter.com/chakancha',
      'https://instagram.com/chakancha',
      'https://facebook.com/chakancha',
    ],
  }),

  // Product
  product: (product) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    brand: {
      '@type': 'Brand',
      name: 'Chakancha',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'USD',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://chakancha.com/products/${product.slug}`,
    },
  }),

  // Article/Blog Post
  article: (article) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'Chakancha Global',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Chakancha Global',
      logo: {
        '@type': 'ImageObject',
        url: 'https://chakancha.com/images/icons/chakancha-logo.svg',
      },
    },
  }),

  // FAQ
  faq: (faqs) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }),

  // Breadcrumb
  breadcrumb: (breadcrumbs) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }),
};

/**
 * Preset SEO configurations for common pages
 */
export const seoPresets = {
  home: {
    title: 'Chakancha',
    description: 'Discover exceptional tea from Nandi Hills, Kenya. AI-powered tea discovery with transparent sourcing and living wages.',
    keywords: 'premium tea, Kenyan tea, Nandi Hills, AI tea discovery, ethical tea, specialty tea',
  },
  
  products: {
    title: 'Our Teas',
    description: 'Explore our collection of premium teas from Nandi Hills. Black tea, green tea, and specialty blends.',
    keywords: 'buy tea online, premium tea, Kenyan black tea, specialty tea',
  },
  
  origin: {
    title: 'Our Story - Nandi Hills',
    description: 'From the tea fields of Nandi Hills to your cup. Discover the origin of Chakancha tea.',
    keywords: 'Nandi Hills, tea origin, tea traceability, Kenyan tea',
  },
  
  impact: {
    title: 'Living Wage & Impact',
    description: 'Transparent value chain and living wages for tea pickers. See our impact.',
    keywords: 'living wage, ethical tea, fair trade tea, transparent supply chain',
  },
};