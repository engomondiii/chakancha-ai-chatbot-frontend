/**
 * shippingZones.js
 * Implements the Phase 1 empty stub.
 * Complete global shipping zone definitions for Chakancha Global.
 * DHL International for all zones. Free shipping thresholds in USD.
 */

export const SHIPPING_ZONES = [
  {
    id:             'domestic',
    name:           'Kenya',
    carrier:        'DHL Kenya',
    estimatedDays:  '1–3 business days',
    baseCost:       300,   // KES
    freeThreshold:  5000,  // KES
    currency:       'KES',
    countries: [
      { code: 'KE', name: 'Kenya' },
    ],
  },
  {
    id:             'east_africa',
    name:           'East Africa',
    carrier:        'DHL Express',
    estimatedDays:  '3–5 business days',
    baseCost:       15,    // USD
    freeThreshold:  80,    // USD
    currency:       'USD',
    countries: [
      { code: 'UG', name: 'Uganda' },
      { code: 'TZ', name: 'Tanzania' },
      { code: 'RW', name: 'Rwanda' },
      { code: 'ET', name: 'Ethiopia' },
      { code: 'BI', name: 'Burundi' },
      { code: 'SS', name: 'South Sudan' },
    ],
  },
  {
    id:             'africa',
    name:           'Africa',
    carrier:        'DHL Express',
    estimatedDays:  '5–8 business days',
    baseCost:       22,
    freeThreshold:  120,
    currency:       'USD',
    countries: [
      { code: 'ZA', name: 'South Africa' },
      { code: 'NG', name: 'Nigeria' },
      { code: 'GH', name: 'Ghana' },
      { code: 'EG', name: 'Egypt' },
      { code: 'MA', name: 'Morocco' },
      { code: 'SN', name: 'Senegal' },
      { code: 'CI', name: 'Côte d\'Ivoire' },
      { code: 'CM', name: 'Cameroon' },
      { code: 'ZM', name: 'Zambia' },
      { code: 'ZW', name: 'Zimbabwe' },
    ],
  },
  {
    id:             'europe',
    name:           'Europe',
    carrier:        'DHL Express',
    estimatedDays:  '5–7 business days',
    baseCost:       18,
    freeThreshold:  100,
    currency:       'USD',
    countries: [
      { code: 'GB', name: 'United Kingdom' },
      { code: 'DE', name: 'Germany' },
      { code: 'FR', name: 'France' },
      { code: 'NL', name: 'Netherlands' },
      { code: 'BE', name: 'Belgium' },
      { code: 'SE', name: 'Sweden' },
      { code: 'NO', name: 'Norway' },
      { code: 'DK', name: 'Denmark' },
      { code: 'FI', name: 'Finland' },
      { code: 'IT', name: 'Italy' },
      { code: 'ES', name: 'Spain' },
      { code: 'PT', name: 'Portugal' },
      { code: 'AT', name: 'Austria' },
      { code: 'CH', name: 'Switzerland' },
      { code: 'PL', name: 'Poland' },
      { code: 'IE', name: 'Ireland' },
    ],
  },
  {
    id:             'north_america',
    name:           'North America',
    carrier:        'DHL Express',
    estimatedDays:  '6–9 business days',
    baseCost:       20,
    freeThreshold:  100,
    currency:       'USD',
    countries: [
      { code: 'US', name: 'United States' },
      { code: 'CA', name: 'Canada' },
      { code: 'MX', name: 'Mexico' },
    ],
  },
  {
    id:             'asia_pacific',
    name:           'Asia Pacific',
    carrier:        'DHL Express',
    estimatedDays:  '5–8 business days',
    baseCost:       22,
    freeThreshold:  110,
    currency:       'USD',
    countries: [
      { code: 'JP', name: 'Japan' },
      { code: 'KR', name: 'South Korea' },
      { code: 'CN', name: 'China' },
      { code: 'AU', name: 'Australia' },
      { code: 'NZ', name: 'New Zealand' },
      { code: 'SG', name: 'Singapore' },
      { code: 'HK', name: 'Hong Kong' },
      { code: 'TW', name: 'Taiwan' },
      { code: 'IN', name: 'India' },
      { code: 'TH', name: 'Thailand' },
      { code: 'MY', name: 'Malaysia' },
      { code: 'ID', name: 'Indonesia' },
      { code: 'PH', name: 'Philippines' },
      { code: 'VN', name: 'Vietnam' },
    ],
  },
  {
    id:             'middle_east',
    name:           'Middle East',
    carrier:        'DHL Express',
    estimatedDays:  '5–7 business days',
    baseCost:       20,
    freeThreshold:  110,
    currency:       'USD',
    countries: [
      { code: 'AE', name: 'United Arab Emirates' },
      { code: 'SA', name: 'Saudi Arabia' },
      { code: 'QA', name: 'Qatar' },
      { code: 'KW', name: 'Kuwait' },
      { code: 'BH', name: 'Bahrain' },
      { code: 'OM', name: 'Oman' },
    ],
  },
  {
    id:             'rest_of_world',
    name:           'Rest of World',
    carrier:        'DHL Express',
    estimatedDays:  '7–14 business days',
    baseCost:       28,
    freeThreshold:  150,
    currency:       'USD',
    countries: [
      { code: 'BR', name: 'Brazil' },
      { code: 'AR', name: 'Argentina' },
      { code: 'CL', name: 'Chile' },
      { code: 'CO', name: 'Colombia' },
      { code: 'Other', name: 'Other' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get the shipping zone for a country code.
 * @param {string} countryCode
 * @returns {object|null}
 */
export function getShippingZone(countryCode) {
  return SHIPPING_ZONES.find((zone) =>
    zone.countries.some((c) => c.code === countryCode)
  ) || SHIPPING_ZONES.find((z) => z.id === 'rest_of_world');
}

/**
 * Calculate shipping cost for a given order subtotal and country.
 * Returns 0 if order qualifies for free shipping.
 *
 * @param {number} subtotal     - Order subtotal in USD (or KES for KE)
 * @param {string} countryCode  - ISO country code
 * @returns {number}
 */
export function calculateShippingCost(subtotal, countryCode) {
  const zone = getShippingZone(countryCode);
  if (!zone) return 25;
  if (subtotal >= zone.freeThreshold) return 0;
  return zone.baseCost;
}

/**
 * Get all countries as a flat array sorted by name.
 * @returns {{ code: string, name: string, zoneId: string }[]}
 */
export function getAllCountries() {
  return SHIPPING_ZONES
    .flatMap((z) => z.countries.map((c) => ({ ...c, zoneId: z.id, zoneName: z.name })))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get estimated delivery range for a country.
 * @param {string} countryCode
 * @returns {string}
 */
export function getDeliveryEstimate(countryCode) {
  const zone = getShippingZone(countryCode);
  return zone?.estimatedDays || '7–14 business days';
}

export default SHIPPING_ZONES;