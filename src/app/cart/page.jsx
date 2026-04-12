/**
 * src/app/cart/page.jsx
 * Full shopping cart page at /cart.
 * Shows all items, coupon input, totals, and checkout CTA.
 */

'use client';

import React      from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useStore }    from '@/store';
import { CartItem }    from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { EmptyCart }   from '@/components/cart/EmptyCart';

export default function CartPage() {
  const router     = useRouter();
  const cartItems  = useStore((s) => s.cartItems);
  const cartItemCount = useStore((s) => s.cartItemCount);
  const clearCart  = useStore((s) => s.clearCart);
  const showSuccess = useStore((s) => s.showSuccess);
  const isEmpty    = cartItems.length === 0;

  const handleCheckout = () => router.push('/checkout');

  const handleClearCart = () => {
    clearCart();
    showSuccess('Cart cleared');
  };

  return (
    <div
      style={{
        maxWidth:   'var(--max-width-content)',
        margin:     '0 auto',
        padding:    'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)',
        minHeight:  '100vh',
      }}
    >
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-2xl)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', padding: 0 }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-tea-green)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          >
            <ArrowLeft size={16} /> Continue shopping
          </button>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize:   'var(--font-size-h1)',
              fontWeight: 600,
              color:      'var(--color-earth-brown)',
              margin:     0,
              display:    'flex',
              alignItems: 'center',
              gap:        'var(--spacing-sm)',
            }}
          >
            <ShoppingBag size={28} color="var(--color-tea-green)" />
            Cart
            {cartItemCount > 0 && (
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'var(--color-text-secondary)', marginLeft: 4 }}>
                ({cartItemCount} {cartItemCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </h1>
        </div>

        {!isEmpty && (
          <button
            type="button"
            onClick={handleClearCart}
            style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '6px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-error)'; e.currentTarget.style.color = 'var(--color-error)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            Clear cart
          </button>
        )}
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <EmptyCart />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--spacing-3xl)', alignItems: 'start' }}>
          {/* Items list */}
          <div
            style={{
              backgroundColor: 'white',
              border:          '1px solid var(--color-border)',
              borderRadius:    'var(--radius-xl)',
              padding:         'var(--spacing-lg)',
            }}
          >
            {cartItems.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          {/* Summary panel */}
          <div
            style={{
              position:        'sticky',
              top:             'calc(72px + var(--spacing-lg))',
              backgroundColor: 'var(--color-warm-cream)',
              border:          '1px solid var(--color-border)',
              borderRadius:    'var(--radius-xl)',
              padding:         'var(--spacing-xl)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 var(--spacing-lg)' }}>
              Order Summary
            </h2>
            <CartSummary onCheckout={handleCheckout} />
          </div>
        </div>
      )}

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}