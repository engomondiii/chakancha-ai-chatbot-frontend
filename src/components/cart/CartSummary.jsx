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

import React, { useState, useEffect } from 'react';
import { Tag, X, Check, ChevronRight } from 'lucide-react';
import { useStore } from '@/store';
import { useCart }  from '@/lib/hooks/useCart';
import { formatCurrency } from '@/lib/utils/currency';
import { syncCartToServer, fetchServerCart } from '@/lib/api/cart';

const FREE_SHIPPING_THRESHOLD = 50; // USD

export function CartSummary({ onCheckout, compact = false }) {
  const [couponInput,  setCouponInput]  = useState('');
  const [couponStatus, setCouponStatus] = useState(null);
  const [couponMsg,    setCouponMsg]    = useState('');
  const [applying,     setApplying]     = useState(false);
  const [quote,        setQuote]        = useState(null);

  const cartItems     = useStore((s) => s.cartItems);
  const cartSubtotal  = useStore((s) => s.cartSubtotal);
  const cartShipping  = useStore((s) => s.cartShipping);
  const cartTax       = useStore((s) => s.cartTax);
  const cartTotal     = useStore((s) => s.cartTotal);
  const cartDiscount  = useStore((s) => s.cartDiscount);
  const appliedCoupon = useStore((s) => s.appliedCoupon);
  const removeCoupon  = useStore((s) => s.removeCoupon);
  const isAuthenticated  = useStore((s) => s.isAuthenticated);
  const shippingCountry  = useStore((s) => s.shippingCountry);

  // ── Backend quote — the single pricing authority ─────────────────────────
  // quote_cart() computes subtotal, discount, shipping, tax and total, and is
  // the same function behind /checkout, PayPal initialisation and
  // create_order(). The cart must not re-derive any of it in React: the local
  // estimate taxes the POST-discount amount while the backend taxes the
  // PRE-discount subtotal, so the two disagree the moment a discount exists.
  //
  // An eligible referred buyer's 5% Chakan Tree benefit is applied
  // automatically from Membership.referred_by, with no code to enter.
  useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      if (!isAuthenticated || cartItems.length === 0) {
        setQuote(null);
        return;
      }
      try {
        // NOTE ON MULTI-DEVICE CARTS (existing behaviour, documented not changed):
        // syncCartToServer() makes THIS browser's cart authoritative over the
        // server-side cart — a cart built on another device is replaced. This
        // is what checkout has always done; pricing the cart here simply makes
        // it happen earlier. Redesigning multi-device merge is out of scope.
        await syncCartToServer(cartItems);
        const serverCart = await fetchServerCart(shippingCountry);
        if (!cancelled) setQuote(serverCart || null);
      } catch {
        if (!cancelled) setQuote(null);   // fall back to the local estimate
      }
    }

    loadQuote();
    return () => { cancelled = true; };
  }, [isAuthenticated, cartItems, shippingCountry, appliedCoupon]);

  // Displayed figures: backend quote when available, local estimate otherwise.
  //
  // The referral discount is shown as soon as the backend returns it: it depends
  // only on the product subtotal and the buyer's referral eligibility, neither
  // of which needs a shipping country. Shipping and tax DO need one, so until
  // the buyer supplies it they are labelled as calculated at checkout and no
  // final payable total is implied. /checkout remains the authoritative quote.
  const countryKnown = Boolean(shippingCountry);
  const num       = (v, fallback) => (v === undefined || v === null ? fallback : Number(v));
  const dSubtotal = quote ? num(quote.subtotal,      cartSubtotal) : cartSubtotal;
  const dDiscount = quote ? num(quote.discount,      cartDiscount) : cartDiscount;
  const dShipping = quote ? num(quote.shipping_cost, cartShipping) : cartShipping;
  const dTax      = quote ? num(quote.tax,           cartTax)      : cartTax;
  const dTotal    = quote ? num(quote.total,         cartTotal)    : cartTotal;
  const dLabel    = quote ? (quote.discount_label || 'Discount')
                          : `Discount${appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}`;

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
      // LEGACY: suggested WELCOME10 / SAVE50 / FREESHIP — mock codes that do
      // not exist in production. Referred customers need no code at all: the
      // 5% Chakan Tree benefit is applied automatically at checkout.
      setCouponMsg(result.error || 'Invalid coupon code.');
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
        <TotalRow label="Subtotal"  value={fmt(dSubtotal)} />
        {dDiscount > 0 && (
          <TotalRow label={dLabel} value={`−${fmt(dDiscount)}`} valueColor="var(--color-success)" />
        )}

        {countryKnown ? (
          <>
            <TotalRow
              label="Shipping"
              value={dShipping === 0 ? 'Free' : fmt(dShipping)}
              valueColor={dShipping === 0 ? 'var(--color-success)' : undefined}
            />
            <TotalRow label="Tax" value={dTax > 0 ? fmt(dTax) : 'Calculated at checkout'} small />
            <TotalRow label="Total" value={fmt(dTotal)} bold />
          </>
        ) : (
          <>
            <TotalRow label="Shipping" value="Calculated at checkout" small />
            <TotalRow label="Tax"      value="Calculated at checkout" small />
            <TotalRow label="Estimated total" value={fmt(dSubtotal - dDiscount)} bold />
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12,
              color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
              Shipping and tax are calculated at checkout once your delivery
              country is known. Your final total is shown before payment.
            </p>
          </>
        )}
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