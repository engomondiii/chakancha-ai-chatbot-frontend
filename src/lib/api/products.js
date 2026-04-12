/**
 * src/lib/api/products.js
 * Product API functions.
 * Calls the real backend; falls back to rich mock data when the API is
 * unavailable (development / demo mode).
 */

import api, { ApiError } from './client';
import { ENDPOINTS }     from './endpoints';

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_PRODUCTS = [
  {
    id:           'p1',
    name:         'Nandi Hills Black Tea',
    slug:         'nandi-hills-black-tea',
    category:     'black',
    price:        18.99,
    currency:     'USD',
    image:        '/images/products/black-tea-1.jpg',
    images:       ['/images/products/black-tea-1.jpg', '/images/products/black-tea-2.jpg'],
    description:  'A robust, full-bodied black tea with malty notes and a lingering honey finish. Grown at 1,900m elevation on the misty slopes of Nandi Hills, Kenya.',
    flavorProfile:'Malty · Robust · Honey finish',
    tastingNotes: ['Malt', 'Honey', 'Dark chocolate', 'Earthy undertone'],
    caffeineLevel:'high',
    origin:       'Nandi Hills, Kenya — 1,900m elevation',
    estate:       'Kapsabet Estate',
    harvest:      'Orthodox pluck — two leaves and a bud',
    brewingTemp:  '95°C (203°F)',
    brewingTime:  '3–5 minutes',
    teaAmount:    '2–3g per 200ml',
    resteeps:     1,
    inStock:      true,
    featured:     true,
    tags:         ['black-tea', 'single-origin', 'morning', 'milk-tea'],
    weight:       '50g',
    certification:'Food-safe certified · Living wage verified',
  },
  {
    id:           'p2',
    name:         'Morning Mist Green Tea',
    slug:         'morning-mist-green-tea',
    category:     'green',
    price:        16.99,
    currency:     'USD',
    image:        '/images/products/green-tea-1.jpg',
    images:       ['/images/products/green-tea-1.jpg'],
    description:  'Delicate green tea harvested in the early morning when Nandi Hills is wrapped in mist. Vegetal, sweet, and refreshingly clean.',
    flavorProfile:'Vegetal · Sweet · Grassy finish',
    tastingNotes: ['Fresh grass', 'Sweet pea', 'Light floral', 'Clean finish'],
    caffeineLevel:'medium',
    origin:       'Nandi Hills, Kenya — 2,100m elevation',
    estate:       'Chemase Estate',
    harvest:      'Hand-picked — single bud only',
    brewingTemp:  '75°C (167°F)',
    brewingTime:  '2–3 minutes',
    teaAmount:    '2–3g per 200ml',
    resteeps:     2,
    inStock:      true,
    featured:     true,
    tags:         ['green-tea', 'single-origin', 'delicate', 'morning'],
    weight:       '40g',
    certification:'Food-safe certified · Living wage verified',
  },
  {
    id:           'p3',
    name:         'Purple Peak Tea',
    slug:         'purple-peak-tea',
    category:     'purple',
    price:        24.99,
    currency:     'USD',
    image:        '/images/products/purple-tea-1.jpg',
    images:       ['/images/products/purple-tea-1.jpg'],
    description:  'A rare Kenyan purple tea — naturally high in anthocyanins, with a smooth, floral character and a subtle sweetness that lingers.',
    flavorProfile:'Floral · Smooth · Subtly sweet',
    tastingNotes: ['Hibiscus', 'Berry', 'Honey', 'Clean mineral finish'],
    caffeineLevel:'low',
    origin:       'Nandi Hills, Kenya — 2,200m elevation',
    estate:       'Tindiret Estate',
    harvest:      'Orthodox — purple-leaf cultivar TRFK 306/1',
    brewingTemp:  '80°C (176°F)',
    brewingTime:  '3–4 minutes',
    teaAmount:    '2–3g per 200ml',
    resteeps:     2,
    inStock:      true,
    featured:     true,
    tags:         ['purple-tea', 'rare', 'antioxidant', 'floral'],
    weight:       '40g',
    certification:'Food-safe certified · Living wage verified',
  },
  {
    id:           'p4',
    name:         'Silver Needle White Tea',
    slug:         'silver-needle-white-tea',
    category:     'white',
    price:        29.99,
    currency:     'USD',
    image:        '/images/products/white-tea-1.jpg',
    images:       ['/images/products/white-tea-1.jpg'],
    description:  'Premium white tea made from only the first silver buds of the harvest. Extraordinarily delicate, sweet, and aromatic.',
    flavorProfile:'Delicate · Sweet · Subtle floral',
    tastingNotes: ['White peach', 'Jasmine', 'Melon', 'Silky finish'],
    caffeineLevel:'low',
    origin:       'Nandi Hills, Kenya — 2,300m elevation',
    estate:       'Kaplenge Estate',
    harvest:      'First buds only — spring harvest',
    brewingTemp:  '70°C (158°F)',
    brewingTime:  '4–5 minutes',
    teaAmount:    '2–3g per 200ml',
    resteeps:     3,
    inStock:      true,
    featured:     false,
    tags:         ['white-tea', 'premium', 'delicate', 'rare'],
    weight:       '30g',
    certification:'Food-safe certified · Living wage verified',
  },
];

// ─── API functions ─────────────────────────────────────────────────────────────

/**
 * Get a paginated/filtered list of products.
 */
export async function getProducts(params = {}) {
  try {
    const { category, limit, sortBy = 'name', sortOrder = 'asc', search } = params;

    const queryParams = {};
    if (category)  queryParams.category  = category;
    if (limit)     queryParams.limit     = limit;
    if (sortBy)    queryParams.sortBy    = sortBy;
    if (sortOrder) queryParams.sortOrder = sortOrder;
    if (search)    queryParams.q         = search;

    const data = await api.get(ENDPOINTS.PRODUCTS.LIST, { params: queryParams });
    return data.products || data;

  } catch (err) {
    // Fall back to mock data in development or if API unreachable
    if (shouldUseMock(err)) {
      return applyFilters(MOCK_PRODUCTS, params);
    }
    throw err;
  }
}

/**
 * Get a single product by slug or ID.
 */
export async function getProduct(slugOrId) {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.DETAIL(slugOrId));
    return data.product || data;

  } catch (err) {
    if (shouldUseMock(err)) {
      const found = MOCK_PRODUCTS.find(
        (p) => p.slug === slugOrId || p.id === slugOrId
      );
      if (!found) throw new ApiError(404, 'Product not found');
      return found;
    }
    throw err;
  }
}

/**
 * Get featured products.
 */
export async function getFeaturedProducts(limit = 4) {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.FEATURED, { params: { limit } });
    return data.products || data;

  } catch (err) {
    if (shouldUseMock(err)) {
      return MOCK_PRODUCTS.filter((p) => p.featured).slice(0, limit);
    }
    throw err;
  }
}

/**
 * Search products by query string.
 */
export async function searchProducts(query) {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.SEARCH, { params: { q: query } });
    return data.products || data;

  } catch (err) {
    if (shouldUseMock(err)) {
      const q = query.toLowerCase();
      return MOCK_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.flavorProfile.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
      );
    }
    throw err;
  }
}

/**
 * Get AI-powered product recommendations for the current user/session.
 */
export async function getRecommendations(context = {}) {
  try {
    const data = await api.post(ENDPOINTS.PRODUCTS.RECOMMENDATIONS, context);
    return data.products || data;

  } catch (err) {
    if (shouldUseMock(err)) {
      // Return featured products as mock recommendations
      return MOCK_PRODUCTS.filter((p) => p.featured).slice(0, 3);
    }
    throw err;
  }
}

/**
 * Get all product categories.
 */
export async function getCategories() {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.CATEGORIES);
    return data.categories || data;

  } catch (err) {
    if (shouldUseMock(err)) {
      const counts = MOCK_PRODUCTS.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(counts).map(([id, count]) => ({
        id,
        name:  id.charAt(0).toUpperCase() + id.slice(1) + ' Tea',
        slug:  id,
        count,
      }));
    }
    throw err;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function shouldUseMock(err) {
  // Use mock if:
  // 1. We're in development
  // 2. The API is unreachable (network error)
  // 3. The API returns 404 for the endpoint itself
  return (
    process.env.NODE_ENV === 'development' ||
    err?.isNetworkError ||
    err?.status === 404
  );
}

function applyFilters(products, { category, limit, sortBy = 'name', sortOrder = 'asc' }) {
  let result = [...products];

  if (category) {
    result = result.filter((p) => p.category === category);
  }

  result.sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (typeof av === 'string') {
      return sortOrder === 'asc'
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    }
    return sortOrder === 'asc' ? av - bv : bv - av;
  });

  if (limit) result = result.slice(0, limit);

  return result;
}

// Export mock data for use in tests and Storybook
export { MOCK_PRODUCTS };

export default {
  getProducts,
  getProduct,
  getFeaturedProducts,
  searchProducts,
  getRecommendations,
  getCategories,
};