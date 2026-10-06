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

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ShoppingCart, ArrowRight } from "lucide-react";

import { useStore } from "@/store";
import { LogoMark } from "@/components/common/Logo";

import styles from "./ProductCard.module.css";

/**
 * Videos per tea, played in the card's photo area while the mouse is away;
 * the product photo takes over on hover.
 *
 * These are only a fallback: the video is a field on the product now, so staff
 * set it per tea in the admin (Products → a tea → Card video). A tea with no
 * video, here or in the admin, simply keeps its photo.
 */
const PRODUCT_VIDEOS = {
  "nandi-gold": "/videos/tea-prep.mp4",
  "nandi-black-tea": "/videos/tea-prep.mp4",
};

/**
 * The video set on the product in the admin, if there is one.
 */
function getProductVideo(product) {
  const value =
    product.videoUrl ||
    product.video_url ||
    product.video ||
    "";

  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

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
  const videoRef = useRef(null);

  /*
   * A video can go missing — the admin's upload lives on the server's disk,
   * and a deploy replaces that disk unless a volume is mounted. When the file
   * 404s the browser raises an error on the element and the panel would sit
   * there empty, so the card steps down: first to the video shipped with the
   * site, then to the product photo on its own.
   */
  const [deadVideos, setDeadVideos] = useState([]);

  // The photo covers the video on hover, so there is nothing to play then.
  const showPhoto = () => videoRef.current?.pause();
  const showVideo = () => {
    videoRef.current?.play().catch(() => {
      // Autoplay may be blocked; the poster (the product photo) stays.
    });
  };

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
  const video =
    [getProductVideo(product), PRODUCT_VIDEOS[slug]].find(
      (candidate) => candidate && !deadVideos.includes(candidate),
    ) || null;

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
    <article
      className={`${styles.card} ${video ? styles.cardWithVideo : ""}`}
    >
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
        className={`${styles.imageWrapper} ${video ? styles.hasVideo : ""}`}
        aria-label={`View ${name}`}
        onMouseEnter={showPhoto}
        onMouseLeave={showVideo}
        onFocus={showPhoto}
        onBlur={showVideo}
      >
        {image && video && (
          <video
            ref={videoRef}
            className={styles.video}
            src={video}
            onError={() =>
              setDeadVideos((dead) =>
                dead.includes(video) ? dead : [...dead, video],
              )
            }
            poster={image}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
          />
        )}

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