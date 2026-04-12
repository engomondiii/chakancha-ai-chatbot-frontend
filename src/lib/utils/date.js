/**
 * Date Utilities
 * Date formatting and manipulation using date-fns
 */

import { 
  format, 
  formatDistance, 
  formatRelative, 
  isToday, 
  isYesterday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  isThisYear,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  parseISO,
  isValid,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} formatString - Format pattern (default: 'MMM dd, yyyy')
 * @returns {string}
 */
export function formatDate(date, formatString = 'MMM dd, yyyy') {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, formatString);
}

/**
 * Format date and time
 * @param {Date|string} date - Date to format
 * @param {string} formatString - Format pattern (default: 'MMM dd, yyyy HH:mm')
 * @returns {string}
 */
export function formatDateTime(date, formatString = 'MMM dd, yyyy HH:mm') {
  return formatDate(date, formatString);
}

/**
 * Format time only
 * @param {Date|string} date - Date to format
 * @param {string} formatString - Format pattern (default: 'HH:mm')
 * @returns {string}
 */
export function formatTime(date, formatString = 'HH:mm') {
  return formatDate(date, formatString);
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

/**
 * Format date relative to now (e.g., "today at 3:00 PM")
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export function formatRelativeDate(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return formatRelative(dateObj, new Date());
}

/**
 * Format date smartly based on recency
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export function formatSmart(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'h:mm a')}`;
  }
  
  if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, 'h:mm a')}`;
  }
  
  if (isTomorrow(dateObj)) {
    return `Tomorrow at ${format(dateObj, 'h:mm a')}`;
  }
  
  if (isThisWeek(dateObj)) {
    return format(dateObj, 'EEEE \'at\' h:mm a');
  }
  
  if (isThisYear(dateObj)) {
    return format(dateObj, 'MMM dd \'at\' h:mm a');
  }
  
  return format(dateObj, 'MMM dd, yyyy');
}

/**
 * Format order/shipping date
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export function formatOrderDate(date) {
  return formatDate(date, 'MMMM dd, yyyy');
}

/**
 * Format estimated delivery date range
 * @param {number} minDays - Minimum days
 * @param {number} maxDays - Maximum days
 * @returns {string}
 */
export function formatDeliveryEstimate(minDays = 3, maxDays = 5) {
  const minDate = addDays(new Date(), minDays);
  const maxDate = addDays(new Date(), maxDays);
  
  return `${format(minDate, 'MMM dd')} - ${format(maxDate, 'MMM dd')}`;
}

/**
 * Get days until date
 * @param {Date|string} date - Target date
 * @returns {number}
 */
export function getDaysUntil(date) {
  if (!date) return 0;
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return 0;
  
  return differenceInDays(dateObj, new Date());
}

/**
 * Get days since date
 * @param {Date|string} date - Past date
 * @returns {number}
 */
export function getDaysSince(date) {
  if (!date) return 0;
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return 0;
  
  return differenceInDays(new Date(), dateObj);
}

/**
 * Check if date is recent (within last 7 days)
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export function isRecent(date) {
  return getDaysSince(date) <= 7;
}

/**
 * Check if date is upcoming (within next 7 days)
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export function isUpcoming(date) {
  return getDaysUntil(date) >= 0 && getDaysUntil(date) <= 7;
}

/**
 * Add days to date
 * @param {Date|string} date - Base date
 * @param {number} days - Days to add
 * @returns {Date}
 */
export function addDaysToDate(date, days) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addDays(dateObj, days);
}

/**
 * Subtract days from date
 * @param {Date|string} date - Base date
 * @param {number} days - Days to subtract
 * @returns {Date}
 */
export function subtractDays(date, days) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return subDays(dateObj, days);
}

/**
 * Get start of day
 * @param {Date|string} date - Date
 * @returns {Date}
 */
export function getStartOfDay(date = new Date()) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(dateObj);
}

/**
 * Get end of day
 * @param {Date|string} date - Date
 * @returns {Date}
 */
export function getEndOfDay(date = new Date()) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(dateObj);
}

/**
 * Parse ISO date string
 * @param {string} dateString - ISO date string
 * @returns {Date|null}
 */
export function parseDateString(dateString) {
  if (!dateString) return null;
  
  const date = parseISO(dateString);
  return isValid(date) ? date : null;
}

/**
 * Check if date string is valid
 * @param {string} dateString - Date string to validate
 * @returns {boolean}
 */
export function isValidDate(dateString) {
  if (!dateString) return false;
  
  const date = parseISO(dateString);
  return isValid(date);
}

/**
 * Get age from birth date
 * @param {Date|string} birthDate - Birth date
 * @returns {number}
 */
export function getAge(birthDate) {
  if (!birthDate) return 0;
  
  const birth = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Format duration in minutes
 * @param {number} minutes - Duration in minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (!minutes) return '0 min';
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${mins} min`;
}

/**
 * Get current timestamp
 * @returns {number}
 */
export function now() {
  return Date.now();
}

/**
 * Get ISO string for current time
 * @returns {string}
 */
export function nowISO() {
  return new Date().toISOString();
}

export default {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatRelativeDate,
  formatSmart,
  formatOrderDate,
  formatDeliveryEstimate,
  getDaysUntil,
  getDaysSince,
  isRecent,
  isUpcoming,
  addDaysToDate,
  subtractDays,
  getStartOfDay,
  getEndOfDay,
  parseDateString,
  isValidDate,
  getAge,
  formatDuration,
  now,
  nowISO,
};