/**
 * Tea Categories Constants
 * Tea types, processing methods, and flavor profiles
 */

export const TEA_CATEGORIES = [
  {
    id: 'black',
    name: 'Black Tea',
    slug: 'black',
    description: 'Full-bodied and robust, fully oxidized leaves',
    color: '#6B5544',
    icon: 'Coffee',
  },
  {
    id: 'green',
    name: 'Green Tea',
    slug: 'green',
    description: 'Light and refreshing, minimal oxidation',
    color: '#4A7C2C',
    icon: 'Leaf',
  },
  {
    id: 'oolong',
    name: 'Oolong Tea',
    slug: 'oolong',
    description: 'Complex and aromatic, partially oxidized',
    color: '#D4A574',
    icon: 'Flower',
  },
  {
    id: 'white',
    name: 'White Tea',
    slug: 'white',
    description: 'Delicate and subtle, minimally processed',
    color: '#F5F0E8',
    icon: 'Cloud',
  },
  {
    id: 'blend',
    name: 'Blends',
    slug: 'blend',
    description: 'Carefully crafted combinations',
    color: '#8B8C5A',
    icon: 'Sparkles',
  },
];

export const PROCESSING_METHODS = [
  {
    id: 'orthodox',
    name: 'Orthodox',
    description: 'Traditional hand-rolled method preserving whole leaves',
  },
  {
    id: 'ctc',
    name: 'CTC (Cut, Tear, Curl)',
    description: 'Produces smaller, uniform particles for robust flavor',
  },
];

export const FLAVOR_PROFILES = {
  body: [
    { id: 'light', name: 'Light', description: 'Delicate and subtle' },
    { id: 'medium', name: 'Medium', description: 'Balanced presence' },
    { id: 'full', name: 'Full', description: 'Rich and robust' },
  ],
  
  astringency: [
    { id: 'low', name: 'Low', description: 'Smooth and mellow' },
    { id: 'medium', name: 'Medium', description: 'Pleasant dryness' },
    { id: 'high', name: 'High', description: 'Brisk and invigorating' },
  ],
  
  sweetness: [
    { id: 'none', name: 'None', description: 'Pure tea flavor' },
    { id: 'subtle', name: 'Subtle', description: 'Hint of natural sweetness' },
    { id: 'moderate', name: 'Moderate', description: 'Naturally sweet' },
  ],
  
  notes: [
    'Floral', 'Fruity', 'Nutty', 'Malty', 'Grassy', 'Vegetal',
    'Honey', 'Caramel', 'Chocolate', 'Citrus', 'Berry', 'Earthy',
  ],
};

export const BREWING_GUIDELINES = {
  black: {
    temperature: '95-100°C (203-212°F)',
    steepTime: '3-5 minutes',
    teaAmount: '2-3g per 200ml',
    resteeps: 1-2,
  },
  green: {
    temperature: '70-80°C (158-176°F)',
    steepTime: '2-3 minutes',
    teaAmount: '2-3g per 200ml',
    resteeps: 2-3,
  },
  oolong: {
    temperature: '85-95°C (185-203°F)',
    steepTime: '3-5 minutes',
    teaAmount: '3-5g per 200ml',
    resteeps: 3-5,
  },
  white: {
    temperature: '70-75°C (158-167°F)',
    steepTime: '4-5 minutes',
    teaAmount: '2-3g per 200ml',
    resteeps: 2-3,
  },
};

export const TEA_BENEFITS = {
  antioxidants: 'Rich in polyphenols and catechins',
  energy: 'Natural caffeine for sustained energy',
  focus: 'L-theanine promotes calm alertness',
  digestion: 'Supports digestive health',
  hydration: 'Contributes to daily fluid intake',
  metabolism: 'May support metabolic function',
};

export const CAFFEINE_LEVELS = {
  low: { range: '10-25mg', label: 'Low Caffeine' },
  moderate: { range: '25-40mg', label: 'Moderate Caffeine' },
  high: { range: '40-70mg', label: 'High Caffeine' },
  veryHigh: { range: '70-90mg', label: 'Very High Caffeine' },
};

/**
 * Get category by slug
 * @param {string} slug - Category slug
 * @returns {object|null}
 */
export function getCategoryBySlug(slug) {
  return TEA_CATEGORIES.find(cat => cat.slug === slug) || null;
}

/**
 * Get brewing guidelines by category
 * @param {string} categorySlug - Category slug
 * @returns {object|null}
 */
export function getBrewingGuidelines(categorySlug) {
  return BREWING_GUIDELINES[categorySlug] || null;
}

/**
 * Get all category slugs
 * @returns {string[]}
 */
export function getAllCategorySlugs() {
  return TEA_CATEGORIES.map(cat => cat.slug);
}

export default {
  TEA_CATEGORIES,
  PROCESSING_METHODS,
  FLAVOR_PROFILES,
  BREWING_GUIDELINES,
  TEA_BENEFITS,
  CAFFEINE_LEVELS,
  getCategoryBySlug,
  getBrewingGuidelines,
  getAllCategorySlugs,
};