/**
 * store/index.js
 * Main Zustand store for Chakancha Global.
 * Combines all slices into a single store with cart persistence.
 */

'use client';

import { create } from 'zustand';
import { createAISlice }        from './slices/aiSlice';
import { createCartSlice }      from './slices/cartSlice';
import { createAuthSlice }      from './slices/authSlice';
import { createUISlice }        from './slices/uiSlice';
import { createChakanTreeSlice } from './slices/chakanTreeSlice';
import {
  loadCartFromStorage,
  subscribeCartPersistence,
} from './middleware/persistenceMiddleware';

// ─── Store creation ───────────────────────────────────────────────────────────

export const useStore = create((set, get) => {
  // Hydrate cart from localStorage before initial state
  const persistedCart = loadCartFromStorage();

  // Merge all slices
  const slices = {
    ...createAISlice(set, get),
    ...createCartSlice(set, get),
    ...createAuthSlice(set, get),
    ...createUISlice(set, get),
    ...createChakanTreeSlice(set, get),
  };

  // If we have a persisted cart, override cartItems and appliedCoupon,
  // and recompute totals by replaying addToCart
  if (persistedCart?.cartItems?.length > 0) {
    slices.cartItems     = persistedCart.cartItems;
    slices.appliedCoupon = persistedCart.appliedCoupon || null;

    // Recompute totals from persisted items
    const FREE_SHIPPING   = 5000;
    const STANDARD_SHIP   = 300;
    const TAX_RATE        = 0.16;
    const coupon          = persistedCart.appliedCoupon;
    const items           = persistedCart.cartItems;

    const subtotal  = items.reduce((s, i) => s + i.price * i.quantity, 0);
    let discount    = 0;
    if (coupon?.type === 'percentage') discount = subtotal * (coupon.value / 100);
    if (coupon?.type === 'fixed')      discount = Math.min(coupon.value, subtotal);

    const afterDiscount = subtotal - discount;
    const isFree        = afterDiscount >= FREE_SHIPPING || coupon?.type === 'free_shipping';
    const shipping      = isFree ? 0 : STANDARD_SHIP;
    const tax           = afterDiscount * TAX_RATE;
    const total         = afterDiscount + shipping + tax;

    const round = (v) => Math.round(v * 100) / 100;

    slices.cartSubtotal  = round(subtotal);
    slices.cartTax       = round(tax);
    slices.cartShipping  = round(shipping);
    slices.cartTotal     = round(total);
    slices.cartDiscount  = round(discount);
    slices.cartItemCount = items.reduce((s, i) => s + i.quantity, 0);
  }

  return slices;
});

// ─── Cart persistence subscription ───────────────────────────────────────────

// Subscribe after store is created so we auto-save on every cart change
if (typeof window !== 'undefined') {
  subscribeCartPersistence(useStore);
}

// ─── Selector hooks (convenience) ─────────────────────────────────────────────

/**
 * Select a specific slice of state.
 * Prevents unnecessary re-renders from unrelated state updates.
 *
 * @example
 * const { messages, sendMessage } = useAIState();
 */

export function useAIState() {
  return useStore((s) => ({
    messages:                s.messages,
    isStreaming:             s.isStreaming,
    currentStreamingMessage: s.currentStreamingMessage,
    currentIntent:           s.currentIntent,
    suggestedFollowUps:      s.suggestedFollowUps,
    conversationId:          s.conversationId,
    error:                   s.error,
    // Actions
    sendMessage:             s.sendMessage,
    clearConversation:       s.clearConversation,
    retryLastMessage:        s.retryLastMessage,
    selectFollowUp:          s.selectFollowUp,
    initFromQuery:           s.initFromQuery,
    deleteMessage:           s.deleteMessage,
    editMessage:             s.editMessage,
    getConversationContext:  s.getConversationContext,
  }));
}

export function useCartState() {
  return useStore((s) => ({
    cartItems:     s.cartItems,
    appliedCoupon: s.appliedCoupon,
    cartSubtotal:  s.cartSubtotal,
    cartTax:       s.cartTax,
    cartShipping:  s.cartShipping,
    cartTotal:     s.cartTotal,
    cartDiscount:  s.cartDiscount,
    cartItemCount: s.cartItemCount,
    isCartOpen:    s.isCartOpen,
    // Actions
    addToCart:     s.addToCart,
    removeFromCart:s.removeFromCart,
    updateQuantity:s.updateQuantity,
    clearCart:     s.clearCart,
    applyCoupon:   s.applyCoupon,
    removeCoupon:  s.removeCoupon,
    openCart:      s.openCart,
    closeCart:     s.closeCart,
    getCartItem:   s.getCartItem,
    isInCart:      s.isInCart,
    getCartSummary:s.getCartSummary,
  }));
}

export function useAuthState() {
  return useStore((s) => ({
    user:                  s.user,
    isAuthenticated:       s.isAuthenticated,
    authLoading:           s.authLoading,
    authError:             s.authError,
    accessToken:           s.accessToken,
    // Actions
    login:                 s.login,
    signup:                s.signup,
    logout:                s.logout,
    updateProfile:         s.updateProfile,
    changePassword:        s.changePassword,
    requestPasswordReset:  s.requestPasswordReset,
    resetPassword:         s.resetPassword,
    refreshAccessToken:    s.refreshAccessToken,
    verifyToken:           s.verifyToken,
    clearAuthError:        s.clearAuthError,
  }));
}

export function useUIState() {
  return useStore((s) => ({
    notifications:       s.notifications,
    activeModal:         s.activeModal,
    modalData:           s.modalData,
    isPageLoading:       s.isPageLoading,
    chakanTreeSignal:    s.chakanTreeSignal,
    // Actions
    showNotification:    s.showNotification,
    dismissNotification: s.dismissNotification,
    showSuccess:         s.showSuccess,
    showError:           s.showError,
    showWarning:         s.showWarning,
    showInfo:            s.showInfo,
    openModal:           s.openModal,
    closeModal:          s.closeModal,
    setPageLoading:      s.setPageLoading,
    setChakanTreeSignal: s.setChakanTreeSignal,
    clearChakanTreeSignal: s.clearChakanTreeSignal,
  }));
}

export function useChakanTreeState() {
  return useStore((s) => ({
    membership:         s.membership,
    referrals:          s.referrals,
    rewards:            s.rewards,
    impact:             s.impact,
    isLoading:          s.isLoading,
    error:              s.error,
    // Actions
    fetchMembership:    s.fetchMembership,
    joinChakanTree:     s.joinChakanTree,
    fetchDashboard:     s.fetchDashboard,
    getReferralLink:    s.getReferralLink,
    shareReferralCode:  s.shareReferralCode,
  }));
}

// ─── Provider wrapper ─────────────────────────────────────────────────────────

/**
 * StoreProvider
 * Wrap your app (or layout.jsx) with this to enable Zustand.
 * Since Zustand doesn't require a Provider by default, this is a
 * no-op wrapper kept for future server-component compatibility.
 */
export function StoreProvider({ children }) {
  return children;
}

export default useStore;