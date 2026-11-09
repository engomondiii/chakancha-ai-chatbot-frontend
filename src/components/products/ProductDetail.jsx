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
import { CombinationPreview } from "./CombinationPreview";
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

  // One slug per slot of a bundle; empty for anything that is not one.
  const [picks, setPicks] = useState([]);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const addToCart = useStore(
    (state) => state.addToCart,
  );

  const cartHasTea = useStore((state) =>
    state.cartItems.some((item) => (item?.kind || "tea") !== "accessory"),
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

  //
  // A bundle is one product at one price whose contents the customer chooses.
  // This page sold it without ever asking: it called addToCart with no
  // selections, so the bundle reached the server cart empty and CartAddView
  // refused it. The pickers below are the same ones the shop card carries, and
  // they have to be here too -- this page is where a link, a search result or
  // a shared URL lands.
  //
  const kind = product.kind || "tea";
  const isBundle = kind === "bundle";

  //
  // A container is sold with tea, never instead of it. Same rule as the shop
  // card, and it has to be here too: this page is where a link or a search
  // result lands, and it had its own buy button.
  //
  const isAccessory = kind === "accessory";
  const needsTeaFirst = isAccessory && !cartHasTea;
  const bundleSize = Number(product.bundleSize ?? product.bundle_size) || 0;
  const bundleOptions = Array.isArray(product.bundleOptions)
    ? product.bundleOptions
    : Array.isArray(product.bundle_options)
      ? product.bundle_options
      : [];

  // Every slot starts on the first tea offered, so the bundle can be bought in
  // one click and no slot can reach the server empty.
  const firstOption = bundleOptions[0]?.slug || "";

  //
  // Accessories this page may offer. The backend decides what they are (a
  // container is the only one today) and refuses to offer any on an
  // accessory's own page, so there is no rule to repeat here.
  //
  const addOns = Array.isArray(product.addOns)
    ? product.addOns
    : Array.isArray(product.add_ons)
      ? product.add_ons
      : [];

  // Slugs of the add-ons the customer has ticked.
  const [chosenAddOns, setChosenAddOns] = useState([]);

  const pickedAddOns = addOns.filter((addOn) =>
    chosenAddOns.includes(addOn.slug),
  );

  const chosenTeas = isBundle
    ? Array.from(
        { length: bundleSize },
        (_, slot) => picks[slot] || firstOption,
      ).filter(Boolean)
    : [];

  // The same slugs as the teas themselves, for the preview. A slot that
  // resolves to nothing means the pickers and the options have come apart;
  // drop the lot rather than draw a bundle of one.
  const slotPacks = chosenTeas
    .map((slug) => bundleOptions.find((option) => option.slug === slug))
    .filter(Boolean);

  const chosenPacks =
    slotPacks.length === chosenTeas.length ? slotPacks : [];

  const handleAddToCart = () => {
    if (!inStock || adding || needsTeaFirst) return;

    setAdding(true);

    addToCart(product, qty, isBundle ? { teas: chosenTeas } : null);

    //
    // Add-ons are their own lines, added after the tea and never before it: a
    // container may not enter a basket that has no tea in it yet, and that is
    // checked on every add (cart/views.py) as well as at the order.
    //
    // `kind` is forced rather than trusted. The line, not the product, is what
    // the cart keeps, and a container recorded as a tea would quietly defeat
    // the rule that it cannot be bought alone.
    //
    pickedAddOns.forEach((addOn) => {
      addToCart({ ...addOn, kind: "accessory" }, 1, null);
    });

    openCart();

    const bought = [
      isBundle ? `${name} (${chosenTeas.join(" + ")})` : name,
      ...pickedAddOns.map((addOn) => addOn.name),
    ].join(" + ");

    showSuccess(`${bought} × ${qty} added to cart`);

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
          {/*
            A bundle shows what is in it, not a photograph of it.

            Two Gold, two Black and one of each are three different baskets at
            the same price, and a container doubles that again. Those are six
            pictures somebody would have to shoot, upload and keep in step with
            the dropdowns below -- so instead the preview is composed live from
            each tea's own picture or clip, and the container joins it the
            moment it is ticked.
          */}
          {isBundle ? (
            <div className={styles.combinationPreview}>
              <CombinationPreview
                items={chosenPacks}
                extra={pickedAddOns}
                playing
                label={`${name}: ${[...chosenPacks, ...pickedAddOns]
                  .map((thing) => thing.name)
                  .join(" and ")}`}
              />
            </div>
          ) : (
            <ProductGallery
              images={imageUrls}
              productName={name}
            />
          )}
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

          {/*
            What goes in the bundle. Shown only when there is something to
            offer: a bundle whose every tea is out of stock has nothing to ask
            about, and an empty dropdown is worse than none.
          */}
          {isBundle && bundleOptions.length > 0 && (
            <div className={styles.bundlePicker}>
              <span className={styles.bundleLabel}>
                Choose your {bundleSize} teas
              </span>

              <div className={styles.bundleSlots}>
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
            </div>
          )}

          {/*
            The container, offered at the only moment the rule allows: while
            the customer is buying tea. It is a separate line at its own price,
            not a variant of the tea -- the cart, the order and the parcel all
            treat it as the separate object it is.
          */}
          {addOns.length > 0 && (
            <div className={styles.addOns}>
              {addOns.map((addOn) => {
                const ticked = chosenAddOns.includes(addOn.slug);

                return (
                  <label key={addOn.slug} className={styles.addOn}>
                    <input
                      type="checkbox"
                      className={styles.addOnBox}
                      checked={ticked}
                      onChange={() =>
                        setChosenAddOns((current) =>
                          ticked
                            ? current.filter((slug) => slug !== addOn.slug)
                            : [...current, addOn.slug],
                        )
                      }
                    />

                    {addOn.image && (
                      <img
                        src={addOn.image}
                        alt=""
                        className={styles.addOnThumb}
                        loading="lazy"
                        draggable="false"
                      />
                    )}

                    <span className={styles.addOnName}>
                      Add a {addOn.name.toLowerCase()}
                    </span>

                    <span className={styles.addOnPrice}>
                      +${Number(addOn.price).toFixed(2)}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

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
              disabled={!inStock || adding || needsTeaFirst}
            >
              <ShoppingCart
                size={18}
                aria-hidden="true"
              />

              {!inStock
                ? "Out of stock"
                : needsTeaFirst
                  ? "Add a tea first"
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