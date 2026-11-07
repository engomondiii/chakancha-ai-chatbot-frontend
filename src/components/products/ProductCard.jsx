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

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingCart, ArrowRight } from "lucide-react";

import { useStore } from "@/store";
import { LogoMark } from "@/components/common/Logo";

import styles from "./ProductCard.module.css";

/**
 * The video set on this tea in the admin, if there is one.
 *
 * There is no list of videos in this file and there should never be one
 * again. Staff set the clip per tea (Products, a tea, Card video) and it is
 * stored with the product, so a tea with no video simply shows its photo.
 * A hardcoded map cannot tell those two cases apart, and the one that used
 * to live here quietly gave two teas the same clip for weeks.
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
   * there empty, so the card drops the video and shows the photo, which
   * is what a tea with no video shows anyway.
   */
  const [deadVideos, setDeadVideos] = useState([]);

  /*
   * Whether this card has reached the screen.
   *
   * Every card used to mount an autoplaying, looping video the moment the
   * grid rendered, on screen or not. A page of teas therefore held one video
   * decoding per card, for as long as the page was open, and the decoding was
   * the expensive half — far more than the download. That is what made the
   * product section stutter and the tab hang.
   *
   * The video is now mounted only once the card nears the viewport, and
   * paused whenever it leaves. It stays mounted after that, so scrolling back
   * up resumes rather than downloading again.
   */
  const wrapperRef = useRef(null);
  const [inView, setInView] = useState(false);
  const inViewRef = useRef(false);

  // Hover reveals the photo, so returning to view must not fight it.
  const hoveredRef = useRef(false);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return undefined;

    // Without the API, behave as before: show everything, play everything.
    if (typeof IntersectionObserver === "undefined") {
      inViewRef.current = true;
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        // Once mounted it stays mounted; only playback follows visibility.
        setInView((seen) => seen || entry.isIntersecting);

        const element = videoRef.current;
        if (!element) return;

        if (!entry.isIntersecting) {
          element.pause();
        } else if (!hoveredRef.current) {
          element.play().catch(() => {});
        }
      },
      // Begin just before the card arrives rather than as it lands.
      { rootMargin: "200px 0px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // The photo covers the video on hover, so there is nothing to play then.
  const showPhoto = () => {
    hoveredRef.current = true;
    videoRef.current?.pause();
  };
  const showVideo = () => {
    hoveredRef.current = false;
    if (!inViewRef.current) return;
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
  const uploadedVideo = getProductVideo(product);
  const video =
    uploadedVideo && !deadVideos.includes(uploadedVideo) ? uploadedVideo : null;

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
        ref={wrapperRef}
        href={productHref}
        className={`${styles.imageWrapper} ${video ? styles.hasVideo : ""}`}
        aria-label={`View ${name}`}
        onMouseEnter={showPhoto}
        onMouseLeave={showVideo}
        onFocus={showPhoto}
        onBlur={showVideo}
      >
        {image && video && inView && (
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