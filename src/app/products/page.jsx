/**
 * src/app/products/page.jsx
 * The /products route — full tea catalog.
 * Server Component wrapper; ProductCatalog is a Client Component.
 */

'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense }        from 'react';
import { Leaf }            from 'lucide-react';
import { ProductGrid }     from '@/components/products/ProductGrid';
import { useProducts, useProductCategories } from '@/lib/hooks/useProducts';

/* ── Metadata (exported from layout or parent server component) ──────────── */
// Note: metadata cannot be exported from a 'use client' file.
// Create a separate layout.jsx in app/products/ if SEO is needed,
// or remove 'use client' and use a server component wrapper pattern.

/* ── Catalog ─────────────────────────────────────────────────────────────── */

function ProductCatalog() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams?.get('category') || null;

  const { products, isLoading, error } = useProducts({
    category: categoryParam,
  });

  const categories = useProductCategories();

  return (
    <div
      style={{
        maxWidth:    'var(--max-width-content)',
        margin:      '0 auto',
        padding:     'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)',
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Leaf size={16} color="var(--color-muted-olive)" />
          <span
            style={{
              fontFamily:    'var(--font-sans)',
              fontSize:      11,
              fontWeight:    700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color:         'var(--color-muted-olive)',
            }}
          >
            Single-origin · Nandi Hills, Kenya
          </span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize:   'var(--font-size-h1)',
            fontWeight: 600,
            color:      'var(--color-earth-brown)',
            margin:     '0 0 12px',
            lineHeight: 1.2,
          }}
        >
          Our Teas
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize:   'var(--font-size-body-large)',
            color:      'var(--color-text-secondary)',
            margin:     0,
            maxWidth:   540,
            lineHeight: 1.6,
          }}
        >
          Every cup comes from the same hills, the same hands.
          Grown at high altitude, processed with care, and priced
          so the people who grew it can live with dignity.
        </p>
      </div>

      {/* Grid */}
      <ProductGrid
        products={products}
        isLoading={isLoading}
        error={error}
        showFilters
        categories={categories}
      />
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding:    'calc(72px + var(--spacing-2xl)) var(--spacing-lg)',
            maxWidth:   'var(--max-width-content)',
            margin:     '0 auto',
          }}
        >
          <div
            style={{
              height:          32,
              width:           200,
              backgroundColor: 'var(--color-mist-gray)',
              borderRadius:    'var(--radius-md)',
              marginBottom:    'var(--spacing-xl)',
              animation:       'shimmer 1.5s infinite',
            }}
          />
        </div>
      }
    >
      <ProductCatalog />
    </Suspense>
  );
}