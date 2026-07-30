/**
 * src/components/layout/Header.jsx
 *
 * What changed from previous version:
 *  - Added usePathname() to detect the current route
 *  - Logo/Chakancha name now shows as "active" (highlighted) when on the home page /
 *  - navLinks active state driven by pathname so the correct link is highlighted
 *  - navLinkActive CSS class applied to the matching nav link
 *  - All other logic unchanged
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, User, Menu, X, LogIn } from 'lucide-react';
import { LogoLockup, LogoMark } from '../common/Logo';
import { useStore }   from '@/store';
import { useAuth }    from '@/lib/hooks/useAuth';
import { CartDrawer } from '@/components/cart/CartDrawer';
import styles from './Header.module.css';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled,       setScrolled]       = useState(false);

  const pathname = usePathname();

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
    { href: '/products',    label: 'Order Teas' },
    { href: '/origin',      label: 'Origin' },
    { href: '/impact',      label: 'Impact' },
    { href: '/chakan-tree', label: 'Chakan Tree' },
    { href: '/about',       label: 'About' },
  ];

  // Determine which nav link is active
  const isNavActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Home page = no nav link active, logo is highlighted
  const isHome = pathname === '/';

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

  const firstName = isAuthenticated && user
    ? (user.name || '').trim().split(/\s+/)[0] || 'Account'
    : null;

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : styles.transparent}`}>
        <div className={styles.container}>

          {/* Logo — highlighted when on home page */}
         <Link
  href="/"
  className={`${styles.logo} ${isHome ? styles.logoActive : ''}`}
  aria-label="Chakancha home"
>
  <LogoLockup
    tone={scrolled ? 'dark' : 'white'}
    size={155}
    clickable={false}
    className={styles.LogoMark}
  />
</Link>

          {/* Desktop Nav */}
          <nav className={styles.desktopNav} aria-label="Main navigation">
            {navLinks.map((link) => {
              const active = isNavActive(link.href);
              const isShop = link.href === '/products';
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    styles.navLink,
                    isShop  ? styles.navLinkShop   : '',
                    active  ? styles.navLinkActive  : '',
                  ].filter(Boolean).join(' ')}
                >
                {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className={styles.actions}>

            {/* Cart */}
            <button
              className={styles.iconButton}
              onClick={openCart}
              aria-label={`Shopping cart${cartItemCount > 0 ? `, ${cartItemCount} items` : ''}`}
              type="button"
              title="View cart"
              style={{ position: 'relative' }}
            >
              <ShoppingCart size={20} />
              <span className={styles.actionLabel}>Cart</span>
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

            {/* Account / Login */}
            <Link
              href={isAuthenticated ? '/account' : '/login'}
              className={styles.iconButton}
              aria-label={isAuthenticated ? 'My Account' : 'Login'}
              title={isAuthenticated ? `Hi, ${firstName}` : 'Login to your account'}
            >
              {isAuthenticated && initials ? (
                <>
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
                    flexShrink:      0,
                  }}>
                    {initials}
                  </div>
                  <span className={styles.actionLabel}>{firstName}</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span className={styles.actionLabel} style={{ fontWeight: 600 }}>Login</span>
                </>
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

      <CartDrawer />

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileMenuOpen(false)}>
          <nav
            className={styles.mobileMenu}
            onClick={(e) => e.stopPropagation()}
            aria-label="Mobile navigation"
          >
            <div className={styles.mobileMenuHeader}>
              <Link href="/" className={styles.logo} onClick={() => setMobileMenuOpen(false)}>
                <LogoMark size={20} className={styles.logoIcon} />
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
              {/* Home link at top of mobile menu */}
              <Link
                href="/"
                className={`${styles.mobileNavLink} ${isHome ? styles.mobileNavLinkActive : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                🏠 Home
              </Link>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.mobileNavLink} ${isNavActive(link.href) ? styles.mobileNavLinkActive : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.href === '/products' ? 'Shop Teas' : link.label}
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
              <Link
                href={isAuthenticated ? '/account' : '/login'}
                className={styles.mobileActionLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                {isAuthenticated ? (
                  <><User size={18} /> {firstName || 'Account'}</>
                ) : (
                  <><LogIn size={18} /> Login</>
                )}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}