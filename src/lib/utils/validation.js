/**
 * Validation Utilities
 * Common validation functions for forms and user input
 */

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @param {string} format - Format type (default: 'US')
 * @returns {boolean}
 */
export function isValidPhone(phone, format = 'US') {
  if (!phone) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (format === 'US') {
    return cleaned.length === 10;
  }
  
  // International: at least 7 digits
  return cleaned.length >= 7;
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export function isValidUrl(url) {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - {isValid: boolean, strength: string, message: string}
 */
export function validatePassword(password) {
  if (!password) {
    return {
      isValid: false,
      strength: 'none',
      message: 'Password is required',
    };
  }
  
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    return {
      isValid: false,
      strength: 'weak',
      message: `Password must be at least ${minLength} characters`,
    };
  }
  
  let strength = 'weak';
  let strengthCount = 0;
  
  if (hasUpperCase) strengthCount++;
  if (hasLowerCase) strengthCount++;
  if (hasNumber) strengthCount++;
  if (hasSpecialChar) strengthCount++;
  
  if (strengthCount >= 4) strength = 'strong';
  else if (strengthCount >= 3) strength = 'medium';
  
  const isValid = strengthCount >= 3;
  
  return {
    isValid,
    strength,
    message: isValid 
      ? 'Password is strong' 
      : 'Password should include uppercase, lowercase, number, and special character',
  };
}

/**
 * Validate credit card number (Luhn algorithm)
 * @param {string} cardNumber - Card number to validate
 * @returns {boolean}
 */
export function isValidCreditCard(cardNumber) {
  if (!cardNumber) return false;
  
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Validate CVV
 * @param {string} cvv - CVV to validate
 * @returns {boolean}
 */
export function isValidCVV(cvv) {
  if (!cvv) return false;
  return /^\d{3,4}$/.test(cvv);
}

/**
 * Validate postal code
 * @param {string} postalCode - Postal code to validate
 * @param {string} countryCode - Country code (default: 'US')
 * @returns {boolean}
 */
export function isValidPostalCode(postalCode, countryCode = 'US') {
  if (!postalCode) return false;
  
  const patterns = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
    UK: /^[A-Z]{1,2}\d{1,2}[A-Z]? ?\d[A-Z]{2}$/i,
    KE: /^\d{5}$/,
  };
  
  const pattern = patterns[countryCode];
  return pattern ? pattern.test(postalCode) : true;
}

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean}
 */
export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @returns {boolean}
 */
export function hasMinLength(value, minLength) {
  if (!value) return false;
  return value.length >= minLength;
}

/**
 * Validate maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum length
 * @returns {boolean}
 */
export function hasMaxLength(value, maxLength) {
  if (!value) return true;
  return value.length <= maxLength;
}

/**
 * Validate number range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean}
 */
export function isInRange(value, min, max) {
  if (value === null || value === undefined) return false;
  return value >= min && value <= max;
}

/**
 * Validate positive number
 * @param {number} value - Value to validate
 * @returns {boolean}
 */
export function isPositiveNumber(value) {
  return typeof value === 'number' && value > 0;
}

/**
 * Validate date is in the future
 * @param {Date|string} date - Date to validate
 * @returns {boolean}
 */
export function isFutureDate(date) {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj > new Date();
}

/**
 * Validate date is in the past
 * @param {Date|string} date - Date to validate
 * @returns {boolean}
 */
export function isPastDate(date) {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj < new Date();
}

/**
 * Validate age (for age verification)
 * @param {Date|string} birthDate - Birth date
 * @param {number} minAge - Minimum age
 * @returns {boolean}
 */
export function isMinimumAge(birthDate, minAge = 18) {
  if (!birthDate) return false;
  
  const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age >= minAge;
}

/**
 * Validate file size
 * @param {File} file - File object
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean}
 */
export function isValidFileSize(file, maxSizeMB = 5) {
  if (!file) return false;
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Validate file type
 * @param {File} file - File object
 * @param {string[]} allowedTypes - Allowed MIME types
 * @returns {boolean}
 */
export function isValidFileType(file, allowedTypes = []) {
  if (!file) return false;
  if (allowedTypes.length === 0) return true;
  return allowedTypes.includes(file.type);
}

/**
 * Sanitize input (remove HTML tags)
 * @param {string} input - Input to sanitize
 * @returns {string}
 */
export function sanitizeInput(input) {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Check if string contains only letters
 * @param {string} value - Value to check
 * @returns {boolean}
 */
export function isAlpha(value) {
  if (!value) return false;
  return /^[a-zA-Z]+$/.test(value);
}

/**
 * Check if string contains only letters and numbers
 * @param {string} value - Value to check
 * @returns {boolean}
 */
export function isAlphanumeric(value) {
  if (!value) return false;
  return /^[a-zA-Z0-9]+$/.test(value);
}

export default {
  isValidEmail,
  isValidPhone,
  isValidUrl,
  validatePassword,
  isValidCreditCard,
  isValidCVV,
  isValidPostalCode,
  isRequired,
  hasMinLength,
  hasMaxLength,
  isInRange,
  isPositiveNumber,
  isFutureDate,
  isPastDate,
  isMinimumAge,
  isValidFileSize,
  isValidFileType,
  sanitizeInput,
  isAlpha,
  isAlphanumeric,
};