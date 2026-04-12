/**
 * src/lib/hooks/useCart.js
 * Canonical cart hook — Phase 3 version.
 * Wired to cartSlice. Uses useShallow to prevent infinite re-renders.
 * This is the definitive useCart — the Phase 1 version in useProducts.js
 * was a stub; this replaces it.
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useStore }              from '@/store';
import { useShallow }            from 'zustand/react/shallow';
import { formatCurrency }        from '@/lib/utils/currency';

const FREE_SHIPPING_KES = 5000;

// ─── Primary hook ──────────────────────────────────────────────────────────────

/**
 * useCart
 * Full cart state and all operations.
 */
export function useCart() {
  // ── Primitives — each stable reference ───────────────────────────────────
  const cartItems    = useStore((s) => s.cartItems);
  const appliedCoupon = useStore((s) => s.appliedCoupon);
  const cartSubtotal = useStore((s) => s.cartSubtotal);
  const cartShipping = useStore((s) => s.cartShipping);
  const cartTax      = useStore((s) => s.cartTax);
  const cartTotal    = useStore((s) => s.cartTotal);
  const cartDiscount = useStore((s) => s.cartDiscount);
  const cartItemCount = useStore((s) => s.cartItemCount);
  const isCartOpen   = useStore((s) => s.isCartOpen);

  // ── Actions — grouped with useShallow ────────────────────────────────────
  const {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon:  storeApplyCoupon,
    removeCoupon: storeRemoveCoupon,
    openCart,
    closeCart,
    toggleCart,
    getCartItem,
    isInCart,
    getCartSummary,
  } = useStore(
    useShallow((s) => ({
      addToCart:     s.addToCart,
      removeFromCart:s.removeFromCart,
      updateQuantity:s.updateQuantity,
      clearCart:     s.clearCart,
      applyCoupon:   s.applyCoupon,
      removeCoupon:  s.removeCoupon,
      openCart:      s.openCart,
      closeCart:     s.closeCart,
      toggleCart:    s.toggleCart,
      getCartItem:   s.getCartItem,
      isInCart:      s.isInCart,
      getCartSummary:s.getCartSummary,
    }))
  );

  // ── Derived values ────────────────────────────────────────────────────────
  const isEmpty   = cartItems.length === 0;
  const hasItems  = cartItems.length > 0;

  const freeShippingRemaining = useMemo(
    () => Math.max(0, FREE_SHIPPING_KES - cartSubtotal),
    [cartSubtotal]
  );

  const hasFreeShipping = freeShippingRemaining === 0;

  // ── Coupon helpers ────────────────────────────────────────────────────────

  // Mock coupon validator (production connects to validateCoupon API)
  const applyCoupon = useCallback(async (code) => {
    const COUPONS = {
      WELCOME10: { type: 'percentage',    value: 10 },
      SAVE50:    { type: 'fixed',         value: 50 },
      FREESHIP:  { type: 'free_shipping', value: 0  },
    };
    const upper  = code.trim().toUpperCase();
    const coupon = COUPONS[upper];
    if (coupon) {
      storeApplyCoupon({ code: upper, ...coupon });
      return { success: true };
    }
    return { success: false, error: 'Invalid coupon code' };
  }, [storeApplyCoupon]);

  const removeCoupon = useCallback(() => {
    storeRemoveCoupon();
  }, [storeRemoveCoupon]);

  // ── Format helpers ────────────────────────────────────────────────────────

  const formatTotal    = useCallback(() => formatCurrency(cartTotal,    'KES', 'en-KE'), [cartTotal]);
  const formatSubtotal = useCallback(() => formatCurrency(cartSubtotal, 'KES', 'en-KE'), [cartSubtotal]);

  return {
    // State
    items:        cartItems,
    appliedCoupon,
    isEmpty,
    hasItems,
    isCartOpen,

    // Totals
    subtotal:     cartSubtotal,
    shipping:     cartShipping,
    tax:          cartTax,
    total:        cartTotal,
    discount:     cartDiscount,
    itemCount:    cartItemCount,

    // Derived
    freeShippingRemaining,
    hasFreeShipping,

    // Actions (aliased for ergonomic API)
    addItem:       addToCart,
    removeItem:    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    openCart,
    closeCart,
    toggleCart,

    // Queries
    getItem:       getCartItem,
    isInCart,
    getCartSummary,

    // Formatters
    formatTotal,
    formatSubtotal,

    // Direct store actions for advanced use
    addToCart,
    removeFromCart,
  };
}

// ─── Sub-hooks ────────────────────────────────────────────────────────────────

/**
 * useCartItem — get a specific item by product ID.
 */
export function useCartItem(productId) {
  const cartItems = useStore((s) => s.cartItems);
  return useMemo(
    () => cartItems.find((i) => i.id === productId) || null,
    [cartItems, productId]
  );
}

/**
 * useCartCount — item count badge only (minimal re-renders).
 */
export function useCartCount() {
  return useStore((s) => s.cartItemCount);
}

/**
 * useAddToCart — lightweight hook for add-to-cart buttons.
 */
export function useAddToCart() {
  const addToCart   = useStore((s) => s.addToCart);
  const openCart    = useStore((s) => s.openCart);
  const showSuccess = useStore((s) => s.showSuccess);

  return useCallback(
    (product, quantity = 1, options = {}) => {
      const { showCart = true, notify = true } = options;
      addToCart(product, quantity);
      if (notify)    showSuccess(`${product.name} added to cart`);
      if (showCart)  openCart();
    },
    [addToCart, showSuccess, openCart]
  );
}

/**
 * useIsInCart — reactive check if a product is in cart.
 */
export function useIsInCart(productId) {
  const cartItems = useStore((s) => s.cartItems);
  return useMemo(
    () => cartItems.some((i) => i.id === productId),
    [cartItems, productId]
  );
}

export default useCart;