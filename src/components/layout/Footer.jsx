'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Leaf, Mail } from 'lucide-react';
import styles from './Footer.module.css';

/* ─────────────────────────────────────────────────────────────────────────────
   Inline SVG social icons
   Facebook, Instagram, Twitter, Linkedin were removed from lucide-react.
   These tiny inline SVGs replace them with zero extra dependencies.
───────────────────────────────────────────────────────────────────────────── */
function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Footer Component
───────────────────────────────────────────────────────────────────────────── */
export function Footer() {
  const [email, setEmail]         = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const currentYear               = new Date().getFullYear();

  const footerLinks = {
    discover: [
      { name: 'Our Teas',      href: '/products' },
      { name: 'Origin Story',  href: '/origin' },
      { name: 'Traceability',  href: '/origin/traceability' },
      { name: 'About Us',      href: '/about' },
    ],
    impact: [
      { name: 'Living Wage',        href: '/impact' },
      { name: 'Tea Picker Stories', href: '/impact/stories' },
      { name: 'Chakan Tree',        href: '/chakan-tree' },
    ],
    shop: [
      { name: 'All Teas',      href: '/products' },
      { name: 'Gift Sets',     href: '/products?category=gifts' },
      { name: 'Subscriptions', href: '/account/subscriptions' },
    ],
    support: [
      { name: 'Account',  href: '/account' },
      { name: 'Orders',   href: '/account/orders' },
      { name: 'Shipping', href: '/help/shipping' },
      { name: 'Contact',  href: '/contact' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook',  href: 'https://facebook.com/chakancha',         Icon: IconFacebook  },
    { name: 'Instagram', href: 'https://instagram.com/chakancha',        Icon: IconInstagram },
    { name: 'X',         href: 'https://twitter.com/chakancha',          Icon: IconX         },
    { name: 'LinkedIn',  href: 'https://linkedin.com/company/chakancha', Icon: IconLinkedIn  },
  ];

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: connect to newsletter API
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>

        {/* ── Top ─────────────────────────────────────────────────────── */}
        <div className={styles.top}>

          {/* Brand */}
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.brand}>
              <Leaf size={18} className={styles.brandIcon} />
              <span className={styles.brandName}>Chakancha</span>
            </Link>
            <p className={styles.tagline}>
              From the tea fields of Nandi Hills to your cup.
              <br />Ask anything.
            </p>
            <div className={styles.social}>
              {socialLinks.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label={`Chakancha on ${name}`}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <div className={styles.linksGrid}>
            {[
              { title: 'Discover', links: footerLinks.discover },
              { title: 'Impact',   links: footerLinks.impact   },
              { title: 'Shop',     links: footerLinks.shop     },
              { title: 'Support',  links: footerLinks.support  },
            ].map(({ title, links }) => (
              <div key={title} className={styles.linkColumn}>
                <h4 className={styles.columnTitle}>{title}</h4>
                <ul className={styles.linkList}>
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className={styles.footerLink}>
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter */}
          <div className={styles.newsletterColumn}>
            <h4 className={styles.columnTitle}>Stay Connected</h4>
            <p className={styles.newsletterText}>
              New teas, origin stories, and exclusive offers — direct to your inbox.
            </p>
            {subscribed ? (
              <div className={styles.subscribedMsg}>✓ You&apos;re on the list!</div>
            ) : (
              <form className={styles.newsletterForm} onSubmit={handleSubscribe}>
                <div className={styles.inputWrapper}>
                  <Mail size={15} className={styles.inputIcon} />
                  <input
                    type="email"
                    placeholder="Your email"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className={styles.submitButton}>
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Bottom ──────────────────────────────────────────────────── */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} Chakancha Global. All rights reserved.
          </p>
          <div className={styles.legalLinks}>
            <Link href="/privacy" className={styles.legalLink}>Privacy Policy</Link>
            <span className={styles.separator}>·</span>
            <Link href="/terms"   className={styles.legalLink}>Terms of Service</Link>
            <span className={styles.separator}>·</span>
            <Link href="/cookies" className={styles.legalLink}>Cookie Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}