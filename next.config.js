/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  images: {
    remotePatterns: [
      // ── Production backend (Railway) ──────────────────────────────
      // Serves product images and AI-generated images from api.chakancha.com
      {
        protocol: 'https',
        hostname: 'api.chakancha.com',
      },
      // ── Any chakancha.com subdomain ───────────────────────────────
      {
        protocol: 'https',
        hostname: '**.chakancha.com',
      },
      // ── Local development backend ─────────────────────────────────
      // Required so Next.js Image optimisation works against localhost:8000
      {
        protocol: 'http',
        hostname: 'localhost',
        port:     '8000',
      },
      // ── Supabase Storage (kept for future media uploads) ──────────
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      // ── Unsplash (placeholder images during dev) ──────────────────
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // ── OpenAI DALL-E generated images ────────────────────────────
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // ── Experimental features ─────────────────────────────────────────────────
  experimental: {
    optimizeCss: true,
  },

  // ── Environment variables passed to the browser ───────────────────────────
  // NEXT_PUBLIC_* vars are automatically available client-side.
  // Listing them here is optional but makes the config explicit.
  env: {
    NEXT_PUBLIC_API_URL:  process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },

  // ── Security headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key:   'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key:   'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key:   'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key:   'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // ── CORS preflight for API calls from the browser ──────────
          // Allows the frontend at chakancha.com to call api.chakancha.com
          {
            key:   'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_API_URL || 'https://api.chakancha.com',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;