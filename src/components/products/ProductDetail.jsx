/**
 * src/components/products/ProductDetail.jsx
 *
 * Brand-aligned detail view for:
 *  - Nandi Gold
 *  - Nandi Black
 *
 * Supports camelCase and snake_case backend fields.
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  MessageCircle,
  ChevronLeft,
  Heart,
} from "lucide-react";

import { useStore } from "@/store";

import { ProductGallery } from "./ProductGallery";
import { TastingNotes } from "./TastingNotes";
import { BrewingGuide } from "./BrewingGuide";
import { OriginStory } from "./OriginStory";

import styles from "./ProductDetail.module.css";

/**
 * Convert normalized or raw backend image data into URL strings.
 *
 * Supported formats:
 *  - "/images/product.jpg"
 *  - { url: "/images/product.jpg" }
 *  - { src: "/images/product.jpg" }
 */
function normalizeProductImages(product) {
  const rawImages = Array.isArray(product?.images)
    ? [...product.images]
    : [];

  /*
   * Keep the primary image first, followed by sort order.
   * This has no effect when images are already URL strings.
   */
  rawImages.sort((a, b) => {
    if (
      typeof a === "string" ||
      typeof b === "string"
    ) {
      return 0;
    }

    const aPrimary =
      a?.isPrimary === true ||
      a?.is_primary === true;

    const bPrimary =
      b?.isPrimary === true ||
      b?.is_primary === true;

    if (aPrimary !== bPrimary) {
      return aPrimary ? -1 : 1;
    }

    const aOrder =
      a?.sortOrder ??
      a?.sort_order ??
      0;

    const bOrder =
      b?.sortOrder ??
      b?.sort_order ??
      0;

    return aOrder - bOrder;
  });

  const imageUrls = rawImages
    .map((image) => {
      if (typeof image === "string") {
        return image;
      }

      return image?.url || image?.src || null;
    })
    .filter(Boolean);

  /*
   * Fall back to a primary-image field when product.images
   * is missing or empty.
   */
  if (imageUrls.length === 0) {
    const primaryImage =
      product?.image ||
      product?.primaryImage ||
      product?.primary_image ||
      null;

    if (typeof primaryImage === "string") {
      imageUrls.push(primaryImage);
    } else if (primaryImage) {
      const primaryUrl =
        primaryImage.url ||
        primaryImage.src ||
        null;

      if (primaryUrl) {
        imageUrls.push(primaryUrl);
      }
    }
  }

  return [...new Set(imageUrls)];
}

export function ProductDetail({ product }) {
  const router = useRouter();

  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const addToCart = useStore(
    (state) => state.addToCart,
  );

  const openCart = useStore(
    (state) => state.openCart,
  );

  const showSuccess = useStore(
    (state) => state.showSuccess,
  );

  const productId = product?.id;

  const isInCart = useStore((state) =>
    state.isInCart(productId),
  );

  if (!product) return null;

  // Support camelCase and snake_case backend fields.
  const name =
    product.name ||
    "Chakancha Tea";

  const category =
    product.category ||
    null;

  const categoryName =
    category?.name ||
    category ||
    "";

  const price =
    Number.parseFloat(product.price) || 0;

  const description =
    product.description ||
    product.longDescription ||
    product.long_description ||
    "";

  const flavorProfile =
    product.flavorProfile ||
    product.flavor_profile ||
    "";

  const tastingNotes =
    product.tastingNotes ||
    product.tasting_notes ||
    [];

  const inStock =
    product.inStock !== undefined
      ? product.inStock
      : product.in_stock !== false;

  const certificationValue =
    product.certification ||
    product.certificationName ||
    product.certification_name ||
    "";

  const certification =
    typeof certificationValue === "string"
      ? certificationValue
      : certificationValue?.name || "";

  /*
   * Only make the living-wage claim when a dedicated boolean field
   * explicitly verifies it.
   */
  const livingWageVerified =
    product.livingWageVerified === true ||
    product.living_wage_verified === true;

  const priceNote =
    product.priceNote ||
    product.price_note ||
    "";

  const imageUrls =
    normalizeProductImages(product);

  const handleAddToCart = () => {
    if (!inStock || adding) return;

    setAdding(true);

    addToCart(product, qty);
    openCart();

    showSuccess(
      `${name} × ${qty} added to cart`,
    );

    window.setTimeout(() => {
      setAdding(false);
    }, 800);
  };

  const handleAskAI = () => {
    const question =
      `Tell me about ${name}, including how to brew it and which recipes I can make with it.`;

    router.push(
      `/chat?q=${encodeURIComponent(question)}`,
    );
  };

  const decreaseQuantity = () => {
    setQty((current) =>
      Math.max(1, current - 1),
    );
  };

  const increaseQuantity = () => {
    setQty((current) =>
      Math.min(10, current + 1),
    );
  };

  return (
    <main className={styles.page}>
      <button
        type="button"
        className={styles.backBtn}
        onClick={() => router.back()}
      >
        <ChevronLeft
          size={16}
          aria-hidden="true"
        />

        All teas
      </button>

      <div className={styles.layout}>
        {/* ── Product gallery ─────────────────────────────────────────────── */}
        <div className={styles.galleryCol}>
          <ProductGallery
            images={imageUrls}
            productName={name}
          />
        </div>

        {/* ── Product information ─────────────────────────────────────────── */}
        <div className={styles.infoCol}>
          {(categoryName ||
            livingWageVerified ||
            certification) && (
            <div className={styles.meta}>
              {categoryName && (
                <span className={styles.category}>
                  {categoryName}
                </span>
              )}

              {livingWageVerified ? (
                <span className={styles.cert}>
                  Living wage verified
                </span>
              ) : certification ? (
                <span className={styles.cert}>
                  {certification}
                </span>
              ) : null}
            </div>
          )}

          <h1 className={styles.name}>
            {name}
          </h1>

          <TastingNotes
            notes={tastingNotes}
            flavorProfile={flavorProfile}
          />

          {description && (
            <p className={styles.description}>
              {description}
            </p>
          )}

          {/* ── Price and quantity ────────────────────────────────────────── */}
          <div className={styles.purchaseRow}>
            <div className={styles.priceBlock}>
              <span className={styles.price}>
                ${price.toFixed(2)}
              </span>

              {priceNote && (
                <span className={styles.priceNote}>
                  {priceNote}
                </span>
              )}

              {!inStock && (
                <span className={styles.priceNote}>
                  Currently unavailable
                </span>
              )}
            </div>

            <div
              className={styles.qtyControl}
              aria-label="Product quantity"
            >
              <button
                type="button"
                className={styles.qtyBtn}
                onClick={decreaseQuantity}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>

              <span
                className={styles.qtyValue}
                aria-live="polite"
              >
                {qty}
              </span>

              <button
                type="button"
                className={styles.qtyBtn}
                onClick={increaseQuantity}
                disabled={qty >= 10}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* ── Purchasing actions ────────────────────────────────────────── */}
          <div className={styles.ctas}>
            <button
              type="button"
              className={`${styles.addToCart} ${
                isInCart
                  ? styles.addToCartInCart
                  : ""
              }`}
              onClick={handleAddToCart}
              disabled={!inStock || adding}
            >
              <ShoppingCart
                size={18}
                aria-hidden="true"
              />

              {!inStock
                ? "Out of stock"
                : adding
                  ? "Adding…"
                  : isInCart
                    ? "Add another"
                    : "Add to cart"}
            </button>

            <button
              type="button"
              className={styles.wishlistBtn}
              onClick={() =>
                setWishlisted(
                  (current) => !current,
                )
              }
              aria-pressed={wishlisted}
              aria-label={
                wishlisted
                  ? `Remove ${name} from wishlist`
                  : `Add ${name} to wishlist`
              }
            >
              <Heart
                size={18}
                fill={
                  wishlisted
                    ? "var(--color-accent-muted-gold)"
                    : "none"
                }
                color={
                  wishlisted
                    ? "var(--color-accent-muted-gold)"
                    : "var(--color-text-muted)"
                }
                aria-hidden="true"
              />
            </button>
          </div>

          {/* ── AI assistance ─────────────────────────────────────────────── */}
          <button
            type="button"
            className={styles.askAI}
            onClick={handleAskAI}
          >
            <MessageCircle
              size={16}
              aria-hidden="true"
            />

            Ask Chakancha about this tea
          </button>

          {/* ── Product preparation and source ────────────────────────────── */}
          <BrewingGuide product={product} />

          <OriginStory product={product} />
        </div>
      </div>
    </main>
  );
}

export default ProductDetail;