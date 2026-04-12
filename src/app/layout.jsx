/**
 * src/app/layout.jsx
 * Root layout — Phase 2 update.
 *
 * Changes from Phase 1:
 *   1. Added StoreWrapper (client component) that:
 *      - Mounts ToastContainer (global toast notifications)
 *      - Runs useAutoLogin (verifies JWT on app load)
 *      - Reads isCartOpen from store (future CartDrawer hook-in point)
 *   2. No other changes to the Server Component shell.
 *
 * Architecture note:
 *   layout.jsx itself stays a Server Component so metadata exports work.
 *   All Zustand/client logic lives inside <StoreWrapper> which is a
 *   'use client' boundary. This is the recommended Next.js 14 pattern.
 */

import React    from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import StoreWrapper from './StoreWrapper';
import './globals.css';

/* ── Metadata ────────────────────────────────────────────────────────────── */

export const metadata = {
  title: {
    default:  'Chakancha — Premium Tea from Nandi Hills',
    template: '%s | Chakancha',
  },
  description:
    'Discover exceptional tea from Nandi Hills, Kenya. AI-powered tea discovery with transparent sourcing and living wages for tea pickers.',
  keywords: [
    'premium tea', 'Kenyan tea', 'Nandi Hills',
    'AI tea discovery', 'ethical tea', 'specialty tea',
  ],
  authors:   [{ name: 'Chakancha Global' }],
  creator:   'Chakancha Global',
  publisher: 'Chakancha Global',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://chakancha.com'
  ),

  openGraph: {
    type:        'website',
    locale:      'en_US',
    url:         process.env.NEXT_PUBLIC_SITE_URL || 'https://chakancha.com',
    siteName:    'Chakancha',
    title:       'Chakancha — Premium Tea from Nandi Hills',
    description: 'Discover exceptional tea from Nandi Hills, Kenya.',
    images: [{
      url:    '/images/og/chakancha-og.jpg',
      width:  1200,
      height: 630,
      alt:    'Chakancha — Premium Tea from Nandi Hills',
    }],
  },

  twitter: {
    card:        'summary_large_image',
    site:        '@chakancha',
    creator:     '@chakancha',
    title:       'Chakancha — Premium Tea from Nandi Hills',
    description: 'Discover exceptional tea from Nandi Hills, Kenya.',
    images:      ['/images/og/chakancha-og.jpg'],
  },

  manifest: '/manifest.json',
  icons: {
    icon:     '/favicon.ico',
    shortcut: '/favicon.ico',
    apple:    '/apple-touch-icon.png',
  },

  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:  true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
};

/* ── Root layout ─────────────────────────────────────────────────────────── */

/**
 * RootLayout
 *
 * Server Component — safe to export metadata.
 * StoreWrapper handles all client-side Zustand + toast logic.
 *
 * <main> has NO top padding — the hero is full-bleed behind the fixed header.
 * Non-hero pages add padding-top: calc(72px + ...) in their own CSS modules.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>

      <body>
        {/* Accessibility skip link */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/*
          StoreWrapper — 'use client' boundary.
          Provides: ToastContainer, useAutoLogin, future CartDrawer.
          Must wrap Header+main+Footer so all children share the same store.
        */}
        <StoreWrapper>
          {/* Fixed header — floats over every page at z-index 1000 */}
          <Header />

          {/*
            No top padding on main — hero pages are intentionally full-bleed.
            Page-level components add their own top clearance.
          */}
          <main id="main-content">
            {children}
          </main>

          <Footer />
        </StoreWrapper>

        {/* Google Analytics — injected only when GA ID is present */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}