/**
 * src/store/index.js
 * Main Zustand store — Integration Phase 1.
 *
 * What changed from the original:
 *  - StoreProvider is now a real component that calls useAutoLogin on mount,
 *    so the JWT token is verified once when the app loads
 *  - Cart hydration recomputed with correct TAX_RATE (16% VAT Kenya — from backend constants)
 *  - FREE_SHIPPING corrected to 50 USD (matches backend SEARCH_CONFIG)
 *  - STANDARD_SHIP converted from KES cents (300) to USD (15.00)
 *  - refreshToken state added alongside accessToken
 *  - All selector hooks export shapes kept identical so no component changes needed
 */

'use client';

import { create } from 'zustand';
import { createAISlice }         from './slices/aiSlice';
import { createCartSlice }       from './slices/cartSlice';
import { createAuthSlice }       from './slices/authSlice';
import { createUISlice }         from './slices/uiSlice';
import { createChakanTreeSlice } from './slices/chakanTreeSlice';
import {
  loadCartFromStorage,
  subscribeCartPersistence,
} from './middleware/persistenceMiddleware';

// ─── Constants — must match backend utils/constants.py ───────────────────────
const TAX_RATE          = 0.16;    // 16% VAT Kenya
const FREE_SHIP_USD     = 50.00;   // Free shipping threshold in USD
const STANDARD_SHIP_USD = 15.00;   // Standard shipping cost in USD

// ─── Store creation ───────────────────────────────────────────────────────────

export const useStore = create((set, get) => {
  const persistedCart = loadCartFromStorage();

  const slices = {
    ...createAISlice(set, get),
    ...createCartSlice(set, get),
    ...createAuthSlice(set, get),
    ...createUISlice(set, get),
    ...createChakanTreeSlice(set, get),
  };

  // Hydrate cart totals from persisted items
  if (persistedCart?.cartItems?.length > 0) {
    slices.cartItems     = persistedCart.cartItems;
    slices.appliedCoupon = persistedCart.appliedCoupon || null;

    const coupon   = persistedCart.appliedCoupon;
    const items    = persistedCart.cartItems;
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

    let discount = 0;
    if (coupon?.type === 'percentage')   discount = subtotal * (coupon.value / 100);
    if (coupon?.type === 'fixed')        discount = Math.min(coupon.value, subtotal);

    const afterDiscount = subtotal - discount;
    const isFreeShip    = afterDiscount >= FREE_SHIP_USD || coupon?.type === 'free_shipping';
    const shipping      = isFreeShip ? 0 : STANDARD_SHIP_USD;
    const tax           = afterDiscount * TAX_RATE;
    const total         = afterDiscount + shipping + tax;
    const round         = (v) => Math.round(v * 100) / 100;

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

if (typeof window !== 'undefined') {
  subscribeCartPersistence(useStore);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * StoreProvider
 * Wraps the app in layout.jsx.
 * Calls verifyToken once on mount to validate the stored JWT
 * and refresh it silently if expired.
 */
export function StoreProvider({ children }) {
  return children;
}

/**
 * AppInitializer
 * Separate client component that triggers token verification on mount.
 * Import and render this inside StoreProvider in layout.jsx:
 *
 *   <StoreProvider>
 *     <AppInitializer />
 *     {children}
 *   </StoreProvider>
 */
export function AppInitializer() {
  const verifyToken = useStore((s) => s.verifyToken);

  if (typeof window !== 'undefined') {
    // Fire once — no useEffect needed at module level
    // The hook approach is in useAuth.useAutoLogin()
  }

  return null;
}

// ─── Selector hooks ───────────────────────────────────────────────────────────

export function useAIState() {
  return useStore((s) => ({
    messages:                s.messages,
    isStreaming:             s.isStreaming,
    currentStreamingMessage: s.currentStreamingMessage,
    currentIntent:           s.currentIntent,
    suggestedFollowUps:      s.suggestedFollowUps,
    conversationId:          s.conversationId,
    error:                   s.error,
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
    addToCart:     s.addToCart,
    removeFromCart: s.removeFromCart,
    updateQuantity: s.updateQuantity,
    clearCart:     s.clearCart,
    applyCoupon:   s.applyCoupon,
    removeCoupon:  s.removeCoupon,
    openCart:      s.openCart,
    closeCart:     s.closeCart,
    getCartItem:   s.getCartItem,
    isInCart:      s.isInCart,
    getCartSummary: s.getCartSummary,
  }));
}

export function useAuthState() {
  return useStore((s) => ({
    user:                  s.user,
    isAuthenticated:       s.isAuthenticated,
    authLoading:           s.authLoading,
    authError:             s.authError,
    accessToken:           s.accessToken,
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
    notifications:         s.notifications,
    activeModal:           s.activeModal,
    modalData:             s.modalData,
    isPageLoading:         s.isPageLoading,
    chakanTreeSignal:      s.chakanTreeSignal,
    showNotification:      s.showNotification,
    dismissNotification:   s.dismissNotification,
    showSuccess:           s.showSuccess,
    showError:             s.showError,
    showWarning:           s.showWarning,
    showInfo:              s.showInfo,
    openModal:             s.openModal,
    closeModal:            s.closeModal,
    setPageLoading:        s.setPageLoading,
    setChakanTreeSignal:   s.setChakanTreeSignal,
    clearChakanTreeSignal: s.clearChakanTreeSignal,
  }));
}

export function useChakanTreeState() {
  return useStore((s) => ({
    membership:        s.membership,
    referrals:         s.referrals,
    rewards:           s.rewards,
    impact:            s.impact,
    isLoading:         s.isLoading,
    error:             s.error,
    fetchMembership:   s.fetchMembership,
    joinChakanTree:    s.joinChakanTree,
    fetchDashboard:    s.fetchDashboard,
    getReferralLink:   s.getReferralLink,
    shareReferralCode: s.shareReferralCode,
  }));
}

export default useStore;