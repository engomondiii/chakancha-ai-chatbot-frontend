/**
 * src/components/products/ProductDetail.jsx — Integration Phase 3
 *
 * What changed from the original:
 *  - All fields read via both camelCase and snake_case aliases
 *    (normalizeProduct() in products.js provides both)
 *  - images for ProductGallery: extracts URL array from images[] objects
 *    since backend returns [{url, is_primary, sort_order}]
 *  - tastingNotes: reads from both tastingNotes and tasting_notes
 *  - inStock: reads from both inStock and in_stock
 *  - Everything else unchanged
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, MessageCircle, ChevronLeft, Heart } from 'lucide-react';
import { useStore }       from '@/store';
import { ProductGallery } from './ProductGallery';
import { TastingNotes }   from './TastingNotes';
import { BrewingGuide }   from './BrewingGuide';
import { OriginStory }    from './OriginStory';
import styles             from './ProductDetail.module.css';

export function ProductDetail({ product }) {
  const router      = useRouter();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const addToCart   = useStore((s) => s.addToCart);
  const openCart    = useStore((s) => s.openCart);
  const showSuccess = useStore((s) => s.showSuccess);
  const isInCart    = useStore((s) => s.isInCart(product?.id));
  const sendMessage = useStore((s) => s.sendMessage);

  if (!product) return null;

  // Accept both camelCase and snake_case from normalizeProduct()
  const name          = product.name;
  const category      = product.category;
  const price         = parseFloat(product.price) || 0;
  const description   = product.description || '';
  const flavorProfile = product.flavorProfile || product.flavor_profile || '';
  const tastingNotes  = product.tastingNotes  || product.tasting_notes  || [];
  const inStock       = product.inStock !== undefined ? product.inStock : (product.in_stock !== false);
  const certification = product.certification || '';

  // Extract image URLs: backend returns [{url,...}] objects; normalizeProduct extracts to strings
  const imageUrls = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : [];

  // Category name display
  const categoryName = category?.name || category || '';

  const handleAddToCart = async () => {
    if (!inStock || adding) return;
    setAdding(true);
    addToCart(product, qty);
    openCart();
    showSuccess(`${name} × ${qty} added to cart`);
    setTimeout(() => setAdding(false), 800);
  };

  const handleAskAI = () => {
    router.push(`/chat?q=${encodeURIComponent(`Tell me more about ${name}`)}`);
  };

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => router.back()} type="button">
        <ChevronLeft size={16} /> All teas
      </button>

      <div className={styles.layout}>
        <div className={styles.galleryCol}>
          <ProductGallery images={imageUrls} productName={name} />
        </div>

        <div className={styles.infoCol}>
          <div className={styles.meta}>
            <span className={styles.category}>{categoryName} tea</span>
            {certification && (
              <span className={styles.cert}>✓ Living wage verified</span>
            )}
          </div>

          <h1 className={styles.name}>{name}</h1>

          <TastingNotes notes={tastingNotes} flavorProfile={flavorProfile} />

          <p className={styles.description}>{description}</p>

          <div className={styles.purchaseRow}>
            <div className={styles.priceBlock}>
              <span className={styles.price}>${price.toFixed(2)}</span>
              <span className={styles.priceNote}>Free shipping over $50</span>
            </div>
            <div className={styles.qtyControl}>
              <button type="button" className={styles.qtyBtn}
                onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
              <span className={styles.qtyValue}>{qty}</span>
              <button type="button" className={styles.qtyBtn}
                onClick={() => setQty((q) => Math.min(10, q + 1))} aria-label="Increase quantity">+</button>
            </div>
          </div>

          <div className={styles.ctas}>
            <button
              className={`${styles.addToCart} ${isInCart ? styles.addToCartInCart : ''}`}
              onClick={handleAddToCart}
              disabled={!inStock || adding}
              type="button"
            >
              <ShoppingCart size={18} />
              {!inStock ? 'Out of stock' : adding ? 'Adding…' : isInCart ? 'In cart' : 'Add to cart'}
            </button>
            <button className={styles.wishlistBtn} onClick={() => setWishlisted((w) => !w)}
              type="button" aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
              <Heart size={18} fill={wishlisted ? 'var(--color-sunrise-gold)' : 'none'}
                color={wishlisted ? 'var(--color-sunrise-gold)' : 'var(--color-text-secondary)'} />
            </button>
          </div>

          <button className={styles.askAI} onClick={handleAskAI} type="button">
            <MessageCircle size={15} />
            Ask our AI about this tea
          </button>

          <BrewingGuide product={product} />
          <OriginStory  product={product} />
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;