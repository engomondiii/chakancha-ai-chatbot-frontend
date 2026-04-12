/**
 * CartDrawer.jsx
 * Slide-in cart drawer panel triggered by isCartOpen from cartSlice.
 * Fixed overlay on the right side, scrollable item list, sticky summary footer.
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter }   from 'next/navigation';
import { X, ShoppingCart } from 'lucide-react';
import { useStore }    from '@/store';
import { CartItem }    from './CartItem';
import { CartSummary } from './CartSummary';
import { EmptyCart }   from './EmptyCart';
import styles          from './CartDrawer.module.css';

export function CartDrawer() {
  const router       = useRouter();
  const isCartOpen   = useStore((s) => s.isCartOpen);
  const closeCart    = useStore((s) => s.closeCart);
  const cartItems    = useStore((s) => s.cartItems);
  const cartItemCount = useStore((s) => s.cartItemCount);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isCartOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeCart(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeCart]);

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  if (!isCartOpen) return null;

  const isEmpty = cartItems.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <ShoppingCart size={18} color="var(--color-tea-green)" />
            <h2 className={styles.title}>
              Cart
              {cartItemCount > 0 && (
                <span className={styles.count}>{cartItemCount}</span>
              )}
            </h2>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeCart}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {isEmpty ? (
            <EmptyCart onClose={closeCart} />
          ) : (
            <>
              {/* Items */}
              <div className={styles.items}>
                {cartItems.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>

              {/* Summary — sticky footer */}
              <div className={styles.summary}>
                <CartSummary onCheckout={handleCheckout} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default CartDrawer;