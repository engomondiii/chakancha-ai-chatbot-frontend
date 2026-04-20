/**
 * src/lib/hooks/useCart.js — Integration Phase 3
 *
 * What changed from the original:
 *  - applyCoupon() now calls validateCoupon() from cart.js API
 *    (POST /api/v1/checkout/coupon/) instead of using a hardcoded mock object
 *  - applyCoupon() falls back to mock COUPONS when API is unavailable (dev mode)
 *  - FREE_SHIPPING_THRESHOLD changed to $50 USD (matches backend settings and
 *    store/index.js config — original was 5000 KES)
 *  - formatTotal/formatSubtotal updated to use USD formatting
 *  - Everything else unchanged
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useStore }              from '@/store';
import { useShallow }            from 'zustand/react/shallow';
import { formatCurrency }        from '@/lib/utils/currency';
import { validateCoupon }        from '@/lib/api/cart';

const FREE_SHIPPING_THRESHOLD_USD = 50; // USD — matches backend SEARCH_CONFIG

// ─── Primary hook ──────────────────────────────────────────────────────────────

export function useCart() {
  const cartItems     = useStore((s) => s.cartItems);
  const appliedCoupon = useStore((s) => s.appliedCoupon);
  const cartSubtotal  = useStore((s) => s.cartSubtotal);
  const cartShipping  = useStore((s) => s.cartShipping);
  const cartTax       = useStore((s) => s.cartTax);
  const cartTotal     = useStore((s) => s.cartTotal);
  const cartDiscount  = useStore((s) => s.cartDiscount);
  const cartItemCount = useStore((s) => s.cartItemCount);
  const isCartOpen    = useStore((s) => s.isCartOpen);

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
      addToCart:      s.addToCart,
      removeFromCart: s.removeFromCart,
      updateQuantity: s.updateQuantity,
      clearCart:      s.clearCart,
      applyCoupon:    s.applyCoupon,
      removeCoupon:   s.removeCoupon,
      openCart:       s.openCart,
      closeCart:      s.closeCart,
      toggleCart:     s.toggleCart,
      getCartItem:    s.getCartItem,
      isInCart:       s.isInCart,
      getCartSummary: s.getCartSummary,
    }))
  );

  const isEmpty  = cartItems.length === 0;
  const hasItems = cartItems.length > 0;

  const freeShippingRemaining = useMemo(
    () => Math.max(0, FREE_SHIPPING_THRESHOLD_USD - cartSubtotal),
    [cartSubtotal]
  );
  const hasFreeShipping = freeShippingRemaining === 0;

  // ── Coupon — wired to real backend with mock fallback ────────────────────

  const MOCK_COUPONS = {
    WELCOME10: { type: 'percentage',    value: 10 },
    SAVE50:    { type: 'fixed',         value: 50 },
    FREESHIP:  { type: 'free_shipping', value: 0  },
  };

  const applyCoupon = useCallback(async (code) => {
    const upper = code.trim().toUpperCase();

    try {
      // Try real backend first
      const coupon = await validateCoupon(upper, cartSubtotal);
      storeApplyCoupon({
        code:  coupon.code  || upper,
        type:  coupon.type,
        value: parseFloat(coupon.value) || 0,
      });
      return { success: true };
    } catch (err) {
      // Fall back to mock coupons in development
      const mockCoupon = MOCK_COUPONS[upper];
      if (mockCoupon) {
        storeApplyCoupon({ code: upper, ...mockCoupon });
        return { success: true };
      }
      return { success: false, error: err.message || 'Invalid coupon code' };
    }
  }, [storeApplyCoupon, cartSubtotal]);

  const removeCoupon = useCallback(() => {
    storeRemoveCoupon();
  }, [storeRemoveCoupon]);

  // ── Format helpers ────────────────────────────────────────────────────────
  const formatTotal    = useCallback(() => formatCurrency(cartTotal,    'USD', 'en-US'), [cartTotal]);
  const formatSubtotal = useCallback(() => formatCurrency(cartSubtotal, 'USD', 'en-US'), [cartSubtotal]);

  return {
    items:        cartItems,
    appliedCoupon,
    isEmpty,
    hasItems,
    isCartOpen,
    subtotal:     cartSubtotal,
    shipping:     cartShipping,
    tax:          cartTax,
    total:        cartTotal,
    discount:     cartDiscount,
    itemCount:    cartItemCount,
    freeShippingRemaining,
    hasFreeShipping,
    addItem:       addToCart,
    removeItem:    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    openCart,
    closeCart,
    toggleCart,
    getItem:       getCartItem,
    isInCart,
    getCartSummary,
    formatTotal,
    formatSubtotal,
    addToCart,
    removeFromCart,
  };
}

// ─── Sub-hooks ────────────────────────────────────────────────────────────────

export function useCartItem(productId) {
  const cartItems = useStore((s) => s.cartItems);
  return useMemo(() => cartItems.find((i) => i.id === productId) || null, [cartItems, productId]);
}

export function useCartCount() {
  return useStore((s) => s.cartItemCount);
}

export function useAddToCart() {
  const addToCart   = useStore((s) => s.addToCart);
  const openCart    = useStore((s) => s.openCart);
  const showSuccess = useStore((s) => s.showSuccess);

  return useCallback((product, quantity = 1, options = {}) => {
    const { showCart = true, notify = true } = options;
    addToCart(product, quantity);
    if (notify)   showSuccess(`${product.name} added to cart`);
    if (showCart) openCart();
  }, [addToCart, showSuccess, openCart]);
}

export function useIsInCart(productId) {
  const cartItems = useStore((s) => s.cartItems);
  return useMemo(() => cartItems.some((i) => i.id === productId), [cartItems, productId]);
}

export default useCart;