/**
 * Formatting Utilities
 * Common formatting functions for text, numbers, and display
 */

/**
 * Format a number with thousands separator
 * @param {number} num - Number to format
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string}
 */
export function formatNumber(num, locale = 'en-US') {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format price with currency symbol
 * @param {number} amount - Price amount
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string}
 */
export function formatPrice(amount, currency = 'USD', locale = 'en-US') {
  if (amount === null || amount === undefined) return '$0.00';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format compact number (1K, 1M, etc.)
 * @param {number} num - Number to format
 * @returns {string}
 */
export function formatCompactNumber(num) {
  if (num === null || num === undefined) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Decimal places (default: 0)
 * @returns {string}
 */
export function formatPercentage(value, decimals = 0) {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Convert text to title case
 * @param {string} text - Text to convert
 * @returns {string}
 */
export function toTitleCase(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert slug to title
 * @param {string} slug - Slug to convert
 * @returns {string}
 */
export function slugToTitle(slug) {
  if (!slug) return '';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert text to slug
 * @param {string} text - Text to convert
 * @returns {string}
 */
export function textToSlug(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @param {string} format - Format type (default: 'US')
 * @returns {string}
 */
export function formatPhoneNumber(phone, format = 'US') {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  if (format === 'US') {
    // Format as (XXX) XXX-XXXX
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  return phone;
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format weight
 * @param {number} grams - Weight in grams
 * @param {string} unit - Target unit ('g', 'kg', 'oz', 'lb')
 * @returns {string}
 */
export function formatWeight(grams, unit = 'g') {
  if (!grams) return '0g';
  
  switch (unit) {
    case 'kg':
      return `${(grams / 1000).toFixed(2)}kg`;
    case 'oz':
      return `${(grams * 0.035274).toFixed(2)}oz`;
    case 'lb':
      return `${(grams * 0.00220462).toFixed(2)}lb`;
    default:
      return `${grams}g`;
  }
}

/**
 * Format ordinal number (1st, 2nd, 3rd, etc.)
 * @param {number} num - Number
 * @returns {string}
 */
export function formatOrdinal(num) {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) return num + 'st';
  if (j === 2 && k !== 12) return num + 'nd';
  if (j === 3 && k !== 13) return num + 'rd';
  return num + 'th';
}

/**
 * Pluralize word based on count
 * @param {number} count - Count
 * @param {string} singular - Singular form
 * @param {string} plural - Plural form (optional)
 * @returns {string}
 */
export function pluralize(count, singular, plural) {
  if (count === 1) return singular;
  return plural || singular + 's';
}

/**
 * Format list with commas and 'and'
 * @param {string[]} items - List of items
 * @returns {string}
 */
export function formatList(items) {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(' and ');
  
  return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
}

/**
 * Mask sensitive data
 * @param {string} data - Data to mask
 * @param {number} visibleChars - Number of visible characters at end
 * @returns {string}
 */
export function maskData(data, visibleChars = 4) {
  if (!data) return '';
  if (data.length <= visibleChars) return data;
  
  const masked = '*'.repeat(data.length - visibleChars);
  const visible = data.slice(-visibleChars);
  
  return masked + visible;
}

/**
 * Format initials from name
 * @param {string} name - Full name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name) return '';
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default {
  formatNumber,
  formatPrice,
  formatCompactNumber,
  formatPercentage,
  truncateText,
  toTitleCase,
  slugToTitle,
  textToSlug,
  formatPhoneNumber,
  formatFileSize,
  formatWeight,
  formatOrdinal,
  pluralize,
  formatList,
  maskData,
  getInitials,
};