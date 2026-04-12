/**
 * CartItem.jsx
 * Individual line item inside the cart drawer and cart page.
 * Shows product image, name, price, quantity stepper, and remove button.
 * Uses CSS variables throughout — no hardcoded values.
 */

'use client';

import React, { useState } from 'react';
import { Trash2, Minus, Plus } from 'lucide-react';
import { useStore } from '@/store';

export function CartItem({ item }) {
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const [removing, setRemoving]   = useState(false);

  if (!item) return null;

  const { id, name, price, image, quantity, category } = item;
  const lineTotal = (price * quantity).toFixed(2);

  const handleRemove = () => {
    setRemoving(true);
    // Small delay so the animation can play before DOM removal
    setTimeout(() => removeFromCart(id), 220);
  };

  const handleQtyDown = () => {
    if (quantity <= 1) { handleRemove(); return; }
    updateQuantity(id, quantity - 1);
  };

  const handleQtyUp = () => {
    if (quantity >= 10) return;
    updateQuantity(id, quantity + 1);
  };

  return (
    <div
      style={{
        display:          'flex',
        gap:              'var(--spacing-md)',
        padding:          'var(--spacing-md) 0',
        borderBottom:     '1px solid var(--color-border)',
        animation:        removing ? 'fadeOut 0.2s ease-out forwards' : 'none',
        opacity:          1,
      }}
    >
      {/* Product image */}
      <div
        style={{
          width:           64,
          height:          64,
          borderRadius:    'var(--radius-md)',
          overflow:        'hidden',
          backgroundColor: 'var(--color-warm-cream)',
          flexShrink:      0,
          border:          '1px solid var(--color-border)',
        }}
      >
        {image ? (
          <img
            src={image}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width:           '100%',
              height:          '100%',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              background:      'linear-gradient(135deg, #e8efe0 0%, #c8ddb8 100%)',
              fontSize:        '1.5rem',
            }}
          >
            🍃
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily:   'var(--font-sans)',
            fontSize:     11,
            fontWeight:   600,
            textTransform:'uppercase',
            letterSpacing:'0.07em',
            color:        'var(--color-muted-olive)',
            margin:       '0 0 2px',
          }}
        >
          {category} tea
        </p>

        <p
          style={{
            fontFamily:  'var(--font-display)',
            fontSize:    15,
            fontWeight:  600,
            color:       'var(--color-earth-brown)',
            margin:      '0 0 8px',
            lineHeight:  1.3,
            overflow:    'hidden',
            textOverflow:'ellipsis',
            whiteSpace:  'nowrap',
          }}
        >
          {name}
        </p>

        {/* Quantity + price row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {/* Qty stepper */}
          <div
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          0,
              border:       '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              overflow:     'hidden',
            }}
          >
            <button
              type="button"
              onClick={handleQtyDown}
              aria-label="Decrease quantity"
              style={qtyBtnStyle}
            >
              <Minus size={12} />
            </button>

            <span
              style={{
                width:      30,
                textAlign:  'center',
                fontFamily: 'var(--font-sans)',
                fontSize:   13,
                fontWeight: 600,
                color:      'var(--color-text-primary)',
                lineHeight: '28px',
                borderLeft: '1px solid var(--color-border)',
                borderRight:'1px solid var(--color-border)',
              }}
            >
              {quantity}
            </span>

            <button
              type="button"
              onClick={handleQtyUp}
              disabled={quantity >= 10}
              aria-label="Increase quantity"
              style={{ ...qtyBtnStyle, opacity: quantity >= 10 ? 0.4 : 1 }}
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Line total */}
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize:   15,
              fontWeight: 700,
              color:      'var(--color-tea-green)',
            }}
          >
            ${lineTotal}
          </span>
        </div>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={handleRemove}
        aria-label={`Remove ${name} from cart`}
        style={{
          alignSelf:        'flex-start',
          display:          'flex',
          alignItems:       'center',
          justifyContent:   'center',
          width:            28,
          height:           28,
          background:       'none',
          border:           'none',
          cursor:           'pointer',
          borderRadius:     'var(--radius-sm)',
          color:            'var(--color-text-secondary)',
          flexShrink:       0,
          transition:       'color var(--transition-fast), background-color var(--transition-fast)',
          padding:          0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-error)';
          e.currentTarget.style.backgroundColor = 'rgba(214,48,49,0.06)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-secondary)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Trash2 size={14} />
      </button>

      <style>{`
        @keyframes fadeOut {
          to { opacity: 0; transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

const qtyBtnStyle = {
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  width:           28,
  height:          28,
  background:      'none',
  border:          'none',
  cursor:          'pointer',
  color:           'var(--color-text-primary)',
  padding:         0,
};

export default CartItem;