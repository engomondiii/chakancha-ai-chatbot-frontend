/**
 * src/lib/api/products.js — Integration Phase 3
 *
 * What changed from previous version:
 *  - normalizeProduct() now constructs a proper image URL from primary_image
 *    by prepending the API base URL when the value is a relative path
 *  - This fixes the tea photos not showing because backend returns paths like
 *    '/media/products/nandi-gold.jpg' without the domain
 *  - All other logic unchanged
 */

import api from './client';
import { ENDPOINTS } from './endpoints';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── Field normaliser ─────────────────────────────────────────────────────────

/**
 * Resolve an image path to a full URL.
 * Backend may return:
 *   - Full URL:       https://cdn.chakancha.com/products/img.jpg  → use as-is
 *   - Relative path: /media/products/img.jpg                      → prepend API_BASE
 *   - null / ''                                                    → return null
 */
function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Relative path — prepend the backend base URL
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Normalise a raw backend product into the shape expected by all components.
 * Provides both camelCase and snake_case variants for resilience.
 */
export function normalizeProduct(raw) {
  if (!raw) return null;

  // Resolve image URL — try multiple field names the backend may use
  const rawImage = raw.primary_image || raw.image || raw.thumbnail || null;
  const imageUrl = resolveImageUrl(rawImage);

  return {
    // Identity
    id:           raw.id,
    slug:         raw.slug,
    name:         raw.name,

    // Pricing
    price:        parseFloat(raw.price) || 0,

    // Image — resolved to a full URL
    image:        imageUrl,
    primary_image: imageUrl,

    // Category — object or string
    category:     raw.category || null,

    // Tea-specific fields — both naming conventions
    flavorProfile:  raw.flavor_profile  || raw.flavorProfile  || '',
    flavor_profile: raw.flavor_profile  || raw.flavorProfile  || '',
    tastingNotes:   raw.tasting_notes   || raw.tastingNotes   || [],
    tasting_notes:  raw.tasting_notes   || raw.tastingNotes   || [],
    caffeineLevel:  raw.caffeine_level  || raw.caffeineLevel  || 'medium',
    caffeine_level: raw.caffeine_level  || raw.caffeineLevel  || 'medium',
    origin:         raw.origin          || '',
    weight:         raw.weight          || '',
    description:    raw.description     || '',

    // Availability
    inStock:   raw.in_stock !== false && raw.in_stock !== undefined
                 ? (raw.in_stock ?? true)
                 : (raw.inStock ?? true),
    in_stock:  raw.in_stock !== false && raw.in_stock !== undefined
                 ? (raw.in_stock ?? true)
                 : (raw.inStock ?? true),

    // Flags
    featured: raw.featured || false,

    // Gallery images — also resolve URLs
    images: Array.isArray(raw.images)
      ? raw.images.map((img) => ({
          ...img,
          url: resolveImageUrl(img.url || img.image || img),
        }))
      : [],
  };
}

// ─── API functions ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/products/
 * Returns paginated product list.
 */
export async function getProducts(options = {}) {
  try {
    const params = {};
    if (options.category) params.category = options.category;
    if (options.limit)    params.page_size = options.limit;
    if (options.sortBy)   params.ordering = options.sortOrder === 'desc'
      ? `-${options.sortBy}` : options.sortBy;
    if (options.search)   params.search = options.search;

    const data = await api.get(ENDPOINTS.PRODUCTS.LIST, { params });

    const items = data.results || data || [];
    return Array.isArray(items) ? items.map(normalizeProduct).filter(Boolean) : [];
  } catch (err) {
    console.error('getProducts error:', err);
    return [];
  }
}

/**
 * GET /api/v1/products/:slug/
 */
export async function getProduct(slug) {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.DETAIL(slug));
    return normalizeProduct(data);
  } catch (err) {
    console.error('getProduct error:', err);
    throw err;
  }
}

/**
 * GET /api/v1/products/?featured=true
 */
export async function getFeaturedProducts(limit = 4) {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.LIST, {
      params: { featured: true, page_size: limit },
    });
    const items = data.results || data || [];
    return Array.isArray(items) ? items.map(normalizeProduct).filter(Boolean) : [];
  } catch (err) {
    console.error('getFeaturedProducts error:', err);
    return [];
  }
}

/**
 * GET /api/v1/products/?search=query
 */
export async function searchProducts(query) {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.LIST, {
      params: { search: query },
    });
    const items = data.results || data || [];
    return Array.isArray(items) ? items.map(normalizeProduct).filter(Boolean) : [];
  } catch (err) {
    console.error('searchProducts error:', err);
    return [];
  }
}

/**
 * GET /api/v1/products/categories/
 */
export async function getCategories() {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.CATEGORIES);
    return Array.isArray(data) ? data : (data.results || []);
  } catch (err) {
    console.error('getCategories error:', err);
    return [];
  }
}

export default {
  getProducts,
  getProduct,
  getFeaturedProducts,
  searchProducts,
  getCategories,
  normalizeProduct,
};