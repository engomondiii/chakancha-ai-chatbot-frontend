/**
 * src/store/slices/cartSlice.js — Integration Phase 3
 *
 * What changed from the original:
 *  - Currency: USD (was KES). Backend products are priced in USD.
 *  - FREE_SHIPPING_THRESHOLD: $50 USD (was 5,000 KES)
 *  - STANDARD_SHIPPING_COST: $5 USD (was 300 KES) — placeholder until
 *    ShippingCalculator calls the real backend for per-country rates
 *  - TAX_RATE: 0.00 (tax is computed server-side per country in orders/services.py;
 *    we show $0 in the local cart so we don't double-count it at checkout)
 *  - getCartSummary(): currency changed to 'USD'
 *  - Everything else unchanged — addToCart, removeFromCart, updateQuantity,
 *    clearCart, applyCoupon, removeCoupon, openCart/closeCart/toggleCart all work identically
 *
 * NOTE: The cart totals here are for the local UI display only.
 *       The backend (CartSerializer) recomputes everything server-side with
 *       country-specific shipping and tax rates at checkout.
 */

const FREE_SHIPPING_THRESHOLD = 50;   // USD
const STANDARD_SHIPPING_COST  = 5;    // USD (flat estimate; real rate from ShippingCalcView)
const TAX_RATE                 = 0.0; // 0% locally; backend applies country-specific VAT

function computeTotals(cartItems, appliedCoupon) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discount = subtotal * (appliedCoupon.value / 100);
    } else if (appliedCoupon.type === 'fixed') {
      discount = Math.min(appliedCoupon.value, subtotal);
    }
    // free_shipping handled in shipping calc below
  }

  const afterDiscount = subtotal - discount;
  const isFreeShipping =
    afterDiscount >= FREE_SHIPPING_THRESHOLD ||
    appliedCoupon?.type === 'free_shipping';

  const shipping = isFreeShipping ? 0 : STANDARD_SHIPPING_COST;
  const tax      = afterDiscount * TAX_RATE;
  const total    = afterDiscount + shipping + tax;

  return {
    subtotal:     round(subtotal),
    discount:     round(discount),
    shipping:     round(shipping),
    tax:          round(tax),
    total:        round(total),
    cartSubtotal: round(subtotal),
    cartTax:      round(tax),
    cartShipping: round(shipping),
    cartTotal:    round(total),
    cartDiscount: round(discount),
    cartItemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
  };
}

function round(v) { return Math.round(v * 100) / 100; }

// ─── Slice ────────────────────────────────────────────────────────────────────

/**
 * The identity of a cart line.
 *
 * A product id alone is not enough once a bundle exists: two Nandi Gold and
 * one-of-each are the same product at the same price and different orders, and
 * keying on the id would merge them into one line that ships the wrong tea.
 *
 * Sorted, so picking Gold-then-Black and Black-then-Gold is one line rather
 * than two -- the customer chose the same two teas and would not expect the
 * order they clicked in to matter. This mirrors CartItem.key_for on the
 * backend; the two must agree or a cart will look different after it syncs.
 */
function lineKey(productId, selections) {
  const teas = selections?.teas;
  if (!Array.isArray(teas) || teas.length === 0) {
    return String(productId);
  }
  return `${productId}::${[...teas].map(String).sort().join(',')}`;
}

export const createCartSlice = (set, get) => ({
  cartItems:     [],
  appliedCoupon: null,
  isCartOpen:    false,
  // Shipping country, shared so /cart and /checkout request the SAME backend
  // quote. Empty until the buyer picks one, in which case the backend applies
  // its own default.
  shippingCountry: '',
  cartSubtotal:  0,
  cartTax:       0,
  cartShipping:  0,
  cartTotal:     0,
  cartDiscount:  0,
  cartItemCount: 0,

  _syncTotals: () => {
    const { cartItems, appliedCoupon } = get();
    set(computeTotals(cartItems, appliedCoupon));
  },

  setShippingCountry: (country) => set({ shippingCountry: country || '' }),

  addToCart: (product, quantity = 1, selections = null) => {
    const MAX_QTY = 10;
    const key = lineKey(product.id, selections);
    set((s) => {
      const existing = s.cartItems.find((i) => lineKey(i.id, i.selections) === key);
      let cartItems;
      if (existing) {
        cartItems = s.cartItems.map((i) =>
          lineKey(i.id, i.selections) === key
            ? { ...i, quantity: Math.min(i.quantity + quantity, MAX_QTY) }
            : i
        );
      } else {
        cartItems = [
          ...s.cartItems,
          {
            id:       product.id,
            name:     product.name,
            slug:     product.slug,
            price:    parseFloat(product.price) || 0,
            // Accept both field name variants from normalizeProduct()
            image:    product.image || product.primary_image || null,
            category: product.category?.name || product.category || '',
            quantity: Math.min(quantity, MAX_QTY),
            inStock:  product.inStock !== false && product.in_stock !== false,
            // What was chosen inside this line, for a bundle. Null otherwise.
            selections: selections || null,
          },
        ];
      }
      return { cartItems, ...computeTotals(cartItems, s.appliedCoupon) };
    });
  },

  //
  // These take the line's selections as well as its product id. An ordinary
  // tea passes nothing and behaves exactly as before, because lineKey(id, null)
  // is just the id. A bundle must pass them, or removing "two Gold" would also
  // remove "one of each" -- same product, same price, different order.
  //
  removeFromCart: (productId, selections = null) => {
    const key = lineKey(productId, selections);
    set((s) => {
      const cartItems = s.cartItems.filter(
        (i) => lineKey(i.id, i.selections) !== key);
      return { cartItems, ...computeTotals(cartItems, s.appliedCoupon) };
    });
  },

  updateQuantity: (productId, quantity, selections = null) => {
    const key = lineKey(productId, selections);
    set((s) => {
      let cartItems;
      if (quantity <= 0) {
        cartItems = s.cartItems.filter(
          (i) => lineKey(i.id, i.selections) !== key);
      } else {
        cartItems = s.cartItems.map((i) =>
          lineKey(i.id, i.selections) === key
            ? { ...i, quantity: Math.min(quantity, 10) }
            : i
        );
      }
      return { cartItems, ...computeTotals(cartItems, s.appliedCoupon) };
    });
  },

  clearCart: () => {
    set({ cartItems: [], appliedCoupon: null, ...computeTotals([], null) });
  },

  applyCoupon: (coupon) => {
    set((s) => ({ appliedCoupon: coupon, ...computeTotals(s.cartItems, coupon) }));
  },

  removeCoupon: () => {
    set((s) => ({ appliedCoupon: null, ...computeTotals(s.cartItems, null) }));
  },

  openCart:   () => set({ isCartOpen: true }),
  closeCart:  () => set({ isCartOpen: false }),
  toggleCart: () => set((s) => ({ isCartOpen: !s.isCartOpen })),

  getCartItem: (productId, selections = null) => {
    const key = lineKey(productId, selections);
    return get().cartItems.find((i) => lineKey(i.id, i.selections) === key) || null;
  },

  //
  // Deliberately the product, not the line: the button on a bundle card asks
  // "is this bundle in the cart", and answering "only with those exact two
  // teas" would show Add to cart beside a bundle already sitting in it.
  //
  isInCart: (productId) => get().cartItems.some((i) => i.id === productId),

  getCartSummary: () => {
    const s = get();
    return {
      items:                 s.cartItems,
      subtotal:              s.cartSubtotal,
      discount:              s.cartDiscount,
      shipping:              s.cartShipping,
      tax:                   s.cartTax,
      total:                 s.cartTotal,
      itemCount:             s.cartItemCount,
      appliedCoupon:         s.appliedCoupon,
      freeShippingRemaining: Math.max(0, FREE_SHIPPING_THRESHOLD - s.cartSubtotal),
      hasFreeShipping:       s.cartSubtotal >= FREE_SHIPPING_THRESHOLD || s.appliedCoupon?.type === 'free_shipping',
      currency:              'USD',
    };
  },
});

export default createCartSlice;