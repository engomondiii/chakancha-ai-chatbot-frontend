/**
 * src/components/products/ProductCard.jsx — Integration Phase 3
 *
 * What changed from the original:
 *  - All field names updated to handle both camelCase and snake_case variants
 *    (products.js normalizeProduct() provides both, so components are resilient)
 *  - caffeineLevel read from both caffeineLevel and caffeine_level
 *  - flavorProfile read from both flavorProfile and flavor_profile
 *  - inStock read from both inStock and in_stock
 *  - image read from image OR primary_image
 *  - category displayed from category.name (object) or category (string)
 *  - addToCart uses product fields that match cartSlice.addToCart expectations
 *  - Everything else unchanged
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Eye } from 'lucide-react';
import { useStore } from '@/store';
import { TastingNotes } from './TastingNotes';
import styles from './ProductCard.module.css';

const CAFFEINE_LABELS = {
  low:    { label: 'Low caffeine',      color: '#4A7C2C' },
  medium: { label: 'Moderate caffeine', color: '#D4A574' },
  high:   { label: 'High caffeine',     color: '#6B5544' },
};

export function ProductCard({ product, priority = false }) {
  const router      = useRouter();
  const [adding, setAdding] = useState(false);
  const addToCart   = useStore((s) => s.addToCart);
  const openCart    = useStore((s) => s.openCart);
  const showSuccess = useStore((s) => s.showSuccess);
  const isInCart    = useStore((s) => s.isInCart(product?.id));

  if (!product) return null;

  // Accept both camelCase (mock) and snake_case (backend) field names
  const name          = product.name;
  const slug          = product.slug;
  const price         = parseFloat(product.price) || 0;
  const image         = product.image || product.primary_image || null;
  const flavorProfile = product.flavorProfile || product.flavor_profile || '';
  const tastingNotes  = product.tastingNotes  || product.tasting_notes  || [];
  const caffeineLevel = product.caffeineLevel || product.caffeine_level || 'medium';
  const inStock       = product.inStock !== undefined ? product.inStock : (product.in_stock !== false);
  const featured      = product.featured || false;

  // Category: might be an object {name, slug} or a plain string
  const categoryName = product.category?.name || product.category || '';
  const caffeine     = CAFFEINE_LABELS[caffeineLevel] || CAFFEINE_LABELS.medium;

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!inStock || adding) return;
    setAdding(true);
    addToCart(product, 1);
    openCart();
    showSuccess(`${name} added to cart`);
    setTimeout(() => setAdding(false), 800);
  };

  const handleView = () => router.push(`/products/${slug}`);

  return (
    <article
      className={styles.card}
      onClick={handleView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleView()}
      aria-label={`View ${name}`}
    >
      <div className={styles.imageWrapper}>
        {image ? (
          <img src={image} alt={name} className={styles.image} loading={priority ? 'eager' : 'lazy'} />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span className={styles.placeholderEmoji}>🍃</span>
          </div>
        )}
        <div className={styles.imageBadges}>
          {featured  && <span className={styles.featuredBadge}>Featured</span>}
          {!inStock  && <span className={styles.outOfStockBadge}>Out of stock</span>}
        </div>
        <div className={styles.imageOverlay}>
          <span className={styles.quickView}><Eye size={14} /> Quick view</span>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.category}>{categoryName} tea</span>
          <span className={styles.caffeine} style={{ color: caffeine.color }}>
            {caffeine.label}
          </span>
        </div>

        <h3 className={styles.name}>{name}</h3>

        <TastingNotes flavorProfile={flavorProfile} compact />

        <div className={styles.footer}>
          <span className={styles.price}>${price.toFixed(2)}</span>
          <button
            className={`${styles.cartBtn} ${isInCart ? styles.cartBtnInCart : ''}`}
            onClick={handleAddToCart}
            disabled={!inStock || adding}
            type="button"
            aria-label={isInCart ? 'Already in cart' : `Add ${name} to cart`}
          >
            <ShoppingCart size={14} />
            {adding ? 'Adding…' : isInCart ? 'In cart' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;