/**
 * cartSlice.js
 * Zustand slice for shopping cart state.
 * Currency: KES. Free shipping at 5,000 KES. VAT 16%.
 */

const FREE_SHIPPING_THRESHOLD = 5000;  // KES
const STANDARD_SHIPPING_COST  = 300;   // KES
const TAX_RATE                 = 0.16; // 16% VAT Kenya

// ─── Totals calculator ────────────────────────────────────────────────────────

function computeTotals(cartItems, appliedCoupon) {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discount = subtotal * (appliedCoupon.value / 100);
    } else if (appliedCoupon.type === 'fixed') {
      discount = Math.min(appliedCoupon.value, subtotal);
    } else if (appliedCoupon.type === 'free_shipping') {
      // Handled in shipping calc
    }
  }

  const afterDiscount = subtotal - discount;

  const isFreeShipping =
    afterDiscount >= FREE_SHIPPING_THRESHOLD ||
    appliedCoupon?.type === 'free_shipping';

  const shipping = isFreeShipping ? 0 : STANDARD_SHIPPING_COST;

  const tax   = afterDiscount * TAX_RATE;
  const total = afterDiscount + shipping + tax;

  return {
    subtotal:     Math.round(subtotal    * 100) / 100,
    discount:     Math.round(discount    * 100) / 100,
    shipping:     Math.round(shipping    * 100) / 100,
    tax:          Math.round(tax         * 100) / 100,
    total:        Math.round(total       * 100) / 100,
    cartSubtotal: Math.round(subtotal    * 100) / 100,
    cartTax:      Math.round(tax         * 100) / 100,
    cartShipping: Math.round(shipping    * 100) / 100,
    cartTotal:    Math.round(total       * 100) / 100,
    cartDiscount: Math.round(discount    * 100) / 100,
    cartItemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
  };
}

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createCartSlice = (set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  cartItems:     [],
  appliedCoupon: null,
  isCartOpen:    false,

  // Computed totals (kept in sync)
  cartSubtotal:  0,
  cartTax:       0,
  cartShipping:  0,
  cartTotal:     0,
  cartDiscount:  0,
  cartItemCount: 0,

  // ── Private helper ───────────────────────────────────────────────────────
  _syncTotals: () => {
    const { cartItems, appliedCoupon } = get();
    const totals = computeTotals(cartItems, appliedCoupon);
    set(totals);
  },

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Add a product to the cart.
   * If it already exists, increment quantity (up to maxQty).
   */
  addToCart: (product, quantity = 1) => {
    const MAX_QTY = 10;

    set((s) => {
      const existing = s.cartItems.find((i) => i.id === product.id);

      let cartItems;
      if (existing) {
        cartItems = s.cartItems.map((i) =>
          i.id === product.id
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
            price:    product.price,
            image:    product.image,
            category: product.category,
            quantity: Math.min(quantity, MAX_QTY),
            inStock:  product.inStock !== false,
          },
        ];
      }

      const totals = computeTotals(cartItems, s.appliedCoupon);
      return { cartItems, ...totals };
    });
  },

  /**
   * Remove a product from the cart entirely.
   */
  removeFromCart: (productId) => {
    set((s) => {
      const cartItems = s.cartItems.filter((i) => i.id !== productId);
      const totals    = computeTotals(cartItems, s.appliedCoupon);
      return { cartItems, ...totals };
    });
  },

  /**
   * Update the quantity of a cart item.
   * Setting quantity to 0 removes the item.
   */
  updateQuantity: (productId, quantity) => {
    set((s) => {
      let cartItems;
      if (quantity <= 0) {
        cartItems = s.cartItems.filter((i) => i.id !== productId);
      } else {
        cartItems = s.cartItems.map((i) =>
          i.id === productId ? { ...i, quantity: Math.min(quantity, 10) } : i
        );
      }
      const totals = computeTotals(cartItems, s.appliedCoupon);
      return { cartItems, ...totals };
    });
  },

  /**
   * Clear all items from the cart.
   */
  clearCart: () => {
    set({
      cartItems:     [],
      appliedCoupon: null,
      ...computeTotals([], null),
    });
  },

  /**
   * Apply a coupon to the cart.
   * Expects { code, type: 'percentage'|'fixed'|'free_shipping', value }
   */
  applyCoupon: (coupon) => {
    set((s) => {
      const totals = computeTotals(s.cartItems, coupon);
      return { appliedCoupon: coupon, ...totals };
    });
  },

  /**
   * Remove the applied coupon.
   */
  removeCoupon: () => {
    set((s) => {
      const totals = computeTotals(s.cartItems, null);
      return { appliedCoupon: null, ...totals };
    });
  },

  /**
   * Open / close the cart drawer.
   */
  openCart:  () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart:() => set((s) => ({ isCartOpen: !s.isCartOpen })),

  // ── Query helpers ────────────────────────────────────────────────────────

  /**
   * Get a specific cart item by product ID.
   */
  getCartItem: (productId) => {
    return get().cartItems.find((i) => i.id === productId) || null;
  },

  /**
   * Check if a product is in the cart.
   */
  isInCart: (productId) => {
    return get().cartItems.some((i) => i.id === productId);
  },

  /**
   * Get a full cart summary (used in checkout).
   */
  getCartSummary: () => {
    const s = get();
    const freeShippingRemaining = Math.max(
      0,
      FREE_SHIPPING_THRESHOLD - s.cartSubtotal
    );

    return {
      items:                 s.cartItems,
      subtotal:              s.cartSubtotal,
      discount:              s.cartDiscount,
      shipping:              s.cartShipping,
      tax:                   s.cartTax,
      total:                 s.cartTotal,
      itemCount:             s.cartItemCount,
      appliedCoupon:         s.appliedCoupon,
      freeShippingRemaining,
      hasFreeShipping:       freeShippingRemaining === 0,
      currency:              'KES',
    };
  },
});

export default createCartSlice;