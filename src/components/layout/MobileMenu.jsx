/**
 * src/components/layout/MobileMenu.jsx — Integration Phase 4
 *
 * What changed from the original:
 *  - Replaced `import { Link } from '@/components/common/Link'` with
 *    Next.js `import NextLink from 'next/link'` — same fix as Navigation.jsx
 *  - NextLink used directly instead of wrapping buttons (cleaner pattern)
 *  - Everything else unchanged
 */

'use client';

import React from 'react';
import NextLink from 'next/link';
import { Navigation } from './Navigation';
import { X, ShoppingCart, User } from 'lucide-react';

export function MobileMenu({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 'var(--z-modal-backdrop)', animation: 'fadeIn 0.3s ease-out',
        }}
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '400px',
          backgroundColor: 'var(--color-soft-white)', zIndex: 'var(--z-modal)',
          display: 'flex', flexDirection: 'column',
          animation: 'slideInRight 0.3s ease-out', boxShadow: 'var(--shadow-2xl)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)',
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'var(--font-weight-semibold)', fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            Menu
          </h2>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)' }} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-lg)' }}>
          <Navigation mobile onLinkClick={onClose} />

          <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: 'var(--spacing-xl) 0' }} />

          {/* Secondary Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <NextLink
              href="/cart"
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
                width: '100%', padding: 'var(--spacing-md)',
                textDecoration: 'none', fontSize: '16px',
                fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <ShoppingCart size={20} />
              <span>Shopping Cart</span>
            </NextLink>

            <NextLink
              href="/account"
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
                width: '100%', padding: 'var(--spacing-md)',
                textDecoration: 'none', fontSize: '16px',
                fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <User size={20} />
              <span>My Account</span>
            </NextLink>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ padding: 'var(--spacing-lg)', borderTop: '1px solid var(--color-border)' }}>
          <NextLink
            href="/chakan-tree/join"
            onClick={onClose}
            style={{
              display: 'block', width: '100%', padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-sunrise-gold)', color: 'var(--color-tea-green)',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '16px', fontWeight: 'var(--font-weight-semibold)',
              textAlign: 'center', textDecoration: 'none',
            }}
          >
            Join Chakan Tree
          </NextLink>
        </div>
      </div>
    </>
  );
}

export default MobileMenu;