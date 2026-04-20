/**
 * src/lib/hooks/useProducts.js — Integration Phase 3
 *
 * What changed from the original:
 *  - getCategories() is async so useProductCategories() now fetches from backend
 *    (GET /api/v1/products/categories/) instead of requiring the static constant
 *  - useProductCategories() returns { categories, isLoading, error } to handle
 *    async fetch, but also supports a synchronous fallback for ProductGrid
 *  - useProducts() and useProduct() call the updated products.js API layer
 *    which normalises all backend fields via normalizeProduct()
 *  - All other hooks unchanged in API surface
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getProducts,
  getProduct,
  getFeaturedProducts,
  searchProducts as apiSearchProducts,
  getCategories as apiGetCategories,
} from '@/lib/api/products';
import { TEA_CATEGORIES } from '@/lib/constants/teaCategories';

// ─── useProducts ──────────────────────────────────────────────────────────────

export function useProducts(options = {}) {
  const {
    category  = null,
    limit     = null,
    sortBy    = 'name',
    sortOrder = 'asc',
    featured  = false,
  } = options;

  const [products,  setProducts]  = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data;
      if (featured) {
        data = await getFeaturedProducts(limit || 4);
      } else {
        data = await getProducts({ category: category || undefined, limit: limit || undefined, sortBy, sortOrder });
      }
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [category, limit, sortBy, sortOrder, featured]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { products, isLoading, error, refetch: fetchData };
}

// ─── useProduct ───────────────────────────────────────────────────────────────

export function useProduct(idOrSlug) {
  const [product,   setProduct]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);

  const fetchData = useCallback(async () => {
    if (!idOrSlug) { setProduct(null); setIsLoading(false); return; }
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

  useEffect(() => { fetchData(); }, [fetchData]);

  return { product, isLoading, error, refetch: fetchData };
}

// ─── useProductSearch ─────────────────────────────────────────────────────────

export function useProductSearch(query, debounceMs = 400) {
  const [results,     setResults]     = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error,       setError]       = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!query?.trim()) { setResults([]); setIsSearching(false); return; }
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
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, debounceMs]);

  return { results, isSearching, error };
}

// ─── useProductCategories ─────────────────────────────────────────────────────

/**
 * Fetches categories from the backend (GET /api/v1/products/categories/).
 * Falls back to the static TEA_CATEGORIES constant if backend is unavailable.
 *
 * Returns the categories array directly (for ProductGrid compatibility)
 * AND exposes { categories, isLoading, error } for async-aware consumers.
 */
export function useProductCategories() {
  const [categories, setCategories] = useState(TEA_CATEGORIES);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    apiGetCategories()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return categories; // returns array directly (backward compat with ProductGrid)
}

// Sub-hook for async-aware consumers
export function useProductCategoriesAsync() {
  const [categories, setCategories] = useState(TEA_CATEGORIES);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    apiGetCategories()
      .then((data) => { if (Array.isArray(data) && data.length > 0) setCategories(data); })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return { categories, isLoading, error };
}

// ─── useFeaturedProducts ──────────────────────────────────────────────────────

export function useFeaturedProducts(limit = 4) {
  return useProducts({ featured: true, limit });
}

// ─── useRelatedProducts ───────────────────────────────────────────────────────

export function useRelatedProducts(category, excludeId, limit = 3) {
  const { products, isLoading, error } = useProducts({ category: category?.slug || category, limit: limit + 1 });
  const filtered = products.filter((p) => p.id !== excludeId).slice(0, limit);
  return { products: filtered, isLoading, error };
}

export default useProducts;