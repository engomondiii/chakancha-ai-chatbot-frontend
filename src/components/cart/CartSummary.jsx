/**
 * src/components/cart/CartSummary.jsx — Integration Phase 3
 *
 * What changed from the original:
 *  - handleApplyCoupon() calls useCart().applyCoupon() which now hits the real
 *    backend (POST /api/v1/checkout/coupon/) with fallback to mock coupons
 *  - Currency display: USD (was KES)
 *  - FREE_SHIPPING_THRESHOLD: $50 USD (was 5,000 KES)
 *  - fmt() uses USD formatting
 *  - Everything else unchanged
 */

'use client';

import React, { useState } from 'react';
import { Tag, X, Check, ChevronRight } from 'lucide-react';
import { useStore } from '@/store';
import { useCart }  from '@/lib/hooks/useCart';
import { formatCurrency } from '@/lib/utils/currency';

const FREE_SHIPPING_THRESHOLD = 50; // USD

export function CartSummary({ onCheckout, compact = false }) {
  const [couponInput,  setCouponInput]  = useState('');
  const [couponStatus, setCouponStatus] = useState(null);
  const [couponMsg,    setCouponMsg]    = useState('');
  const [applying,     setApplying]     = useState(false);

  const cartSubtotal  = useStore((s) => s.cartSubtotal);
  const cartShipping  = useStore((s) => s.cartShipping);
  const cartTax       = useStore((s) => s.cartTax);
  const cartTotal     = useStore((s) => s.cartTotal);
  const cartDiscount  = useStore((s) => s.cartDiscount);
  const appliedCoupon = useStore((s) => s.appliedCoupon);
  const removeCoupon  = useStore((s) => s.removeCoupon);

  // Use the hook's applyCoupon which calls the real backend
  const { applyCoupon } = useCart();

  const remaining       = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);
  const hasFreeShipping = remaining === 0;
  const progressPercent = Math.min(100, (cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplying(true);
    setCouponStatus(null);

    const result = await applyCoupon(couponInput.trim());

    if (result.success) {
      setCouponStatus('success');
      setCouponMsg(`"${couponInput.trim().toUpperCase()}" applied`);
      setCouponInput('');
    } else {
      setCouponStatus('error');
      setCouponMsg(result.error || 'Invalid coupon code. Try WELCOME10, SAVE50, or FREESHIP.');
    }

    setApplying(false);
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponStatus(null);
    setCouponMsg('');
  };

  const fmt = (v) => formatCurrency(v, 'USD', 'en-US');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>

      {/* Free shipping progress */}
      {!compact && (
        <div style={{
          backgroundColor: hasFreeShipping ? 'rgba(74,124,44,0.08)' : 'var(--color-warm-cream)',
          border: `1px solid ${hasFreeShipping ? 'rgba(74,124,44,0.2)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={smallTextStyle}>
              {hasFreeShipping
                ? '✓ You qualify for free shipping!'
                : `$${remaining.toFixed(2)} more for free shipping`}
            </span>
          </div>
          <div style={{ height: 4, backgroundColor: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progressPercent}%`,
              backgroundColor: hasFreeShipping ? 'var(--color-tea-green)' : 'var(--color-sunrise-gold)',
              borderRadius: 2, transition: 'width var(--transition-standard) var(--ease-out)',
            }} />
          </div>
        </div>
      )}

      {/* Coupon input */}
      {!appliedCoupon ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Tag size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={couponInput}
              onChange={(e) => { setCouponInput(e.target.value); setCouponStatus(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
              placeholder="Coupon code"
              style={{
                width: '100%', padding: '8px 12px 8px 32px',
                fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-primary)',
                backgroundColor: 'white',
                border: `1.5px solid ${couponStatus === 'error' ? 'var(--color-error)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)', outline: 'none', textTransform: 'uppercase',
              }}
            />
          </div>
          <button type="button" onClick={handleApplyCoupon}
            disabled={!couponInput.trim() || applying}
            style={{
              padding: '8px 16px', backgroundColor: 'var(--color-tea-green)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
              cursor: couponInput.trim() && !applying ? 'pointer' : 'not-allowed',
              opacity: couponInput.trim() && !applying ? 1 : 0.5, whiteSpace: 'nowrap',
            }}>
            {applying ? '…' : 'Apply'}
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: 'rgba(74,124,44,0.07)', border: '1px solid rgba(74,124,44,0.18)',
          borderRadius: 'var(--radius-md)', padding: '8px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={14} color="var(--color-success)" />
            <span style={{ ...smallTextStyle, color: 'var(--color-tea-green)', fontWeight: 600 }}>
              {appliedCoupon.code}
            </span>
          </div>
          <button type="button" onClick={handleRemoveCoupon}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-secondary)', display: 'flex', padding: 2 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {couponMsg && (
        <p style={{ ...smallTextStyle,
          color: couponStatus === 'error' ? 'var(--color-error)' : 'var(--color-success)',
          margin: '-8px 0 0' }}>
          {couponMsg}
        </p>
      )}

      {/* Totals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8,
        borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
        <TotalRow label="Subtotal"  value={fmt(cartSubtotal)} />
        {cartDiscount > 0 && (
          <TotalRow label="Discount" value={`−${fmt(cartDiscount)}`} valueColor="var(--color-success)" />
        )}
        <TotalRow
          label="Shipping"
          value={cartShipping === 0 ? 'Free' : fmt(cartShipping)}
          valueColor={cartShipping === 0 ? 'var(--color-success)' : undefined}
        />
        <TotalRow label="Tax" value={cartTax > 0 ? fmt(cartTax) : 'Calculated at checkout'} small />
        <TotalRow label="Total" value={fmt(cartTotal)} bold />
      </div>

      {onCheckout && (
        <button type="button" onClick={onCheckout}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', padding: '14px', backgroundColor: 'var(--color-sunrise-gold)',
            color: 'var(--color-tea-green)', border: 'none', borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            transition: 'background-color var(--transition-fast), transform var(--transition-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c49060'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-sunrise-gold)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Proceed to checkout <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

function TotalRow({ label, value, bold = false, small = false, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: small ? 12 : 14, color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: small ? 12 : 14,
        fontWeight: bold ? 700 : 500,
        color: valueColor || (bold ? 'var(--color-earth-brown)' : 'var(--color-text-primary)') }}>
        {value}
      </span>
    </div>
  );
}

const smallTextStyle = { fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)' };

export default CartSummary;