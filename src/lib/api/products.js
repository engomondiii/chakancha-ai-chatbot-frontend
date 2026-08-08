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

import api from "./client";
import { ENDPOINTS } from "./endpoints";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://chakancha.com";

function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Frontend public folder — served by Vercel/Next.js
  if (
    path.startsWith("/images/") ||
    path.startsWith("/icons/") ||
    path.startsWith("/public/")
  ) {
    return `${SITE_BASE}${path}`;
  }
  // Backend media — served by Django/Railway
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function normalizeProduct(raw) {
  if (!raw) return null;

  const normalizedImages = Array.isArray(raw.images)
    ? raw.images
        .map((img) => {
          if (typeof img === "string") {
            return {
              url: resolveImageUrl(img),
              alt_text: "",
              is_primary: false,
              sort_order: 0,
            };
          }

          return {
            ...img,
            url: resolveImageUrl(img?.url || img?.image || null),
            alt_text: img?.alt_text || img?.altText || "",
            is_primary: img?.is_primary === true || img?.isPrimary === true,
            sort_order: img?.sort_order ?? img?.sortOrder ?? 0,
          };
        })
        .filter((img) => img.url)
        .sort((a, b) => {
          if (a.is_primary !== b.is_primary) {
            return a.is_primary ? -1 : 1;
          }

          return a.sort_order - b.sort_order;
        })
    : [];

  const primaryImageRecord =
    normalizedImages.find((img) => img.is_primary) || normalizedImages[0];

  const rawPrimaryImage =
    raw.primary_image ||
    raw.image ||
    raw.thumbnail ||
    primaryImageRecord?.url ||
    null;

  const imageUrl = resolveImageUrl(rawPrimaryImage);

  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,

    price: parseFloat(raw.price) || 0,

    currency: raw.currency || "USD",

    priceDisplay: raw.price_display || raw.priceDisplay || "",

    image: imageUrl,

    primaryImage: imageUrl,

    primary_image: imageUrl,

    // IMPORTANT:
    // Preserve the complete gallery.
    images: normalizedImages,

    category: raw.category || null,

    flavorProfile: raw.flavor_profile || raw.flavorProfile || "",

    flavor_profile: raw.flavor_profile || raw.flavorProfile || "",

    tastingNotes: raw.tasting_notes || raw.tastingNotes || [],

    tasting_notes: raw.tasting_notes || raw.tastingNotes || [],

    caffeineLevel: raw.caffeine_level || raw.caffeineLevel || "medium",

    caffeine_level: raw.caffeine_level || raw.caffeineLevel || "medium",

    origin: raw.origin || "",

    estate: raw.estate || "",

    harvest: raw.harvest || "",

    certification: raw.certification || "",

    weight: raw.weight || "",

    description: raw.description || "",

    brewingTemp: raw.brewing_temp || raw.brewingTemp || "",

    brewing_temp: raw.brewing_temp || raw.brewingTemp || "",

    brewingTime: raw.brewing_time || raw.brewingTime || "",

    brewing_time: raw.brewing_time || raw.brewingTime || "",

    teaAmount: raw.tea_amount || raw.teaAmount || "",

    tea_amount: raw.tea_amount || raw.teaAmount || "",

    resteeps: raw.resteeps ?? 0,

    inStock: raw.in_stock !== undefined ? raw.in_stock : raw.inStock !== false,

    in_stock: raw.in_stock !== undefined ? raw.in_stock : raw.inStock !== false,

    featured: raw.featured || false,

    tags: raw.tags || [],
  };
}

export async function getProducts(options = {}) {
  try {
    const params = {};
    if (options.category) params.category = options.category;
    if (options.limit) params.page_size = options.limit;
    if (options.sortBy)
      params.ordering =
        options.sortOrder === "desc" ? `-${options.sortBy}` : options.sortBy;
    if (options.search) params.search = options.search;
    const data = await api.get(ENDPOINTS.PRODUCTS.LIST, { params });
    const items = data.results || data || [];
    return Array.isArray(items)
      ? items.map(normalizeProduct).filter(Boolean)
      : [];
  } catch (err) {
    console.error("getProducts error:", err);
    return [];
  }
}

export async function getProduct(slug) {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.DETAIL(slug));
    return normalizeProduct(data);
  } catch (err) {
    console.error("getProduct error:", err);
    throw err;
  }
}

export async function getFeaturedProducts(limit = 4) {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.LIST, {
      params: { featured: true, page_size: limit },
    });
    const items = data.results || data || [];
    return Array.isArray(items)
      ? items.map(normalizeProduct).filter(Boolean)
      : [];
  } catch (err) {
    console.error("getFeaturedProducts error:", err);
    return [];
  }
}

export async function searchProducts(query) {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.LIST, {
      params: { search: query },
    });
    const items = data.results || data || [];
    return Array.isArray(items)
      ? items.map(normalizeProduct).filter(Boolean)
      : [];
  } catch (err) {
    console.error("searchProducts error:", err);
    return [];
  }
}

export async function getCategories() {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.CATEGORIES);
    return Array.isArray(data) ? data : data.results || [];
  } catch (err) {
    console.error("getCategories error:", err);
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
