/**
 * src/lib/api/cart.js — Integration Phase 3
 *
 * What changed from the original:
 *  - addToServerCart(): sends product_id (not productId) — backend CartAddSerializer expects product_id
 *  - updateServerCartItem(): sends product_id (not productId)
 *  - removeFromServerCart(): sends product_id (not productId)
 *  - validateCart(): sends product_id (not productId) in items array
 *  - validateCoupon(): calls ENDPOINTS.CHECKOUT.APPLY_COUPON (POST /api/v1/checkout/coupon/)
 *    with { code, subtotal } — matches CouponValidateSerializer
 *  - fetchServerCart() response shape: backend CartSerializer returns { id, items, item_count,
 *    subtotal, tax, shipping_cost, discount, total } — mapped accordingly
 *  - X-Session-Id header sent automatically by client.js
 */

import api, { ApiError } from './client';
import { ENDPOINTS }     from './endpoints';

/**
 * Fetch the server-side cart for authenticated users.
 * Response shape: { id, items, item_count, subtotal, tax, shipping_cost, discount, total }
 */
export async function fetchServerCart() {
  try {
    const data = await api.get(ENDPOINTS.CART.GET);
    return data.cart || data;
  } catch (err) {
    if (err?.status === 401) return null;   // Guest user
    if (err?.isNetworkError) return null;   // Offline
    throw err;
  }
}

/**
 * Add a product to the server cart.
 * Backend expects: { product_id: UUID, quantity: int }
 * @param {string} productId - UUID
 * @param {number} quantity
 */
export async function addToServerCart(productId, quantity = 1) {
  try {
    return await api.post(ENDPOINTS.CART.ADD, { product_id: productId, quantity });
  } catch (err) {
    console.error('[cart.js] addToServerCart failed:', err.message);
    return null;
  }
}

/**
 * Update quantity for a cart item.
 * Backend expects: { product_id: UUID, quantity: int (0 = remove) }
 * @param {string} productId
 * @param {number} quantity
 */
export async function updateServerCartItem(productId, quantity) {
  try {
    return await api.post(ENDPOINTS.CART.UPDATE, { product_id: productId, quantity });
  } catch (err) {
    console.error('[cart.js] updateServerCartItem failed:', err.message);
    return null;
  }
}

/**
 * Remove an item from the server cart.
 * Backend expects: { product_id: UUID }
 * @param {string} productId
 */
export async function removeFromServerCart(productId) {
  try {
    return await api.post(ENDPOINTS.CART.REMOVE, { product_id: productId });
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
 * Backend expects: { items: [{ product_id, quantity }] }
 * @param {Array} cartItems - Local cart items
 */
export async function validateCart(cartItems) {
  try {
    const data = await api.post(ENDPOINTS.CART.VALIDATE, {
      items: cartItems.map((i) => ({ product_id: i.id, quantity: i.quantity })),
    });
    return data; // { valid: bool, errors: [] }
  } catch {
    return { valid: true, errors: [] };
  }
}

/**
 * Validate a coupon code against the backend.
 * POST /api/v1/checkout/coupon/
 * Backend expects: { code, subtotal }
 * Backend returns: { code, type, value, minimum_order, expires_at } or 400 error
 *
 * @param {string} code
 * @param {number} subtotal - Cart subtotal in USD
 */
export async function validateCoupon(code, subtotal = 0) {
  try {
    const data = await api.post(ENDPOINTS.CHECKOUT.APPLY_COUPON, {
      code:     code.trim().toUpperCase(),
      subtotal: parseFloat(subtotal.toFixed(2)),
    });
    return data.coupon || data;
  } catch (err) {
    throw new ApiError(err.status || 400, err.message || 'Invalid coupon code');
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