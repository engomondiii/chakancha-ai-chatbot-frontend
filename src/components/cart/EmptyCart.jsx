/**
 * EmptyCart.jsx
 * Empty state shown when the cart has no items.
 * Provides navigation back to products and a chat suggestion.
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Leaf } from 'lucide-react';

export function EmptyCart({ onClose }) {
  const router = useRouter();

  const handleBrowse = () => {
    onClose?.();
    router.push('/products');
  };

  const handleAsk = () => {
    onClose?.();
    router.push('/chat?q=Which%20tea%20should%20I%20try%20first%3F');
  };

  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        'var(--spacing-3xl) var(--spacing-xl)',
        textAlign:      'center',
        gap:            'var(--spacing-lg)',
        flex:           1,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width:           72,
          height:          72,
          borderRadius:    '50%',
          backgroundColor: 'var(--color-warm-cream)',
          border:          '1px solid var(--color-border)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
        }}
      >
        <ShoppingBag size={28} color="var(--color-mist-gray)" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize:   'var(--font-size-h3)',
            fontWeight: 600,
            color:      'var(--color-earth-brown)',
            margin:     0,
          }}
        >
          Your cart is empty
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize:   'var(--font-size-body)',
            color:      'var(--color-text-secondary)',
            margin:     0,
            lineHeight: 1.6,
          }}
        >
          Discover single-origin teas from Nandi Hills, Kenya.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', width: '100%', maxWidth: 260 }}>
        <button
          type="button"
          onClick={handleBrowse}
          style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            gap:             6,
            width:           '100%',
            padding:         '12px',
            backgroundColor: 'var(--color-tea-green)',
            color:           'white',
            border:          'none',
            borderRadius:    'var(--radius-md)',
            fontFamily:      'var(--font-sans)',
            fontSize:        14,
            fontWeight:      600,
            cursor:          'pointer',
            transition:      'background-color var(--transition-fast)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tea-green-light)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tea-green)'}
        >
          Browse teas
        </button>

        <button
          type="button"
          onClick={handleAsk}
          style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            gap:             6,
            width:           '100%',
            padding:         '12px',
            backgroundColor: 'transparent',
            color:           'var(--color-tea-green)',
            border:          '1px solid var(--color-tea-green)',
            borderRadius:    'var(--radius-md)',
            fontFamily:      'var(--font-sans)',
            fontSize:        14,
            fontWeight:      500,
            cursor:          'pointer',
            transition:      'background-color var(--transition-fast)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(45,80,22,0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Leaf size={14} /> Ask the AI for a recommendation
        </button>
      </div>
    </div>
  );
}

export default EmptyCart;