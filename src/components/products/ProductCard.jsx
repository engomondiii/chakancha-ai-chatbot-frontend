/**
 * src/components/products/ProductCard.jsx
 *
 * Brand-aligned product card for Chakancha's two tea products:
 *  - Nandi Gold
 *  - Nandi Black
 *
 * Supports both camelCase and snake_case backend fields.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingCart, ArrowRight } from "lucide-react";

import { useStore } from "@/store";
import { LogoMark } from "@/components/common/Logo";

import styles from "./ProductCard.module.css";

/**
 * Resolve a usable image URL from normalized or raw backend data.
 */
function getProductImage(product) {
  const image =
    product?.image ||
    product?.primaryImage ||
    product?.primary_image ||
    null;

  if (typeof image === "string") {
    return image;
  }

  if (image && typeof image === "object") {
    return image.url || image.src || null;
  }

  if (Array.isArray(product?.images)) {
    const primaryImage =
      product.images.find(
        (item) =>
          item?.isPrimary === true ||
          item?.is_primary === true
      ) || product.images[0];

    if (typeof primaryImage === "string") {
      return primaryImage;
    }

    return primaryImage?.url || primaryImage?.src || null;
  }

  return null;
}

export function ProductCard({
  product,
  productNumber,
  priority = false,
}) {
  const [adding, setAdding] = useState(false);

  const addToCart = useStore((state) => state.addToCart);
  const openCart = useStore((state) => state.openCart);
  const showSuccess = useStore((state) => state.showSuccess);

  const productId = product?.id;

  const isInCart = useStore((state) =>
    state.isInCart(productId)
  );

  if (!product) return null;

  // Support both camelCase and snake_case field names.
  const name = product.name || "Chakancha Tea";
  const slug = product.slug || "";
  const price = Number.parseFloat(product.price) || 0;
  const image = getProductImage(product);

  const flavorProfile =
    product.flavorProfile ||
    product.flavor_profile ||
    "";

  const shortDescription =
    product.shortDescription ||
    product.short_description ||
    flavorProfile ||
    product.description ||
    "";

  const inStock =
    product.inStock !== undefined
      ? product.inStock
      : product.in_stock !== false;

  const productHref = slug
    ? `/products/${slug}`
    : "/products";

  const displayNumber =
    productNumber !== undefined &&
    productNumber !== null
      ? String(productNumber).padStart(2, "0")
      : null;

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!inStock || adding) return;

    setAdding(true);

    addToCart(product, 1);
    openCart();
    showSuccess(`${name} added to cart`);

    window.setTimeout(() => {
      setAdding(false);
    }, 800);
  };

  return (
    <article className={styles.card}>
      <div className={styles.content}>
        {displayNumber && (
          <span className={styles.productNumber}>
            {displayNumber}
          </span>
        )}

        <Link
          href={productHref}
          className={styles.titleLink}
          aria-label={`View ${name}`}
        >
          <h3 className={styles.name}>{name}</h3>
        </Link>

        {shortDescription && (
          <p className={styles.summary}>
            {shortDescription}
          </p>
        )}

        <div className={styles.productActions}>
          <span className={styles.price}>
            ${price.toFixed(2)}
          </span>

          <Link
            href={productHref}
            className={styles.viewLink}
          >
            View tea
            <ArrowRight
              size={14}
              aria-hidden="true"
            />
          </Link>
        </div>

        <button
          type="button"
          className={`${styles.cartBtn} ${
            isInCart ? styles.cartBtnInCart : ""
          }`}
          onClick={handleAddToCart}
          disabled={!inStock || adding}
          aria-label={
            !inStock
              ? `${name} is out of stock`
              : isInCart
                ? `${name} is already in the cart`
                : `Add ${name} to cart`
          }
        >
          <ShoppingCart
            size={15}
            aria-hidden="true"
          />

          {!inStock
            ? "Out of stock"
            : adding
              ? "Adding…"
              : isInCart
                ? "In cart"
                : "Add to cart"}
        </button>
      </div>

      <Link
        href={productHref}
        className={styles.imageWrapper}
        aria-label={`View ${name}`}
      >
        {image ? (
          <img
            src={image}
            alt={`${name} tea package`}
            className={styles.image}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            draggable="false"
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <LogoMark
              tone="dark"
              size="lg"
              clickable={false}
            />

            <span className={styles.placeholderText}>
              {name}
            </span>
          </div>
        )}

        {!inStock && (
          <span className={styles.outOfStockBadge}>
            Out of stock
          </span>
        )}
      </Link>
    </article>
  );
}

export default ProductCard;