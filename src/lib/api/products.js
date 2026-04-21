/**
 * src/lib/api/products.js — Integration Phase 3
 *
 * What changed from the original:
 *  - getProducts() maps backend response: data.results (paginated) or data.products
 *  - getProduct() maps ProductDetailSerializer shape
 *  - Backend field names respected throughout: flavor_profile, caffeine_level,
 *    tasting_notes (array of {note}), images (array of {url,is_primary}),
 *    brewing_temp, brewing_time, tea_amount, category (nested object)
 *  - normalizeProduct() added — converts backend shape → frontend shape
 *    so ALL components work without field-name changes in JSX
 *  - getFeaturedProducts() hits GET /api/v1/products/featured/?limit=N
 *  - searchProducts() hits GET /api/v1/products/search/?q=
 *  - getCategories() hits GET /api/v1/products/categories/
 *  - getRecommendations() hits POST /api/v1/products/recommendations/
 *  - Mock data updated to use backend field names
 *  - shouldUseMock() logic unchanged
 */

import api, { ApiError } from './client';
import { ENDPOINTS }     from './endpoints';

// ─── Field name normalizer ────────────────────────────────────────────────────
/**
 * Converts the backend product shape into the shape the frontend components expect.
 *
 * Backend (ProductDetailSerializer / ProductListSerializer) → Frontend
 *
 *  flavor_profile    → flavorProfile   (TastingNotes, ProductCard)
 *  caffeine_level    → caffeineLevel   (ProductCard, CAFFEINE_LABELS)
 *  tasting_notes     → tastingNotes    (TastingNotes — array of {note} → array of strings)
 *  brewing_temp      → brewingTemp     (BrewingGuide)
 *  brewing_time      → brewingTime     (BrewingGuide)
 *  tea_amount        → teaAmount       (BrewingGuide)
 *  in_stock          → inStock         (ProductCard, ProductDetail)
 *  images            → images          (ProductGallery — array of {url,is_primary})
 *  primary_image/image → image         (ProductCard, SuggestionCards)
 *  category (object) → category        (kept as object; components read .name and .slug)
 *  category_name     → category.name   (from list serializer flat fields)
 *  category_slug     → category.slug
 *  category_color    → category.color
 */
export function normalizeProduct(raw) {
  if (!raw) return null;

  // Build category object from either nested or flat form
  const category = raw.category && typeof raw.category === 'object'
    ? raw.category
    : {
        name:  raw.category_name  || raw.category  || '',
        slug:  raw.category_slug  || raw.category  || '',
        color: raw.category_color || '#2D5016',
        id:    raw.category_id    || null,
      };

  // tasting_notes: backend returns [{note: "Malt"}, ...] → extract strings
  const tastingNotes = Array.isArray(raw.tasting_notes)
    ? raw.tasting_notes.map((n) => (typeof n === 'object' ? n.note : n))
    : (raw.tastingNotes || []);

  // images: keep the full array; also derive primary_image URL
  const images = Array.isArray(raw.images)
    ? raw.images.map((img) => (typeof img === 'object' ? img.url : img)).filter(Boolean)
    : (raw.images || []);

  const primaryImage =
    raw.primary_image ||
    (Array.isArray(raw.images)
      ? (raw.images.find((i) => i.is_primary)?.url || raw.images[0]?.url || null)
      : raw.image || null);

  return {
    // Core identity
    id:            raw.id           || null,
    name:          raw.name         || '',
    slug:          raw.slug         || '',
    description:   raw.description  || '',
    price:         parseFloat(raw.price) || 0,
    currency:      raw.currency     || 'USD',
    weight:        raw.weight       || '',

    // Category
    category,

    // Images
    image:         primaryImage,
    images,

    // Flavour — both camelCase (frontend) and snake_case aliases
    flavorProfile: raw.flavor_profile  || raw.flavorProfile  || '',
    flavor_profile: raw.flavor_profile || raw.flavorProfile  || '',
    tastingNotes,
    tasting_notes: tastingNotes,

    // Characteristics
    caffeineLevel: raw.caffeine_level  || raw.caffeineLevel  || 'medium',
    caffeine_level: raw.caffeine_level || raw.caffeineLevel  || 'medium',

    // Origin
    origin:        raw.origin        || '',
    estate:        raw.estate        || '',
    harvest:       raw.harvest       || '',
    certification: raw.certification || '',

    // Brewing — both camelCase (legacy) and snake_case
    brewingTemp:   raw.brewing_temp  || raw.brewingTemp  || '',
    brewing_temp:  raw.brewing_temp  || raw.brewingTemp  || '',
    brewingTime:   raw.brewing_time  || raw.brewingTime  || '',
    brewing_time:  raw.brewing_time  || raw.brewingTime  || '',
    teaAmount:     raw.tea_amount    || raw.teaAmount    || '',
    tea_amount:    raw.tea_amount    || raw.teaAmount    || '',
    resteeps:      raw.resteeps      ?? 0,

    // Status
    inStock:       raw.in_stock      ?? raw.inStock      ?? true,
    in_stock:      raw.in_stock      ?? raw.inStock      ?? true,
    featured:      raw.featured      ?? false,

    // Tags
    tags: Array.isArray(raw.tags)
      ? raw.tags.map((t) => (typeof t === 'object' ? t.tag : t))
      : (raw.tags || []),
  };
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
// Uses backend field names so normalizeProduct() processes correctly

const MOCK_PRODUCTS = [
  {
    id:            'p1',
    name:          'Nandi Hills Black Tea',
    slug:          'nandi-hills-black-tea',
    category:      { id: 1, name: 'Black Tea', slug: 'black', color: '#6B5544' },
    price:         18.99,
    currency:      'USD',
    image:         '/images/products/black-tea-1.png',
    images:        [
      { url: '/images/products/black-tea-1.png', is_primary: true,  sort_order: 0 },
      { url: '/images/products/black-tea-2.png', is_primary: false, sort_order: 1 },
    ],
    description:   'A robust, full-bodied black tea with malty notes and a lingering honey finish.',
    flavor_profile:'Malty · Robust · Honey finish',
    tasting_notes: [{ note: 'Malt' }, { note: 'Honey' }, { note: 'Dark chocolate' }, { note: 'Earthy undertone' }],
    caffeine_level:'high',
    origin:        'Nandi Hills, Kenya — 1,900m elevation',
    estate:        'Kapsabet Estate',
    harvest:       'Orthodox pluck — two leaves and a bud',
    brewing_temp:  '95°C (203°F)',
    brewing_time:  '3–5 minutes',
    tea_amount:    '2–3g per 200ml',
    resteeps:      1,
    in_stock:      true,
    featured:      true,
    weight:        '50g',
    certification: 'Food-safe certified · Living wage verified',
    tags:          [{ tag: 'black-tea' }, { tag: 'single-origin' }],
  },
  {
    id:            'p2',
    name:          'Morning Mist Green Tea',
    slug:          'morning-mist-green-tea',
    category:      { id: 2, name: 'Green Tea', slug: 'green', color: '#4A7C2C' },
    price:         16.99,
    currency:      'USD',
    image:         '/images/products/green-tea-1.png',
    images:        [{ url: '/images/products/green-tea-1.png', is_primary: true, sort_order: 0 }],
    description:   'Delicate green tea harvested in the early morning when Nandi Hills is wrapped in mist.',
    flavor_profile:'Vegetal · Sweet · Grassy finish',
    tasting_notes: [{ note: 'Fresh grass' }, { note: 'Sweet pea' }, { note: 'Light floral' }],
    caffeine_level:'medium',
    origin:        'Nandi Hills, Kenya — 2,100m elevation',
    estate:        'Chemase Estate',
    harvest:       'Hand-picked — single bud only',
    brewing_temp:  '75°C (167°F)',
    brewing_time:  '2–3 minutes',
    tea_amount:    '2–3g per 200ml',
    resteeps:      2,
    in_stock:      true,
    featured:      true,
    weight:        '40g',
    certification: 'Food-safe certified · Living wage verified',
    tags:          [{ tag: 'green-tea' }],
  },
  {
    id:            'p3',
    name:          'Purple Peak Tea',
    slug:          'purple-peak-tea',
    category:      { id: 5, name: 'Purple Tea', slug: 'purple', color: '#8B4476' },
    price:         24.99,
    currency:      'USD',
    image:         '/images/products/purple-tea-1.png',
    images:        [{ url: '/images/products/purple-tea-1.png', is_primary: true, sort_order: 0 }],
    description:   'A rare Kenyan purple tea with smooth, floral character and subtle sweetness.',
    flavor_profile:'Floral · Smooth · Subtly sweet',
    tasting_notes: [{ note: 'Hibiscus' }, { note: 'Berry' }, { note: 'Honey' }],
    caffeine_level:'low',
    origin:        'Nandi Hills, Kenya — 2,200m elevation',
    estate:        'Tindiret Estate',
    harvest:       'Orthodox — purple-leaf cultivar TRFK 306/1',
    brewing_temp:  '80°C (176°F)',
    brewing_time:  '3–4 minutes',
    tea_amount:    '2–3g per 200ml',
    resteeps:      2,
    in_stock:      true,
    featured:      true,
    weight:        '40g',
    certification: 'Food-safe certified · Living wage verified',
    tags:          [{ tag: 'purple-tea' }, { tag: 'rare' }],
  },
  {
    id:            'p4',
    name:          'Silver Needle White Tea',
    slug:          'silver-needle-white-tea',
    category:      { id: 3, name: 'White Tea', slug: 'white', color: '#F5F0E8' },
    price:         29.99,
    currency:      'USD',
    image:         '/images/products/white-tea-1.png',
    images:        [{ url: '/images/products/white-tea-1.png', is_primary: true, sort_order: 0 }],
    description:   'Premium white tea made from only the first silver buds of the harvest.',
    flavor_profile:'Delicate · Sweet · Subtle floral',
    tasting_notes: [{ note: 'White peach' }, { note: 'Jasmine' }, { note: 'Melon' }],
    caffeine_level:'low',
    origin:        'Nandi Hills, Kenya — 2,300m elevation',
    estate:        'Kaplenge Estate',
    harvest:       'First buds only — spring harvest',
    brewing_temp:  '70°C (158°F)',
    brewing_time:  '4–5 minutes',
    tea_amount:    '2–3g per 200ml',
    resteeps:      3,
    in_stock:      true,
    featured:      false,
    weight:        '30g',
    certification: 'Food-safe certified · Living wage verified',
    tags:          [{ tag: 'white-tea' }, { tag: 'premium' }],
  },
];

// ─── API functions ─────────────────────────────────────────────────────────────

export async function getProducts(params = {}) {
  try {
    const { category, limit, sortBy = 'name', sortOrder = 'asc', search } = params;

    const queryParams = {};
    if (category)  queryParams.category  = category;
    if (limit)     queryParams.page_size = limit;
    if (search)    queryParams.search    = search;

    // Map frontend sort keys → backend ordering
    const orderingMap = {
      'name:asc':   'name',
      'name:desc':  '-name',
      'price:asc':  'price',
      'price:desc': '-price',
    };
    const ordering = orderingMap[`${sortBy}:${sortOrder}`] || 'name';
    if (ordering) queryParams.ordering = ordering;

    const data = await api.get(ENDPOINTS.PRODUCTS.LIST, { params: queryParams });
    // Backend returns paginated: { count, next, previous, results }
    const raw = data.results || data.products || data;
    return Array.isArray(raw) ? raw.map(normalizeProduct) : [];
  } catch (err) {
    if (shouldUseMock(err)) return applyFilters(MOCK_PRODUCTS.map(normalizeProduct), params);
    throw err;
  }
}

export async function getProduct(slugOrId) {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.DETAIL(slugOrId));
    return normalizeProduct(data.product || data);
  } catch (err) {
    if (shouldUseMock(err)) {
      const found = MOCK_PRODUCTS.find((p) => p.slug === slugOrId || p.id === slugOrId);
      if (!found) throw new ApiError(404, 'Product not found');
      return normalizeProduct(found);
    }
    throw err;
  }
}

export async function getFeaturedProducts(limit = 4) {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.FEATURED, { params: { limit } });
    const raw  = data.products || data.results || data;
    return Array.isArray(raw) ? raw.map(normalizeProduct) : [];
  } catch (err) {
    if (shouldUseMock(err)) {
      return MOCK_PRODUCTS.filter((p) => p.in_stock && p.featured)
        .slice(0, limit)
        .map(normalizeProduct);
    }
    throw err;
  }
}

export async function searchProducts(query) {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.SEARCH, { params: { q: query } });
    const raw  = data.results || data.products || data;
    return Array.isArray(raw) ? raw.map(normalizeProduct) : [];
  } catch (err) {
    if (shouldUseMock(err)) {
      const q = query.toLowerCase();
      return MOCK_PRODUCTS
        .filter((p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.flavor_profile.toLowerCase().includes(q) ||
          p.tasting_notes.some((n) => n.note?.toLowerCase().includes(q))
        )
        .map(normalizeProduct);
    }
    throw err;
  }
}

export async function getRecommendations(context = {}) {
  try {
    const data = await api.post(ENDPOINTS.PRODUCTS.RECOMMENDATIONS, context);
    const raw  = data.products || data;
    return Array.isArray(raw) ? raw.map(normalizeProduct) : [];
  } catch (err) {
    if (shouldUseMock(err)) {
      return MOCK_PRODUCTS.filter((p) => p.in_stock && p.featured)
        .slice(0, 3)
        .map(normalizeProduct);
    }
    throw err;
  }
}

export async function getCategories() {
  try {
    const data = await api.get(ENDPOINTS.PRODUCTS.CATEGORIES);
    return data.results || data.categories || data;
  } catch (err) {
    if (shouldUseMock(err)) {
      return [
        { id: 1, name: 'Black Tea',  slug: 'black',  color: '#6B5544', product_count: 1 },
        { id: 2, name: 'Green Tea',  slug: 'green',  color: '#4A7C2C', product_count: 1 },
        { id: 5, name: 'Purple Tea', slug: 'purple', color: '#8B4476', product_count: 1 },
        { id: 3, name: 'White Tea',  slug: 'white',  color: '#F5F0E8', product_count: 1 },
      ];
    }
    throw err;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function shouldUseMock(err) {
  return (
    process.env.NODE_ENV === 'development' ||
    err?.isNetworkError ||
    err?.status === 404
  );
}

function applyFilters(products, { category, limit, sortBy = 'name', sortOrder = 'asc' }) {
  let result = [...products];
  if (category) result = result.filter((p) => p.category?.slug === category || p.category === category);
  result.sort((a, b) => {
    const av = a[sortBy], bv = b[sortBy];
    if (typeof av === 'string') return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortOrder === 'asc' ? av - bv : bv - av;
  });
  if (limit) result = result.slice(0, limit);
  return result;
}

export { MOCK_PRODUCTS };
export default { getProducts, getProduct, getFeaturedProducts, searchProducts, getRecommendations, getCategories, normalizeProduct };