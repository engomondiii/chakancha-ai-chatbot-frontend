/**
 * Cart types
 */

export type CouponType = 'percentage' | 'fixed' | 'free_shipping';

export interface CartItem {
  id:       string;
  name:     string;
  slug:     string;
  price:    number;
  image:    string;
  category: string;
  quantity: number;
  inStock:  boolean;
}

export interface AppliedCoupon {
  code:  string;
  type:  CouponType;
  value: number;
  label?: string;
}

export interface CartState {
  cartItems:     CartItem[];
  appliedCoupon: AppliedCoupon | null;
  cartSubtotal:  number;
  cartTax:       number;
  cartShipping:  number;
  cartTotal:     number;
  cartDiscount:  number;
  cartItemCount: number;
  isCartOpen:    boolean;
}

export interface CartSummary {
  items:                 CartItem[];
  subtotal:              number;
  discount:              number;
  shipping:              number;
  tax:                   number;
  total:                 number;
  itemCount:             number;
  appliedCoupon:         AppliedCoupon | null;
  freeShippingRemaining: number;
  hasFreeShipping:       boolean;
  currency:              string;
}