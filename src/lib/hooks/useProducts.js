/**
 * useProducts.js
 * Custom hook for product data and single-product fetching.
 * Wired to the products API layer created in Phase 2.
 * The duplicate useCart exports from the Phase 1 stub are removed —
 * import useCart from @/lib/hooks/useCart instead.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getProducts, getProduct, getFeaturedProducts, searchProducts as apiSearchProducts }
  from '@/lib/api/products';

// ─── useProducts ──────────────────────────────────────────────────────────────

/**
 * Fetch a list of products with optional filtering + sorting.
 *
 * @param {object} options
 * @param {string}  options.category  - Filter by category slug
 * @param {number}  options.limit     - Max number to return
 * @param {string}  options.sortBy    - Field to sort by (default: 'name')
 * @param {string}  options.sortOrder - 'asc' | 'desc'
 * @param {boolean} options.featured  - Only return featured products
 *
 * @returns {{ products, isLoading, error, refetch }}
 */
export function useProducts(options = {}) {
  const {
    category   = null,
    limit      = null,
    sortBy     = 'name',
    sortOrder  = 'asc',
    featured   = false,
  } = options;

  const [products,  setProducts]  = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);

  // Stable ref to avoid stale closure in refetch
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let data;

      if (featured) {
        data = await getFeaturedProducts(limit || 4);
      } else {
        data = await getProducts({
          category:  category  || undefined,
          limit:     limit     || undefined,
          sortBy,
          sortOrder,
        });
      }

      setProducts(data);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [category, limit, sortBy, sortOrder, featured]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { products, isLoading, error, refetch: fetchData };
}

// ─── useProduct ───────────────────────────────────────────────────────────────

/**
 * Fetch a single product by ID or slug.
 *
 * @param {string} idOrSlug
 * @returns {{ product, isLoading, error, refetch }}
 */
export function useProduct(idOrSlug) {
  const [product,   setProduct]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);

  const fetchData = useCallback(async () => {
    if (!idOrSlug) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getProduct(idOrSlug);
      setProduct(data);
    } catch (err) {
      setError(err.message || 'Product not found');
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [idOrSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { product, isLoading, error, refetch: fetchData };
}

// ─── useProductSearch ─────────────────────────────────────────────────────────

/**
 * Search products by query string with debouncing.
 *
 * @param {string} query         - Search query
 * @param {number} debounceMs    - Debounce delay (default: 400ms)
 * @returns {{ results, isSearching, error }}
 */
export function useProductSearch(query, debounceMs = 400) {
  const [results,    setResults]    = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error,      setError]      = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!query?.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const data = await apiSearchProducts(query.trim());
        setResults(data);
      } catch (err) {
        setError(err.message || 'Search failed');
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs]);

  return { results, isSearching, error };
}

// ─── useProductCategories ─────────────────────────────────────────────────────

/**
 * Returns the static tea category list from teaCategories.js constants.
 * No API call needed — this data is static.
 */
export function useProductCategories() {
  const { TEA_CATEGORIES } = require('@/lib/constants/teaCategories');
  return TEA_CATEGORIES;
}

// ─── useFeaturedProducts ──────────────────────────────────────────────────────

/**
 * Convenience hook for featured products only.
 *
 * @param {number} limit - Max featured products to return (default: 4)
 */
export function useFeaturedProducts(limit = 4) {
  return useProducts({ featured: true, limit });
}

// ─── useRelatedProducts ───────────────────────────────────────────────────────

/**
 * Get products in the same category, excluding the current product.
 *
 * @param {string} category   - Category slug
 * @param {string} excludeId  - Product ID to exclude
 * @param {number} limit      - Max results (default: 3)
 */
export function useRelatedProducts(category, excludeId, limit = 3) {
  const { products, isLoading, error } = useProducts({ category, limit: limit + 1 });

  const filtered = products.filter((p) => p.id !== excludeId).slice(0, limit);

  return { products: filtered, isLoading, error };
}

export default useProducts;