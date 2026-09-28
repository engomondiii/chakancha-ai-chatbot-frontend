/**
 * src/components/products/ProductGrid.jsx
 *
 * Displays Chakancha's current tea collection:
 *  - 01 Nandi Gold
 *  - 02 Nandi Black
 *
 * Product filtering has been removed because recipe filters will be
 * handled separately in the recipe section.
 */

"use client";

import React from "react";

import { Skeleton } from "@/components/ui/Skeleton";
import { ProductCard } from "./ProductCard";

import styles from "./ProductGrid.module.css";

/**
 * Keeps the intended editorial product order without hiding
 * products whose backend slugs may be different.
 */
function getProductOrder(product) {
  const slug = String(product?.slug || "").toLowerCase();
  const name = String(product?.name || "").toLowerCase();

  if (
    slug === "nandi-gold" ||
    name.includes("nandi gold")
  ) {
    return 0;
  }

  if (
    slug === "nandi-black" ||
    name.includes("nandi black")
  ) {
    return 1;
  }

  return 99;
}

function SkeletonGrid({ count = 2 }) {
  return (
    <div
      className={styles.grid}
      aria-label="Loading teas"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={styles.skeletonCard}
          aria-hidden="true"
        >
          <div className={styles.skeletonContent}>
            <Skeleton
              variant="text"
              height="12px"
              width="32px"
            />

            <Skeleton
              variant="text"
              height="30px"
              width="75%"
            />

            <Skeleton
              variant="text"
              height="14px"
              width="100%"
            />

            <Skeleton
              variant="text"
              height="14px"
              width="85%"
            />

            <Skeleton
              variant="text"
              height="20px"
              width="35%"
            />

            <Skeleton
              variant="rect"
              height="44px"
              width="100%"
              style={{
                borderRadius: "var(--radius-button)",
              }}
            />
          </div>

          <div className={styles.skeletonImage}>
            <Skeleton
              variant="rect"
              height="100%"
              width="100%"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductGridError({ error }) {
  const errorMessage =
    typeof error === "string"
      ? error
      : error?.message || "";

  return (
    <div
      className={`${styles.state} ${styles.errorState}`}
      role="alert"
    >
      <h3 className={styles.stateTitle}>
        We could not load the teas
      </h3>

      <p className={styles.stateMessage}>
        Please refresh the page or try again shortly.
      </p>

      {errorMessage && (
        <p className={styles.errorMessage}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}

function EmptyProductGrid() {
  return (
    <div
      className={styles.state}
      role="status"
    >
      <h3 className={styles.stateTitle}>
        No teas are currently available
      </h3>

      <p className={styles.stateMessage}>
        Nandi Gold and Nandi Black will appear here when they are
        available.
      </p>
    </div>
  );
}

export function ProductGrid({
  products = [],
  isLoading = false,
  error = null,
}) {
  if (isLoading) {
    return <SkeletonGrid count={2} />;
  }

  if (error) {
    return <ProductGridError error={error} />;
  }

  const orderedProducts = Array.isArray(products)
    ? [...products].sort((firstProduct, secondProduct) => {
        const orderDifference =
          getProductOrder(firstProduct) -
          getProductOrder(secondProduct);

        if (orderDifference !== 0) {
          return orderDifference;
        }

        return String(firstProduct?.name || "").localeCompare(
          String(secondProduct?.name || ""),
        );
      })
    : [];

  if (orderedProducts.length === 0) {
    return <EmptyProductGrid />;
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.grid}
        aria-label="Chakancha tea products"
      >
        {orderedProducts.map((product, index) => (
          <ProductCard
            key={
              product?.id ??
              product?.slug ??
              `product-${index}`
            }
            product={product}
            productNumber={index + 1}
            priority={index < 2}
          />
        ))}
      </div>
    </div>
  );
}

export default ProductGrid;