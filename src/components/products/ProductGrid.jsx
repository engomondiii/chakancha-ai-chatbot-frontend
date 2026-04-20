/**
 * src/components/products/ProductGrid.jsx — Integration Phase 3
 *
 * What changed from the original:
 *  - Category filter: uses cat.slug (not cat.id) as the activeCategory key
 *    because products.js getProducts() sends category=<slug> to the backend
 *  - Category filter button uses cat.slug for comparison
 *  - Product filtering in sorted list uses product.category?.slug correctly
 *  - Everything else unchanged
 */

'use client';

import React, { useState } from 'react';
import { ProductCard }  from './ProductCard';
import { Skeleton }     from '@/components/ui/Skeleton';

const SORT_OPTIONS = [
  { value: 'name:asc',   label: 'Name A–Z' },
  { value: 'price:asc',  label: 'Price: Low to high' },
  { value: 'price:desc', label: 'Price: High to low' },
];

function FilterBar({ categories, activeCategory, onCategory, sortValue, onSort }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
        <button type="button" onClick={() => onCategory(null)} style={pillStyle(activeCategory === null)}>
          All teas
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug || cat.id}
            type="button"
            onClick={() => onCategory(cat.slug || cat.id)}
            style={pillStyle(activeCategory === (cat.slug || cat.id))}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <select value={sortValue} onChange={(e) => onSort(e.target.value)}
        style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-primary)',
          backgroundColor: 'white', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '7px 12px', cursor: 'pointer', outline: 'none' }}
        aria-label="Sort products">
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function pillStyle(active) {
  return {
    backgroundColor: active ? 'var(--color-tea-green)' : 'white',
    color:           active ? 'white' : 'var(--color-text-primary)',
    border:          `1px solid ${active ? 'var(--color-tea-green)' : 'var(--color-border)'}`,
    borderRadius:    'var(--radius-pill)', padding: '6px 16px',
    fontFamily:      'var(--font-sans)', fontSize: 13, fontWeight: active ? 600 : 400,
    cursor: 'pointer', transition: 'background-color 150ms ease, color 150ms ease', whiteSpace: 'nowrap',
  };
}

function SkeletonGrid({ count = 4 }) {
  return (
    <div style={gridStyle}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <Skeleton variant="rect" height="220px" />
          <div style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton variant="text" height="12px" width="50%" />
            <Skeleton variant="text" height="18px" width="80%" />
            <Skeleton variant="text" height="14px" width="65%" />
            <Skeleton variant="text" height="36px" width="100%" />
          </div>
        </div>
      ))}
    </div>
  );
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: 'var(--spacing-lg)',
};

export function ProductGrid({ products = [], isLoading = false, error = null, showFilters = true, categories = [] }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortValue,      setSortValue]      = useState('name:asc');

  if (isLoading) return <SkeletonGrid count={4} />;

  if (error) {
    return (
      <div style={{ padding: 'var(--spacing-2xl)', textAlign: 'center',
        color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 14 }}>
        <p style={{ marginBottom: 8 }}>Could not load products.</p>
        <p style={{ color: 'var(--color-error)', fontSize: 12 }}>{error}</p>
      </div>
    );
  }

  // Filter by category slug
  const filtered = activeCategory
    ? products.filter((p) => {
        const catSlug = p.category?.slug || p.category;
        return catSlug === activeCategory;
      })
    : products;

  // Sort
  const [sortBy, sortOrder] = sortValue.split(':');
  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortBy], bv = b[sortBy];
    if (typeof av === 'string') return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortOrder === 'asc' ? av - bv : bv - av;
  });

  return (
    <div>
      {showFilters && categories.length > 0 && (
        <FilterBar
          categories={categories}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
          sortValue={sortValue}
          onSort={setSortValue}
        />
      )}

      {sorted.length === 0 ? (
        <div style={{ padding: 'var(--spacing-2xl)', textAlign: 'center',
          color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 15 }}>
          No teas found in this category.
        </div>
      ) : (
        <div style={gridStyle}>
          {sorted.map((product, idx) => (
            <ProductCard key={product.id || product.slug} product={product} priority={idx < 2} />
          ))}
        </div>
      )}

      {sorted.length > 0 && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
          color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-lg)', textAlign: 'center' }}>
          Showing {sorted.length} {sorted.length === 1 ? 'tea' : 'teas'}
        </p>
      )}
    </div>
  );
}

export default ProductGrid;