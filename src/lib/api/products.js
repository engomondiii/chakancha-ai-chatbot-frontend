/**
 * src/lib/api/products.js
 *
 * What changed:
 *  - resolveImageUrl() now handles THREE cases:
 *      1. Full URL (https://...)      → use as-is
 *      2. /images/... paths           → frontend path, prepend NEXT_PUBLIC_SITE_URL
 *         (images stored in Next.js public/ folder, served by Vercel)
 *      3. /media/... paths            → backend path, prepend NEXT_PUBLIC_API_URL
 *         (images uploaded via Django, served by Railway)
 *  - This fixes tea images stored as /images/products/black-tea-1.jpg
 */

import api from './client';
import { ENDPOINTS } from './endpoints';

const API_BASE  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:8000';
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://chakancha.com';

function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Frontend public folder — served by Vercel/Next.js
  if (path.startsWith('/images/') || path.startsWith('/icons/') || path.startsWith('/public/')) {
    return `${SITE_BASE}${path}`;
  }
  // Backend media — served by Django/Railway
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function normalizeProduct(raw) {
  if (!raw) return null;
  const rawImage = raw.primary_image || raw.image || raw.thumbnail || null;
  const imageUrl = resolveImageUrl(rawImage);
  return {
    id:             raw.id,
    slug:           raw.slug,
    name:           raw.name,
    price:          parseFloat(raw.price) || 0,
    image:          imageUrl,
    primary_image:  imageUrl,
    category:       raw.category || null,
    flavorProfile:  raw.flavor_profile  || raw.flavorProfile  || '',
    flavor_profile: raw.flavor_profile  || raw.flavorProfile  || '',
    tastingNotes:   raw.tasting_notes   || raw.tastingNotes   || [],
    tasting_notes:  raw.tasting_notes   || raw.tastingNotes   || [],
    caffeineLevel:  raw.caffeine_level  || raw.caffeineLevel  || 'medium',
    caffeine_level: raw.caffeine_level  || raw.caffeineLevel  || 'medium',
    origin:         raw.origin          || '',
    weight:         raw.weight          || '',
    description:    raw.description     || '',
    inStock:        raw.in_stock !== false ? (raw.in_stock ?? true) : (raw.inStock ?? true),
    in_stock:       raw.in_stock !== false ? (raw.in_stock ?? true) : (raw.inStock ?? true),
    featured:       raw.featured || false,
    images: Array.isArray(raw.images)
      ? raw.images.map((img) => ({ ...img, url: resolveImageUrl(img.url || img.image || img) }))
      : [],
  };
}

export async function getProducts(options = {}) {
  try {
    const params = {};
    if (options.category) params.category = options.category;
    if (options.limit)    params.page_size = options.limit;
    if (options.sortBy)   params.ordering = options.sortOrder === 'desc' ? `-${options.sortBy}` : options.sortBy;
    if (options.search)   params.search = options.search;
    const data = await api.get(ENDPOINTS.PRODUCTS.LIST, { params });
    const items = data.results || data || [];
    return Array.isArray(items) ? items.map(normalizeProduct).filter(Boolean) : [];
  } catch (err) { console.error('getProducts error:', err); return []; }
}

export async function getProduct(slug) {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.DETAIL(slug));
    return normalizeProduct(data);
  } catch (err) { console.error('getProduct error:', err); throw err; }
}

export async function getFeaturedProducts(limit = 4) {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.LIST, { params: { featured: true, page_size: limit } });
    const items = data.results || data || [];
    return Array.isArray(items) ? items.map(normalizeProduct).filter(Boolean) : [];
  } catch (err) { console.error('getFeaturedProducts error:', err); return []; }
}

export async function searchProducts(query) {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.LIST, { params: { search: query } });
    const items = data.results || data || [];
    return Array.isArray(items) ? items.map(normalizeProduct).filter(Boolean) : [];
  } catch (err) { console.error('searchProducts error:', err); return []; }
}

export async function getCategories() {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.CATEGORIES);
    return Array.isArray(data) ? data : (data.results || []);
  } catch (err) { console.error('getCategories error:', err); return []; }
}

export default { getProducts, getProduct, getFeaturedProducts, searchProducts, getCategories, normalizeProduct };