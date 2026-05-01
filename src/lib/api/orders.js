/**
 * src/lib/api/orders.js — Integration Phase 3
 *
 * What changed from the original:
 *  - createOrder() sends backend-expected payload:
 *      { shipping: {first_name, last_name, email, ...}, payment_method, coupon_code, country }
 *    NOT { items, total, shipping, payment } (old shape)
 *  - createOrder() requires authentication (POST /api/v1/orders/create/)
 *  - getOrders() uses ENDPOINTS.ORDERS.LIST → GET /api/v1/orders/
 *  - getOrder() uses ENDPOINTS.ORDERS.DETAIL(id) → GET /api/v1/orders/{id}/
 *  - cancelOrder() calls POST /api/v1/orders/{id}/cancel/
 *  - trackOrder() calls GET /api/v1/orders/{id}/track/
 *  - createOrder() mock: currency changed to 'USD' (backend stores USD)
 *  - All response shapes updated to match OrderDetailSerializer
 */

import api from './client';
import { ENDPOINTS } from './endpoints';
import { nanoid }    from 'nanoid';

// ─── Mock generator ───────────────────────────────────────────────────────────

function createMockOrder(payload) {
  return {
    id:               `ORD-${nanoid(8).toUpperCase()}`,
    status:           'confirmed',
    payment_status:   'paid',
    payment_method:   payload.payment_method || 'card',
    created_at:       new Date().toISOString(),
    items:            [],
    subtotal:         payload.subtotal || 0,
    shipping_cost:    5.00,
    tax:              (payload.subtotal || 0) * 0.16,
    discount:         0,
    total:            (payload.subtotal || 0) * 1.16 + 5,
    currency:         'USD',
    coupon_code:      payload.coupon_code || '',
    shipping_address: payload.shipping || {},
    estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tracking_url:     null,
    tracking_number:  null,
  };
}

// ─── Create order ─────────────────────────────────────────────────────────────

/**
 * Create a new order from the current user's backend cart.
 *
 * Backend: POST /api/v1/orders/create/
 * Requires authentication (JWT access token).
 *
 * Payload matches CreateOrderSerializer:
 * {
 *   shipping:       { first_name, last_name, email, phone, address1, address2,
 *                     city, state, postal_code, country, notes }
 *   payment_method: 'card' | 'kginicis'
 *   coupon_code:    string (optional)
 *   country:        'US' | 'KE' | ...  (used for shipping/tax calc)
 * }
 *
 * @param {object} payload - { shipping, payment_method, coupon_code, country }
 */
export async function createOrder(payload) {
  // Convert frontend checkout form shape → backend CreateOrderSerializer shape
  const backendPayload = {
    shipping: {
      first_name:  payload.shipping?.firstName  || payload.shipping?.first_name  || '',
      last_name:   payload.shipping?.lastName   || payload.shipping?.last_name   || '',
      email:       payload.shipping?.email      || '',
      phone:       payload.shipping?.phone      || '',
      address1:    payload.shipping?.address1   || '',
      address2:    payload.shipping?.address2   || '',
      city:        payload.shipping?.city       || '',
      state:       payload.shipping?.state      || '',
      postal_code: payload.shipping?.postalCode || payload.shipping?.postal_code || '',
      country:     payload.shipping?.country    || 'US',
      notes:       payload.shipping?.notes      || '',
    },
    payment_method: payload.payment?.method || payload.payment_method || 'card',
    coupon_code:    payload.coupon_code     || '',
    country:        payload.shipping?.country || 'US',
  };

  try {
    const data = await api.post(ENDPOINTS.ORDERS.CREATE, backendPayload);
    return data.order || data;
  } catch (err) {
    if (process.env.NODE_ENV === 'development' || err?.isNetworkError) {
      console.warn('[orders.js] Using mock order creation');
      await new Promise((r) => setTimeout(r, 1200));
      return createMockOrder(backendPayload);
    }
    throw err;
  }
}

// ─── List orders ──────────────────────────────────────────────────────────────

export async function getOrders(params = {}) {
  try {
    const data = await api.get(ENDPOINTS.ORDERS.LIST, { params });
    return data.orders || data.results || data;
  } catch (err) {
    if (err?.isNetworkError || process.env.NODE_ENV === 'development') {
      return getMockOrders();
    }
    throw err;
  }
}

// ─── Single order ─────────────────────────────────────────────────────────────

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

export async function trackOrder(orderId) {
  try {
    return await api.get(ENDPOINTS.ORDERS.TRACK(orderId));
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      return {
        order_id:        orderId,
        status:          'in_transit',
        carrier:         'DHL Express',
        tracking_number: 'DHL' + Math.random().toString().slice(2, 12),
        events: [
          { time: new Date(Date.now() - 86400000).toISOString(), description: 'Package collected from Nandi Hills estate', location: 'Kapsabet, Kenya' },
          { time: new Date().toISOString(), description: 'In transit to destination', location: 'DHL Hub' },
        ],
      };
    }
    throw err;
  }
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function getMockOrders() {
  return [
    {
      id:               'ORD-A1B2C3D4',
      status:           'delivered',
      payment_status:   'paid',
      payment_method:   'card',
      created_at:       new Date(Date.now() - 14 * 86400000).toISOString(),
      items:            [
        { id: 1, name: 'Nandi Hills Black Tea',  price: 18.99, quantity: 2, category: 'black', image: '/images/products/black-tea-1.jpg'  },
        { id: 2, name: 'Morning Mist Green Tea', price: 16.99, quantity: 1, category: 'green', image: '/images/products/green-tea-1.jpg'  },
      ],
      subtotal:         54.97,
      shipping_cost:    0,
      tax:              8.80,
      discount:         0,
      total:            63.77,
      currency:         'USD',
      estimated_delivery: new Date(Date.now() - 7 * 86400000).toISOString(),
      tracking_url:     '#',
      tracking_number:  'DHL1234567890',
      shipping_address: { first_name: 'Demo', last_name: 'User', city: 'Nairobi', country: 'KE' },
    },
    {
      id:               'ORD-E5F6G7H8',
      status:           'confirmed',
      payment_status:   'paid',
      payment_method:   'card',
      created_at:       new Date(Date.now() - 2 * 86400000).toISOString(),
      items:            [
        { id: 3, name: 'Purple Peak Tea', price: 24.99, quantity: 1, category: 'purple', image: '/images/products/purple-tea-1.jpg' },
      ],
      subtotal:         24.99,
      shipping_cost:    18.00,
      tax:              4.00,
      discount:         0,
      total:            46.99,
      currency:         'USD',
      estimated_delivery: new Date(Date.now() + 7 * 86400000).toISOString(),
      tracking_url:     null,
      tracking_number:  null,
      shipping_address: { first_name: 'Demo', last_name: 'User', city: 'London', country: 'GB' },
    },
  ];
}

// ─── Stripe payment initialisation ───────────────────────────────────────────

/**
 * Initialise a Stripe PaymentIntent.
 * Returns client_secret for Stripe.js to confirm the card.
 *
 * Flow:
 *   1. Call initStripePayment() → get client_secret
 *   2. Use Stripe.js stripe.confirmCardPayment(client_secret, { payment_method: {...} })
 *   3. On success, call createOrder() with stripe_payment_intent_id
 *
 * @param {number} subtotal  - Cart subtotal in USD
 * @param {string} currency  - ISO 4217 (default 'USD')
 */
export async function initStripePayment(subtotal, currency = 'USD') {
  const data = await api.post(ENDPOINTS.CHECKOUT.PROCESS_PAYMENT, {
    payment_method: 'card',
    subtotal:       parseFloat(subtotal.toFixed(2)),
    currency,
  });
  return data; // { client_secret, payment_intent_id, amount, currency }
}

// ─── PayPal payment initialisation ───────────────────────────────────────────

/**
 * Initialise a PayPal order.
 * Returns approval_url for the buyer to approve on PayPal.
 *
 * Flow:
 *   1. Call initPayPalPayment() → get approval_url
 *   2. Redirect buyer to approval_url (or show PayPal button via SDK)
 *   3. After buyer approves, PayPal redirects to return_url with ?token=PAYPAL_ORDER_ID
 *   4. Call createOrder() with paypal_order_id = token from URL
 *
 * @param {number} subtotal  - Cart subtotal in USD
 * @param {string} currency  - ISO 4217 (default 'USD')
 */
export async function initPayPalPayment(subtotal, currency = 'USD') {
  const data = await api.post(ENDPOINTS.CHECKOUT.PROCESS_PAYMENT, {
    payment_method: 'paypal',
    subtotal:       parseFloat(subtotal.toFixed(2)),
    currency,
  });
  return data; // { paypal_order_id, approval_url, status }
}

export default { createOrder, getOrders, getOrder, cancelOrder, trackOrder, initStripePayment, initPayPalPayment };