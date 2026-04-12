'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Menu, X, Leaf } from 'lucide-react';
import styles from './Header.module.css';

/**
 * Header Component — Minimal floating navigation
 * Transparent over the hero, solid white when scrolled
 */
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
            <Link href="/cart" className={styles.iconButton} aria-label="Shopping cart">
              <ShoppingCart size={20} />
            </Link>
            <Link href="/account" className={styles.iconButton} aria-label="Account">
              <User size={20} />
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
              <Link href="/cart" className={styles.mobileActionLink} onClick={() => setMobileMenuOpen(false)}>
                <ShoppingCart size={18} /> Cart
              </Link>
              <Link href="/account" className={styles.mobileActionLink} onClick={() => setMobileMenuOpen(false)}>
                <User size={18} /> Account
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}