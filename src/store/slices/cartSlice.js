/**
 * src/store/slices/cartSlice.js — Integration Phase 3
 *
 * What changed from the original:
 *  - Currency: USD (was KES). Backend products are priced in USD.
 *  - FREE_SHIPPING_THRESHOLD: $50 USD (was 5,000 KES)
 *  - STANDARD_SHIPPING_COST: $0 — carriage is inside the price of the tea
 *  - TAX_RATE: 0.00 — so is tax; the backend charges neither
 *  - getCartSummary(): currency changed to 'USD'
 *  - Everything else unchanged — addToCart, removeFromCart, updateQuantity,
 *    clearCart, applyCoupon, removeCoupon, openCart/closeCart/toggleCart all work identically
 *
 * NOTE: The cart totals here are for the local UI display only.
 *       The backend (CartSerializer) recomputes everything server-side with
 *       country-specific shipping and tax rates at checkout.
 */

/*
 * Shipping and tax are inside the price of the tea.
 *
 * These were a $5 flat estimate and a 0% placeholder, added to the subtotal
 * while the page underneath said "There is no extra charge beyond your total".
 * A $30 container showed a $35 total directly above that sentence.
 *
 * The backend settled this at utils/constants.py -- SHIPPING_INCLUDED_IN_PRICE
 * and TAX_INCLUDED_IN_PRICE -- so its quote comes back with both at zero. This
 * file is what the customer sees BEFORE that quote arrives, which on the cart
 * page is the whole time, so it has to agree or the total changes under them
 * on the way to checkout.
 *
 * Kept as named constants rather than deleted: they are the two numbers to put
 * back if the business ever charges for either again, and a reader looking for
 * "where does shipping get added" should find this note rather than nothing.
 */
const FREE_SHIPPING_THRESHOLD = 50;   // USD — unused while shipping is free
const STANDARD_SHIPPING_COST  = 0;    // USD — was $5; carriage is in the price
const TAX_RATE                 = 0.0; // backend charges none; see TAX_INCLUDED_IN_PRICE

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

  //
  // Zero at every basket size, not only above a threshold. The threshold logic
  // is left standing because it is correct the moment STANDARD_SHIPPING_COST
  // is non-zero again; with it at zero both branches give the same answer.
  //
  const isFreeShipping =
    STANDARD_SHIPPING_COST === 0 ||
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
//
// A container is sold with tea, never instead of it (products/models.py,
// Product.is_accessory). The customer does not have to break that rule on
// purpose to reach it: add a tea, add a container, remove the tea, and the
// basket was legal at every step and illegal as a whole.
//
// So removing the last tea takes the containers with it, here, while the cart
// is still on screen and the change is obviously connected to what they just
// did. The alternative is an error at checkout, three pages later, about an
// item they no longer remember adding.
//
function isAccessoryLine(item) {
  return (item?.kind || 'tea') === 'accessory';
}

function withoutStrandedAccessories(items) {
  return items.some((item) => !isAccessoryLine(item))
    ? items
    : items.filter((item) => !isAccessoryLine(item));
}

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

  //
  // Pack this order as a gift. Free, so it is deliberately not part of
  // computeTotals: there is no figure for it to move, and giving it one
  // would be the first step towards charging for it.
  //
  // It lives here rather than in the checkout form because it is offered in
  // two places -- the basket and the first step of checkout -- and two
  // checkboxes sharing one answer is the only arrangement in which they
  // cannot contradict each other.
  //
  giftWrapping:  false,
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
            // Needed to tell a container from a tea once the product object
            // is gone. A line saved before this field existed reads as 'tea',
            // which is the harmless direction to be wrong in: the backend
            // gate in orders/services.py still refuses the sale.
            kind:     product.kind || 'tea',
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
      const cartItems = withoutStrandedAccessories(
        s.cartItems.filter((i) => lineKey(i.id, i.selections) !== key));
      return { cartItems, ...computeTotals(cartItems, s.appliedCoupon) };
    });
  },

  updateQuantity: (productId, quantity, selections = null) => {
    const key = lineKey(productId, selections);
    set((s) => {
      let cartItems;
      if (quantity <= 0) {
        cartItems = withoutStrandedAccessories(
          s.cartItems.filter((i) => lineKey(i.id, i.selections) !== key));
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

  setGiftWrapping: (wanted) => set({ giftWrapping: Boolean(wanted) }),

  clearCart: () => {
    // Including the wrapping. It is an instruction about this basket, and
    // keeping it past the order it belonged to would quietly wrap the next
    // one -- which nobody asked for and nobody would see until it arrived.
    set({
      cartItems: [], appliedCoupon: null, giftWrapping: false,
      ...computeTotals([], null),
    });
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
      giftWrapping:          s.giftWrapping,
      // Nothing left to reach: shipping is free from the first item.
      freeShippingRemaining: 0,
      hasFreeShipping:       true,
      currency:              'USD',
    };
  },
});

export default createCartSlice;