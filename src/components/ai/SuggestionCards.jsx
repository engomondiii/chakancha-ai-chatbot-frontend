/**
 * SuggestionCards.jsx
 * Shows product cards and follow-up question chips inside the conversation.
 * Triggered by the AI after relevant intents (discovery, products, etc.).
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ExternalLink, ArrowRight } from 'lucide-react';
import { useStore } from '@/store';
import styles from './SuggestionCards.module.css';

// ─── Product suggestion card ──────────────────────────────────────────────────

function ProductSuggestionCard({ product }) {
  const router   = useRouter();
  const addToCart = useStore((s) => s.addToCart);
  const openCart  = useStore((s) => s.openCart);
  const showSuccess = useStore((s) => s.showSuccess);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    openCart();
    showSuccess(`${product.name} added to cart`);
  };

  const handleView = () => {
    router.push(`/products/${product.slug}`);
  };

  return (
    <div className={styles.productCard} onClick={handleView} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleView()}
    >
      {/* Image placeholder / actual image */}
      <div className={styles.productImage}>
        {product.image ? (
          <img src={product.image} alt={product.name} className={styles.productImg} />
        ) : (
          <div className={styles.productImagePlaceholder}>
            <span className={styles.productImageEmoji}>🍃</span>
          </div>
        )}
        {product.featured && (
          <span className={styles.featuredBadge}>Featured</span>
        )}
      </div>

      <div className={styles.productInfo}>
        <div>
          <p className={styles.productCategory}>{product.category}</p>
          <h4 className={styles.productName}>{product.name}</h4>
          <p className={styles.productDesc}>
            {product.flavorProfile || product.description?.slice(0, 60) + '…'}
          </p>
        </div>

        <div className={styles.productFooter}>
          <span className={styles.productPrice}>${product.price?.toFixed(2)}</span>

          <button
            className={styles.addToCartBtn}
            onClick={handleAddToCart}
            type="button"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={14} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Follow-up chips ───────────────────────────────────────────────────────────

function FollowUpChips({ followUps, onSelect }) {
  if (!followUps?.length) return null;

  return (
    <div className={styles.followUpsRow}>
      <span className={styles.followUpsLabel}>Continue with:</span>
      <div className={styles.chips}>
        {followUps.map((text, i) => (
          <button
            key={i}
            className={styles.chip}
            onClick={() => onSelect(text)}
            type="button"
          >
            {text}
            <ArrowRight size={12} className={styles.chipArrow} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * SuggestionCards
 * Shown beneath an AI message when relevant products + follow-ups are available.
 *
 * @param {Array}    products   - Product objects to suggest
 * @param {Array}    followUps  - Follow-up question strings
 * @param {function} onFollowUp - Called when a follow-up chip is clicked
 */
export function SuggestionCards({ products = [], followUps = [], onFollowUp }) {
  const router = useRouter();

  if (!products.length && !followUps.length) return null;

  return (
    <div className={styles.wrapper}>
      {/* Product suggestions */}
      {products.length > 0 && (
        <div className={styles.productsSection}>
          <div className={styles.productCards}>
            {products.map((product) => (
              <ProductSuggestionCard key={product.id} product={product} />
            ))}
          </div>

          {products.length >= 2 && (
            <button
              className={styles.viewAllBtn}
              onClick={() => router.push('/products')}
              type="button"
            >
              View all teas
              <ExternalLink size={13} />
            </button>
          )}
        </div>
      )}

      {/* Follow-up suggestions */}
      <FollowUpChips followUps={followUps} onSelect={onFollowUp} />
    </div>
  );
}

export default SuggestionCards;