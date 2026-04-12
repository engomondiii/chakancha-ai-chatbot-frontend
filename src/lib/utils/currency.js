/**
 * Currency Utilities
 * Currency conversion and formatting
 */

/**
 * Currency conversion rates (relative to USD)
 * In production, these should come from an API
 */
export const CURRENCY_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  KES: 129.50,
  JPY: 149.50,
  CAD: 1.36,
  AUD: 1.52,
  CHF: 0.88,
  CNY: 7.24,
};

/**
 * Currency symbols
 */
export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  KES: 'KSh',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
};

/**
 * Currency names
 */
export const CURRENCY_NAMES = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  KES: 'Kenyan Shilling',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan',
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {number}
 */
export function convertCurrency(amount, fromCurrency = 'USD', toCurrency = 'USD') {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = CURRENCY_RATES[fromCurrency] || 1;
  const toRate = CURRENCY_RATES[toCurrency] || 1;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  const convertedAmount = usdAmount * toRate;
  
  return convertedAmount;
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {string} locale - Locale for formatting
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  if (amount === null || amount === undefined) return `${CURRENCY_SYMBOLS[currency]}0.00`;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format currency with symbol only (no decimals if whole number)
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string}
 */
export function formatCurrencyCompact(amount, currency = 'USD') {
  if (amount === null || amount === undefined) return `${CURRENCY_SYMBOLS[currency]}0`;
  
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  
  // If whole number, don't show decimals
  if (amount % 1 === 0) {
    return `${symbol}${amount.toLocaleString()}`;
  }
  
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Parse currency string to number
 * @param {string} currencyString - Currency string (e.g., "$123.45")
 * @returns {number}
 */
export function parseCurrency(currencyString) {
  if (!currencyString) return 0;
  
  // Remove currency symbols and parse
  const cleaned = currencyString.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string}
 */
export function getCurrencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Get currency name
 * @param {string} currency - Currency code
 * @returns {string}
 */
export function getCurrencyName(currency) {
  return CURRENCY_NAMES[currency] || currency;
}

/**
 * Calculate percentage discount
 * @param {number} originalPrice - Original price
 * @param {number} discountedPrice - Discounted price
 * @returns {number}
 */
export function calculateDiscountPercentage(originalPrice, discountedPrice) {
  if (!originalPrice || !discountedPrice) return 0;
  if (originalPrice <= discountedPrice) return 0;
  
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

/**
 * Apply discount to price
 * @param {number} price - Original price
 * @param {number} discountPercentage - Discount percentage
 * @returns {number}
 */
export function applyDiscount(price, discountPercentage) {
  if (!price || !discountPercentage) return price;
  
  const discount = (price * discountPercentage) / 100;
  return price - discount;
}

/**
 * Calculate tax amount
 * @param {number} amount - Amount to calculate tax on
 * @param {number} taxRate - Tax rate percentage
 * @returns {number}
 */
export function calculateTax(amount, taxRate) {
  if (!amount || !taxRate) return 0;
  return (amount * taxRate) / 100;
}

/**
 * Calculate total with tax
 * @param {number} amount - Amount before tax
 * @param {number} taxRate - Tax rate percentage
 * @returns {number}
 */
export function calculateTotalWithTax(amount, taxRate) {
  if (!amount) return 0;
  const tax = calculateTax(amount, taxRate);
  return amount + tax;
}

/**
 * Calculate shipping based on order total
 * @param {number} orderTotal - Order subtotal
 * @param {number} freeShippingThreshold - Minimum for free shipping
 * @param {number} standardShippingCost - Standard shipping cost
 * @returns {number}
 */
export function calculateShipping(
  orderTotal, 
  freeShippingThreshold = 50, 
  standardShippingCost = 5
) {
  if (orderTotal >= freeShippingThreshold) return 0;
  return standardShippingCost;
}

/**
 * Round to nearest cent
 * @param {number} amount - Amount to round
 * @returns {number}
 */
export function roundToCent(amount) {
  return Math.round(amount * 100) / 100;
}

/**
 * Format price range
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @param {string} currency - Currency code
 * @returns {string}
 */
export function formatPriceRange(minPrice, maxPrice, currency = 'USD') {
  if (!minPrice && !maxPrice) return '';
  if (!maxPrice || minPrice === maxPrice) return formatCurrencyCompact(minPrice, currency);
  
  const symbol = CURRENCY_SYMBOLS[currency];
  return `${symbol}${minPrice} - ${symbol}${maxPrice}`;
}

/**
 * Check if amount is valid price
 * @param {number} amount - Amount to check
 * @returns {boolean}
 */
export function isValidPrice(amount) {
  return typeof amount === 'number' && amount >= 0 && isFinite(amount);
}

/**
 * Get supported currencies
 * @returns {string[]}
 */
export function getSupportedCurrencies() {
  return Object.keys(CURRENCY_RATES);
}

/**
 * Check if currency is supported
 * @param {string} currency - Currency code
 * @returns {boolean}
 */
export function isSupportedCurrency(currency) {
  return currency in CURRENCY_RATES;
}

export default {
  CURRENCY_RATES,
  CURRENCY_SYMBOLS,
  CURRENCY_NAMES,
  convertCurrency,
  formatCurrency,
  formatCurrencyCompact,
  parseCurrency,
  getCurrencySymbol,
  getCurrencyName,
  calculateDiscountPercentage,
  applyDiscount,
  calculateTax,
  calculateTotalWithTax,
  calculateShipping,
  roundToCent,
  formatPriceRange,
  isValidPrice,
  getSupportedCurrencies,
  isSupportedCurrency,
};