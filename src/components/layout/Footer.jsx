/**
 * src/components/layout/Footer.jsx
 *
 * Chakancha Brand Manual aligned footer.
 */

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";

import api from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

import styles from "./Footer.module.css";

function IconFacebook() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconX() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const currentYear = new Date().getFullYear();

  const footerLinks = {
    discover: [
      { name: "Order Teas", href: "/products" },
      { name: "Origin Story", href: "/origin" },
      { name: "Traceability", href: "/origin/traceability" },
      { name: "About Us", href: "/about" },
    ],
    impact: [
      { name: "Living Wage", href: "/impact" },
      { name: "Tea Picker Stories", href: "/impact/stories" },
      { name: "Chakan Tree", href: "/chakan-tree" },
    ],
    shop: [
      { name: "All Teas", href: "/products" },
      { name: "Gift Sets", href: "/products?category=gifts" },
      {
        name: "Subscriptions",
        href: "/account/subscriptions",
      },
    ],
    support: [
      { name: "Account", href: "/account" },
      { name: "Orders", href: "/account/orders" },
      { name: "Shipping", href: "/help/shipping" },
      {
        name: "contact@chakancha.com",
        href: "mailto:contact@chakancha.com",
        external: true,
      },
    ],
  };

  const socialLinks = [
    {
      name: "Facebook",
      href: "https://facebook.com/chakancha",
      Icon: IconFacebook,
    },
    {
      name: "Instagram",
      href: "https://instagram.com/chakancha",
      Icon: IconInstagram,
    },
    {
      name: "X",
      href: "https://twitter.com/chakancha",
      Icon: IconX,
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/company/chakancha",
      Icon: IconLinkedIn,
    },
  ];

  const handleSubscribe = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await api.post(ENDPOINTS.NEWSLETTER.SUBSCRIBE, {
        email: normalizedEmail,
        source: "footer",
      });

      setSubscribed(true);
      setEmail("");
    } catch (error) {
      const message =
        error?.data?.errors?.email?.[0] ||
        error?.data?.message ||
        error?.message ||
        "Could not subscribe. Please try again.";

      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          {/* Brand */}
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.brand} aria-label="Chakancha home">
              <Image
                src="/images/icons/chakancha-lockup-white.svg"
                alt="Chakancha"
                width={88}
                height={40}
                className={styles.brandLogo}
              />
            </Link>

            <p className={styles.tagline}>
              From the tea fields of Nandi Hills to your cup.
            </p>

            <a
              href="mailto:contact@chakancha.com"
              className={styles.contactLink}
            >
              <Mail size={14} aria-hidden="true" />
              <span>contact@chakancha.com</span>
            </a>

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

          {/* Navigation */}
          <div className={styles.linksGrid}>
            {[
              {
                title: "Discover",
                links: footerLinks.discover,
              },
              {
                title: "Impact",
                links: footerLinks.impact,
              },
              {
                title: "Shop",
                links: footerLinks.shop,
              },
              {
                title: "Support",
                links: footerLinks.support,
              },
            ].map(({ title, links }) => (
              <div key={title} className={styles.linkColumn}>
                <h4 className={styles.columnTitle}>{title}</h4>

                <ul className={styles.linkList}>
                  {links.map((link) => (
                    <li key={link.name}>
                      {link.external ? (
                        <a href={link.href} className={styles.footerLink}>
                          {link.name}
                        </a>
                      ) : (
                        <Link href={link.href} className={styles.footerLink}>
                          {link.name}
                        </Link>
                      )}
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
              New teas, origin stories, and updates from Chakancha—direct to
              your inbox.
            </p>

            {subscribed ? (
              <div
                className={styles.subscribedMsg}
                role="status"
                aria-live="polite"
              >
                You&apos;re on the list.
              </div>
            ) : (
              <form
                className={styles.newsletterForm}
                onSubmit={handleSubscribe}
              >
                <div className={styles.inputWrapper}>
                  <Mail
                    size={15}
                    className={styles.inputIcon}
                    aria-hidden="true"
                  />

                  <input
                    type="email"
                    name="email"
                    placeholder="Your email"
                    aria-label="Email address"
                    autoComplete="email"
                    className={styles.input}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setErrorMsg("");
                    }}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting || !email.trim()}
                >
                  {isSubmitting ? "Subscribing…" : "Subscribe"}
                </button>

                {errorMsg && (
                  <p className={styles.errorMsg} role="alert">
                    {errorMsg}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} Chakancha Global. All rights reserved.
          </p>

          <div className={styles.legalLinks}>
            <Link href="/privacy" className={styles.legalLink}>
              Privacy Policy
            </Link>

            <span className={styles.separator} aria-hidden="true">
              ·
            </span>

            <Link href="/terms" className={styles.legalLink}>
              Terms of Service
            </Link>

            <span className={styles.separator} aria-hidden="true">
              ·
            </span>

            <Link href="/cookies" className={styles.legalLink}>
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
