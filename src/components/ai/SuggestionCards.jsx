/**
 * src/components/ai/SuggestionCards.jsx — Integration Phase 2
 *
 * What changed from the original:
 *  - Products now come from two sources:
 *      1. productCards from aiSlice (populated by the 'products' SSE event)
 *      2. featuredProducts prop fallback (from useProducts hook)
 *  - Product shape updated to match the backend serializer:
 *      product.flavor_profile  (was product.flavorProfile)
 *      product.primary_image   (was product.image)
 *      product.caffeine_level  (was product.caffeineLev)
 *  - addToCart cart context updated to match backend CartItem shape
 *  - Everything else unchanged
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ExternalLink, ArrowRight } from 'lucide-react';
import { useStore } from '@/store';
import { useProductCards } from '@/lib/hooks/useAI';
import styles from './SuggestionCards.module.css';

// ─── Product card ──────────────────────────────────────────────────────────────

function ProductSuggestionCard({ product }) {
  const router     = useRouter();
  const addToCart  = useStore((s) => s.addToCart);
  const openCart   = useStore((s) => s.openCart);
  const showSuccess = useStore((s) => s.showSuccess);

  // Backend serializer field names
  const imageUrl  = product.primary_image || product.image   || null;
  const snippet   = product.flavor_profile || product.description || '';
  const price     = parseFloat(product.price) || 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(
      {
        id:          product.id,
        name:        product.name,
        slug:        product.slug,
        price,
        image:       imageUrl,
        category:    product.category?.name || product.category || '',
      },
      1
    );
    openCart?.();
    showSuccess?.(`${product.name} added to cart`);
  };

  const handleView = () => {
    router.push(`/products/${product.slug}`);
  };

  return (
    <div
      className={styles.productCard}
      onClick={handleView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleView()}
    >
      <div className={styles.productImage}>
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className={styles.productImg} />
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
          <p className={styles.productCategory}>
            {product.category?.name || product.category || 'Tea'}
          </p>
          <h4 className={styles.productName}>{product.name}</h4>
          <p className={styles.productDesc}>
            {snippet.length > 70 ? snippet.slice(0, 67) + '…' : snippet}
          </p>
        </div>

        <div className={styles.productFooter}>
          <span className={styles.productPrice}>${price.toFixed(2)}</span>
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

// ─── Follow-up chips ──────────────────────────────────────────────────────────

function FollowUpChips({ followUps, onSelect }) {
  if (!followUps?.length) return null;
  return (
    <div className={styles.followUpsRow}>
      <span className={styles.followUpsLabel}>Continue with:</span>
      <div className={styles.chips}>
        {followUps.map((text, i) => (
          <button key={i} className={styles.chip} onClick={() => onSelect(text)} type="button">
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
 *
 * Products shown come from:
 *   1. productCards in Zustand (populated by backend 'products' SSE event)
 *   2. products prop fallback (from useFeaturedProducts hook)
 *
 * @param {Array}    products    - Fallback product list
 * @param {Array}    followUps   - Follow-up question strings
 * @param {function} onFollowUp  - Called when follow-up chip is clicked
 */
export function SuggestionCards({ products = [], followUps = [], onFollowUp }) {
  const router       = useRouter();
  // Phase 2: prefer backend-sent product cards over fallback
  const backendCards = useProductCards();
  const displayProducts = backendCards.length > 0 ? backendCards : products;

  if (!displayProducts.length && !followUps.length) return null;

  return (
    <div className={styles.wrapper}>
      {displayProducts.length > 0 && (
        <div className={styles.productsSection}>
          <div className={styles.productCards}>
            {displayProducts.slice(0, 2).map((product) => (
              <ProductSuggestionCard key={product.id || product.slug} product={product} />
            ))}
          </div>

          {displayProducts.length >= 2 && (
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

      <FollowUpChips followUps={followUps} onSelect={onFollowUp} />
    </div>
  );
}

export default SuggestionCards;