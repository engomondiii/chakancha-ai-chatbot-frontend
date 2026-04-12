/**
 * src/lib/api/cart.js
 * Cart API functions — sync cart with backend.
 * The Zustand cartSlice is the source of truth locally;
 * these functions keep the server in sync and validate stock.
 */

import api, { ApiError } from './client';
import { ENDPOINTS }     from './endpoints';

/**
 * Fetch the server-side cart for authenticated users.
 * Used on login to merge server cart with local cart.
 */
export async function fetchServerCart() {
  try {
    const data = await api.get(ENDPOINTS.CART.GET);
    return data.cart || data;
  } catch (err) {
    if (err?.isUnauthorized) return null; // Guest user — no server cart
    if (err?.isNetworkError) return null; // Offline — use local cart
    throw err;
  }
}

/**
 * Add a product to the server cart.
 * @param {string} productId
 * @param {number} quantity
 */
export async function addToServerCart(productId, quantity = 1) {
  try {
    return await api.post(ENDPOINTS.CART.ADD, { productId, quantity });
  } catch (err) {
    // Non-critical — local cart still updated; log and continue
    console.error('[cart.js] addToServerCart failed:', err.message);
    return null;
  }
}

/**
 * Update quantity for a cart item on the server.
 * @param {string} productId
 * @param {number} quantity
 */
export async function updateServerCartItem(productId, quantity) {
  try {
    return await api.post(ENDPOINTS.CART.UPDATE, { productId, quantity });
  } catch (err) {
    console.error('[cart.js] updateServerCartItem failed:', err.message);
    return null;
  }
}

/**
 * Remove an item from the server cart.
 * @param {string} productId
 */
export async function removeFromServerCart(productId) {
  try {
    return await api.post(ENDPOINTS.CART.REMOVE, { productId });
  } catch (err) {
    console.error('[cart.js] removeFromServerCart failed:', err.message);
    return null;
  }
}

/**
 * Clear the entire server cart.
 */
export async function clearServerCart() {
  try {
    return await api.post(ENDPOINTS.CART.CLEAR);
  } catch (err) {
    console.error('[cart.js] clearServerCart failed:', err.message);
    return null;
  }
}

/**
 * Validate cart items — check stock availability.
 * Returns validation result with any out-of-stock or qty-exceeded items.
 *
 * @param {Array} cartItems - Local cart items
 * @returns {{ valid: boolean, errors: Array }}
 */
export async function validateCart(cartItems) {
  try {
    const data = await api.post('/cart/validate', {
      items: cartItems.map((i) => ({ productId: i.id, quantity: i.quantity })),
    });
    return data;
  } catch {
    // If validation endpoint is unavailable, pass through (non-blocking)
    return { valid: true, errors: [] };
  }
}

/**
 * Apply a coupon code on the server side.
 * Returns the coupon object if valid, throws ApiError if invalid.
 *
 * @param {string} code
 * @param {number} subtotal
 */
export async function validateCoupon(code, subtotal) {
  try {
    const data = await api.post(ENDPOINTS.CHECKOUT.APPLY_COUPON, { code, subtotal });
    return data.coupon || data;
  } catch (err) {
    throw new ApiError(err.status, err.message || 'Invalid coupon code');
  }
}

export default {
  fetchServerCart,
  addToServerCart,
  updateServerCartItem,
  removeFromServerCart,
  clearServerCart,
  validateCart,
  validateCoupon,
};