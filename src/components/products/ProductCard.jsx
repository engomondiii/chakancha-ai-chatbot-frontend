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
import { CombinationPreview } from "./CombinationPreview";

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

  // Genuinely on screen, as state rather than only as the ref below, because
  // a bundle's packs are separate components that have to re-render when it
  // changes. The ref stays: it is read inside callbacks that must not close
  // over a stale value.
  const [onScreen, setOnScreen] = useState(false);

  //
  // One slug per slot in the bundle. Empty for anything that is not one.
  //
  const [picks, setPicks] = useState([]);

  // Genuinely on screen, as opposed to merely close to it. Playback follows
  // this; mounting follows inView.
  const visibleRef = useRef(false);

  // Hover reveals the photo, so returning to view must not fight it.
  const hoveredRef = useRef(false);

  /**
   * Try to play, unless there is a reason not to.
   *
   * Called from several places because the element and its visibility arrive
   * in either order: the observer can report the card visible before the video
   * exists, and the video can finish loading after the observer has stopped
   * firing. Whichever happens last starts it.
   */
  const playIfWanted = () => {
    if (!visibleRef.current || hoveredRef.current) return;

    const element = videoRef.current;
    if (!element) return;

    //
    // Set muted on the element rather than trusting the JSX attribute. React
    // does not reliably apply `muted` to a video it creates on the client, and
    // an unmuted video is one a browser will not autoplay at all -- it rejects
    // play() with NotAllowedError and the card keeps showing its poster, which
    // is the product photo, so it looks like no video was ever there.
    //
    element.muted = true;
    element.playsInline = true;

    element.play().catch(() => {
      // Still refused; the poster stays. Nothing breaks, nothing is hidden.
    });
  };

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return undefined;

    // Without the API, behave as before: show everything, play everything.
    if (typeof IntersectionObserver === "undefined") {
      visibleRef.current = true;
      setInView(true);
      return undefined;
    }

    //
    // Mount a little before the card arrives, so the first frame is decoded by
    // the time it is on screen. Once mounted it stays mounted, and scrolling
    // back up resumes instead of downloading again.
    //
    const preload = new IntersectionObserver(
      ([entry]) => setInView((seen) => seen || entry.isIntersecting),
      { rootMargin: "200px 0px", threshold: 0 },
    );

    //
    // Play only while the card is really on screen -- a second observer with no
    // margin, deliberately. A browser will not start a video that is still off
    // screen, so asking at the 200px mark is refused, and a single observer has
    // already crossed its only threshold by then and never fires again. That is
    // how every card ended up sitting on its poster: video downloaded, playing
    // never started, and a poster is the product photo, so it looked like no
    // video at all.
    //
    const playback = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        setOnScreen(entry.isIntersecting);
        if (!entry.isIntersecting) {
          videoRef.current?.pause();
        } else {
          playIfWanted();
        }
      },
      { threshold: 0 },
    );

    preload.observe(node);
    playback.observe(node);

    return () => {
      preload.disconnect();
      playback.disconnect();
    };
  }, []);

  // The photo covers the video on hover, so there is nothing to play then.
  const showPhoto = () => {
    hoveredRef.current = true;
    videoRef.current?.pause();
  };
  const showVideo = () => {
    hoveredRef.current = false;
    playIfWanted();
  };

  const addToCart = useStore((state) => state.addToCart);
  const openCart = useStore((state) => state.openCart);
  const showSuccess = useStore((state) => state.showSuccess);

  const productId = product?.id;

  const isInCart = useStore((state) =>
    state.isInCart(productId)
  );

  //
  // A container is sold with tea, never instead of it. The rule is the
  // backend's (products/models.py, Product.is_accessory; the binding check is
  // in orders/services.py) -- this is only the part that stops the customer
  // walking into it, by refusing the click rather than letting them find out
  // at checkout.
  //
  const cartHasTea = useStore((state) =>
    state.cartItems.some((item) => (item?.kind || "tea") !== "accessory"),
  );

  if (!product) return null;

  // Support both camelCase and snake_case field names.
  const name = product.name || "Chakancha Tea";
  const slug = product.slug || "";
  const price = Number.parseFloat(product.price) || 0;
  const image = getProductImage(product);
  const uploadedVideo = getProductVideo(product);

  //
  // A bundle never plays a video, whatever is set on it. Its panel is busy
  // saying which teas were picked, and a clip laid over that would hide the
  // one thing the panel exists to show. Deciding it here rather than at the
  // element keeps `hasVideo` -- which also widens the card's layout -- from
  // being set on a card that has no video in it.
  //
  const video =
    product.kind === "bundle" ||
    !uploadedVideo ||
    deadVideos.includes(uploadedVideo)
      ? null
      : uploadedVideo;

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

  //
  // A bundle is one product at one price whose contents the customer chooses.
  // bundleSize is how many they pick; options is what they may pick from,
  // resolved by the backend per request so a tea that sells out leaves the
  // list without anybody editing the bundle.
  //
  const kind = product.kind || "tea";
  const isBundle = kind === "bundle";
  const isAccessory = kind === "accessory";

  // Addable only once there is tea to keep in it.
  const needsTeaFirst = isAccessory && !cartHasTea;
  const bundleSize = Number(product.bundleSize ?? product.bundle_size) || 0;
  const bundleOptions = Array.isArray(product.bundleOptions)
    ? product.bundleOptions
    : Array.isArray(product.bundle_options)
      ? product.bundle_options
      : [];

  //
  // Default every slot to the first tea on offer, so the bundle can be added
  // in one click. An empty slot would make the customer choose before they
  // know what the choice is worth, and the commonest basket is two of the
  // same thing anyway.
  //
  const firstOption = bundleOptions[0]?.slug || "";

  //
  // The teas currently chosen, one per slot, in slot order.
  //
  // The panel draws these instead of the bundle's own photo, because a bundle
  // is whatever is in it: two Gold, two Black and one of each are three
  // different baskets at the same price, and before checkout this panel is the
  // only place that difference can be seen. A single fixed photo of one pack
  // contradicts whatever the dropdowns say.
  //
  // There is always one tile per slot, even for a tea with no photograph of
  // its own -- that tile falls back to the tea's name. A missing picture must
  // not cost a slot, because a row of one tile under a picker that says two is
  // a straight contradiction of the thing being sold.
  //
  const slotPacks = isBundle
    ? Array.from({ length: bundleSize }, (_, slot) => {
        const wanted = picks[slot] || firstOption;
        return bundleOptions.find((option) => option.slug === wanted) || null;
      })
    : [];

  // A slot that resolves to nothing at all means the pickers and the options
  // have come apart; show the bundle's own photo rather than guess.
  const chosenPacks =
    slotPacks.length > 0 && slotPacks.every(Boolean) ? slotPacks : [];

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

    if (!inStock || adding || needsTeaFirst) return;

    setAdding(true);

    //
    // A slot the customer never touched still has to carry a tea, or the
    // backend refuses the bundle for having the wrong number. Defaulting to
    // the first on offer matches what the pickers are already showing them.
    //
    const selections = isBundle
      ? {
          teas: Array.from({ length: bundleSize }, (_, slot) =>
            picks[slot] || firstOption,
          ).filter(Boolean),
        }
      : null;

    addToCart(product, 1, selections);
    openCart();
    showSuccess(
      selections?.teas?.length
        ? `${name} (${selections.teas.join(" + ")}) added to cart`
        : `${name} added to cart`,
    );

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

        {/*
          The pickers, one per slot. Shown only on a bundle that actually has
          teas to offer: a bundle whose every tea is out of stock has nothing
          to ask about, and an empty dropdown is worse than none.
        */}
        {isBundle && bundleOptions.length > 0 && (
          <div className={styles.bundlePicker}>
            <span className={styles.bundleLabel}>
              Choose your {bundleSize} teas
            </span>

            {Array.from({ length: bundleSize }, (_, slot) => (
              <label key={slot} className={styles.bundleSlot}>
                <span className={styles.bundleSlotNumber}>{slot + 1}</span>
                <select
                  className={styles.bundleSelect}
                  value={picks[slot] || firstOption}
                  onChange={(event) => {
                    const chosen = event.target.value;
                    setPicks((current) => {
                      const next = [...current];
                      next[slot] = chosen;
                      return next;
                    });
                  }}
                >
                  {bundleOptions.map((option) => (
                    <option key={option.slug} value={option.slug}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
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
          disabled={!inStock || adding || needsTeaFirst}
          aria-label={
            !inStock
              ? `${name} is out of stock`
              : needsTeaFirst
                ? `${name} is sold with tea; add a tea first`
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
            : needsTeaFirst
              ? "Add a tea first"
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
            onLoadedData={playIfWanted}
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

        {chosenPacks.length > 0 ? (
          <CombinationPreview
            items={chosenPacks}
            playing={onScreen}
            label={`${name}: ${chosenPacks
              .map((pack) => pack.name)
              .join(" and ")}`}
          />
        ) : image ? (
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