/**
 * ProductCard.jsx
 * Tea product card for the product catalog grid.
 * Warm-cream card with hover elevation, category badge, tasting notes, and CTA.
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
  const isInCart    = useStore((s) => s.isInCart(product.id));

  if (!product) return null;

  const { name, slug, category, price, image, flavorProfile,
          tastingNotes, caffeineLevel, inStock, featured } = product;

  const caffeine = CAFFEINE_LABELS[caffeineLevel] || CAFFEINE_LABELS.medium;

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
    <article className={styles.card} onClick={handleView} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleView()}
      aria-label={`View ${name}`}
    >
      {/* Image */}
      <div className={styles.imageWrapper}>
        {image ? (
          <img src={image} alt={name} className={styles.image} loading={priority ? 'eager' : 'lazy'} />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span className={styles.placeholderEmoji}>🍃</span>
          </div>
        )}

        {/* Overlaid badges */}
        <div className={styles.imageBadges}>
          {featured && <span className={styles.featuredBadge}>Featured</span>}
          {!inStock  && <span className={styles.outOfStockBadge}>Out of stock</span>}
        </div>

        {/* Quick-view on hover */}
        <div className={styles.imageOverlay}>
          <span className={styles.quickView}>
            <Eye size={14} /> Quick view
          </span>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.category}>{category} tea</span>
          <span
            className={styles.caffeine}
            style={{ color: caffeine.color }}
          >
            {caffeine.label}
          </span>
        </div>

        <h3 className={styles.name}>{name}</h3>

        <TastingNotes flavorProfile={flavorProfile} compact />

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.price}>${price?.toFixed(2)}</span>

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