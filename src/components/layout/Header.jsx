/**
 * src/components/layout/Header.jsx — Integration Phase 4
 *
 * What changed from the original:
 *  - Auth state connected: reads isAuthenticated + user from useAuth()
 *  - Account icon: shows User avatar with initials when logged in,
 *    plain User icon when logged out — both link to /account
 *  - Cart badge: reads cartItemCount from Zustand store and shows badge
 *  - CartDrawer import added so it renders at root level from the Header
 *    (avoids needing to add it to every page separately)
 *  - scrolled/transparent logic unchanged
 *  - Mobile menu unchanged
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Menu, X, Leaf } from 'lucide-react';
import { useStore }  from '@/store';
import { useAuth }   from '@/lib/hooks/useAuth';
import { CartDrawer } from '@/components/cart/CartDrawer';
import styles from './Header.module.css';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled,       setScrolled]       = useState(false);

  const { user, isAuthenticated } = useAuth();
  const cartItemCount             = useStore((s) => s.cartItemCount);
  const openCart                  = useStore((s) => s.openCart);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: '/products',    label: 'Our Teas' },
    { href: '/origin',      label: 'Origin' },
    { href: '/impact',      label: 'Impact' },
    { href: '/chakan-tree', label: 'Chakan Tree' },
    { href: '/about',       label: 'About' },
  ];

  // Derive initials for avatar
  const initials = isAuthenticated && user
    ? (user.name || user.email || '')
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?'
    : null;

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : styles.transparent}`}>
        <div className={styles.container}>

          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <Leaf size={22} className={styles.logoIcon} />
            <span className={styles.logoText}>Chakancha</span>
          </Link>

          {/* Desktop Nav */}
          <nav className={styles.desktopNav} aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className={styles.actions}>
            {/* Cart button with badge */}
            <button
              className={styles.iconButton}
              onClick={openCart}
              aria-label={`Shopping cart${cartItemCount > 0 ? `, ${cartItemCount} items` : ''}`}
              type="button"
              style={{ position: 'relative' }}
            >
              <ShoppingCart size={20} />
              {cartItemCount > 0 && (
                <span style={{
                  position:        'absolute',
                  top:             -4,
                  right:           -4,
                  width:           16,
                  height:          16,
                  borderRadius:    '50%',
                  backgroundColor: 'var(--color-tea-green)',
                  color:           'white',
                  fontSize:        9,
                  fontWeight:      700,
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  fontFamily:      'var(--font-sans)',
                  lineHeight:      1,
                }}>
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </button>

            {/* Account button — avatar when logged in, icon when logged out */}
            <Link href="/account" className={styles.iconButton} aria-label="Account">
              {isAuthenticated && initials ? (
                <div style={{
                  width:           28,
                  height:          28,
                  borderRadius:    '50%',
                  backgroundColor: 'var(--color-tea-green)',
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  fontSize:        11,
                  fontWeight:      700,
                  color:           'white',
                  fontFamily:      'var(--font-sans)',
                  lineHeight:      1,
                }}>
                  {initials}
                </div>
              ) : (
                <User size={20} />
              )}
            </Link>

            <button
              className={`${styles.iconButton} ${styles.menuToggle}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              type="button"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Cart Drawer — rendered once here so it's always available */}
      <CartDrawer />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileMenuOpen(false)}>
          <nav
            className={styles.mobileMenu}
            onClick={(e) => e.stopPropagation()}
            aria-label="Mobile navigation"
          >
            <div className={styles.mobileMenuHeader}>
              <Link href="/" className={styles.logo} onClick={() => setMobileMenuOpen(false)}>
                <Leaf size={20} className={styles.logoIcon} />
                <span className={styles.logoText}>Chakancha</span>
              </Link>
              <button
                className={styles.iconButton}
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                type="button"
              >
                <X size={22} />
              </button>
            </div>

            <div className={styles.mobileNavLinks}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.mobileNavLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className={styles.mobileActions}>
              <button
                className={styles.mobileActionLink}
                onClick={() => { openCart(); setMobileMenuOpen(false); }}
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <ShoppingCart size={18} />
                Cart {cartItemCount > 0 && `(${cartItemCount})`}
              </button>
              <Link href="/account" className={styles.mobileActionLink} onClick={() => setMobileMenuOpen(false)}>
                <User size={18} />
                {isAuthenticated ? (user?.name?.split(' ')[0] || 'Account') : 'Account'}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}