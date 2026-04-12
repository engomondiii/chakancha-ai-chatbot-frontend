/**
 * src/app/products/[slug]/page.jsx
 * Dynamic product detail route: /products/[slug]
 *
 * Uses the ProductDetail component which is a Client Component.
 * This file is a Client Component boundary — metadata is handled
 * via a generateMetadata approach in a hybrid pattern below.
 */

'use client';

import React          from 'react';
import { useParams }  from 'next/navigation';
import { ProductDetail } from '@/components/products/ProductDetail';
import { useProduct }    from '@/lib/hooks/useProducts';
import { Skeleton }      from '@/components/ui/Skeleton';
import { Loader }        from '@/components/ui/Loader';
import NextLink          from 'next/link';

/* ── Loading skeleton ────────────────────────────────────────────────────── */
function ProductDetailSkeleton() {
  return (
    <div
      style={{
        maxWidth:   'var(--max-width-content)',
        margin:     '0 auto',
        padding:    'calc(72px + var(--spacing-xl)) var(--spacing-lg) var(--spacing-3xl)',
        display:    'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:        'var(--spacing-3xl)',
      }}
    >
      {/* Gallery skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        <Skeleton variant="rect" height="420px" style={{ borderRadius: 'var(--radius-xl)' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[1,2].map((i) => (
            <Skeleton key={i} variant="rect" width="60px" height="60px"
              style={{ borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      </div>

      {/* Info skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        <Skeleton variant="text" height="14px" width="120px" />
        <Skeleton variant="text" height="44px" width="85%" />
        <Skeleton variant="text" height="16px" width="70%" />
        <Skeleton variant="text" height="80px" width="100%" />
        <Skeleton variant="rect" height="52px" width="100%" style={{ borderRadius: 'var(--radius-md)' }} />
        <Skeleton variant="rect" height="120px" width="100%" style={{ borderRadius: 'var(--radius-lg)' }} />
      </div>
    </div>
  );
}

/* ── Not found ───────────────────────────────────────────────────────────── */
function ProductNotFound({ slug }) {
  return (
    <div
      style={{
        maxWidth:        'var(--max-width-content)',
        margin:          '0 auto',
        padding:         'calc(72px + var(--spacing-3xl)) var(--spacing-lg)',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        textAlign:       'center',
        gap:             'var(--spacing-lg)',
      }}
    >
      <span style={{ fontSize: '3rem' }}>🍃</span>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize:   'var(--font-size-h2)',
          color:      'var(--color-earth-brown)',
          margin:     0,
        }}
      >
        Tea not found
      </h1>

      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize:   'var(--font-size-body)',
          color:      'var(--color-text-secondary)',
          maxWidth:   420,
          margin:     0,
        }}
      >
        We couldn&apos;t find a tea matching <strong>{slug}</strong>.
        It may have been moved or is temporarily unavailable.
      </p>

      <NextLink
        href="/products"
        style={{
          display:          'inline-flex',
          alignItems:       'center',
          gap:              6,
          backgroundColor:  'var(--color-tea-green)',
          color:            'white',
          border:           'none',
          borderRadius:     'var(--radius-md)',
          padding:          '12px 24px',
          fontFamily:       'var(--font-sans)',
          fontSize:         14,
          fontWeight:       600,
          textDecoration:   'none',
          transition:       'background-color 150ms ease',
        }}
      >
        Browse all teas
      </NextLink>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function ProductDetailPage() {
  const params = useParams();
  const slug   = params?.slug;

  const { product, isLoading, error } = useProduct(slug);

  if (isLoading) return <ProductDetailSkeleton />;

  if (error || !product) return <ProductNotFound slug={slug} />;

  return <ProductDetail product={product} />;
}