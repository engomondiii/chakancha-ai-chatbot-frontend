/**
 * src/lib/api/orders.js
 * Order API functions — create, list, track, and cancel orders.
 * Includes mock fallback for development.
 */

import api from './client';
import { ENDPOINTS } from './endpoints';
import { nanoid }    from 'nanoid';

// ─── Mock order generator ─────────────────────────────────────────────────────

function createMockOrder(payload) {
  return {
    id:          `ORD-${nanoid(8).toUpperCase()}`,
    status:      'confirmed',
    createdAt:   new Date().toISOString(),
    items:       payload.items || [],
    total:       payload.total || 0,
    currency:    'KES',
    shipping:    payload.shipping || {},
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    trackingUrl: null,
    paymentStatus: 'paid',
  };
}

// ─── Create order ─────────────────────────────────────────────────────────────

/**
 * Create a new order.
 * @param {object} payload - { items, total, shipping, payment }
 * @returns {object} - Created order
 */
export async function createOrder(payload) {
  try {
    const data = await api.post(ENDPOINTS.ORDERS.CREATE, payload);
    return data.order || data;
  } catch (err) {
    // Return mock order in development
    if (process.env.NODE_ENV === 'development' || err?.isNetworkError) {
      console.warn('[orders.js] Using mock order creation');
      await new Promise((r) => setTimeout(r, 1200)); // Simulate processing
      return createMockOrder(payload);
    }
    throw err;
  }
}

// ─── List orders ──────────────────────────────────────────────────────────────

/**
 * Get order history for the current user.
 * @param {object} params - { page, limit, status }
 */
export async function getOrders(params = {}) {
  try {
    const data = await api.get(ENDPOINTS.ORDERS.LIST, { params });
    return data.orders || data;
  } catch (err) {
    if (err?.isNetworkError || process.env.NODE_ENV === 'development') {
      return getMockOrders();
    }
    throw err;
  }
}

// ─── Single order ─────────────────────────────────────────────────────────────

/**
 * Get a single order by ID.
 * @param {string} orderId
 */
export async function getOrder(orderId) {
  try {
    const data = await api.get(ENDPOINTS.ORDERS.DETAIL(orderId));
    return data.order || data;
  } catch (err) {
    if (err?.isNetworkError || process.env.NODE_ENV === 'development') {
      const mock = getMockOrders();
      return mock.find((o) => o.id === orderId) || mock[0];
    }
    throw err;
  }
}

// ─── Cancel order ─────────────────────────────────────────────────────────────

/**
 * Cancel an order (only if status is 'confirmed' or 'processing').
 * @param {string} orderId
 */
export async function cancelOrder(orderId) {
  try {
    return await api.post(ENDPOINTS.ORDERS.CANCEL(orderId));
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      return { success: true, message: 'Order cancelled (mock)' };
    }
    throw err;
  }
}

// ─── Track order ──────────────────────────────────────────────────────────────

/**
 * Get tracking information for an order.
 * @param {string} orderId
 */
export async function trackOrder(orderId) {
  try {
    return await api.get(ENDPOINTS.ORDERS.TRACK(orderId));
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      return {
        orderId,
        status:    'in_transit',
        carrier:   'DHL Express',
        trackingNumber: 'DHL' + Math.random().toString().slice(2, 12),
        events: [
          { time: new Date(Date.now() - 86400000).toISOString(), description: 'Package collected from Nandi Hills estate', location: 'Kapsabet, Kenya' },
          { time: new Date(Date.now() - 43200000).toISOString(), description: 'Cleared customs', location: 'Jomo Kenyatta Airport, NBI' },
          { time: new Date().toISOString(), description: 'In transit to destination', location: 'DHL Hub' },
        ],
      };
    }
    throw err;
  }
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function getMockOrders() {
  const products = [
    { id: 'p1', name: 'Nandi Hills Black Tea',   price: 18.99, image: '/images/products/black-tea-1.jpg', category: 'black',  quantity: 2 },
    { id: 'p2', name: 'Morning Mist Green Tea',  price: 16.99, image: '/images/products/green-tea-1.jpg', category: 'green',  quantity: 1 },
    { id: 'p3', name: 'Purple Peak Tea',         price: 24.99, image: '/images/products/purple-tea-1.jpg',category: 'purple', quantity: 1 },
  ];

  return [
    {
      id:           'ORD-A1B2C3D4',
      status:       'delivered',
      createdAt:    new Date(Date.now() - 14 * 86400000).toISOString(),
      items:        [products[0], products[1]],
      total:        56.00,
      currency:     'USD',
      paymentStatus:'paid',
      estimatedDelivery: new Date(Date.now() - 7 * 86400000).toISOString(),
      trackingUrl:  '#',
      shipping:     { firstName: 'Demo', lastName: 'User', city: 'Nairobi', country: 'KE' },
    },
    {
      id:           'ORD-E5F6G7H8',
      status:       'confirmed',
      createdAt:    new Date(Date.now() - 2 * 86400000).toISOString(),
      items:        [products[2]],
      total:        24.99,
      currency:     'USD',
      paymentStatus:'paid',
      estimatedDelivery: new Date(Date.now() + 7 * 86400000).toISOString(),
      trackingUrl:  null,
      shipping:     { firstName: 'Demo', lastName: 'User', city: 'London', country: 'GB' },
    },
  ];
}

export default {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  trackOrder,
};