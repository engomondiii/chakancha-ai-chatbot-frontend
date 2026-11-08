/**
 * src/components/products/ShopSection.jsx
 *
 * A titled run of product cards — the bundles, the accessories, anything the
 * shop adds later that is not a tea.
 *
 * It renders nothing at all when it has nothing to show. An empty section with
 * a heading tells the customer something is missing; no section tells them
 * nothing, which is the truth when the shop simply does not sell one yet.
 */

"use client";

import React from "react";

import { ProductCard } from "./ProductCard";

import styles from "./ShopSection.module.css";

export function ShopSection({ title, blurb, products, isLoading = false }) {
  const items = Array.isArray(products) ? products : [];

  // Nothing to say while the catalogue is still arriving, and nothing to say
  // if this kind turns out to be empty.
  if (isLoading || items.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby={`shop-${title}`}>
      <div className={styles.heading}>
        <h2 id={`shop-${title}`} className={styles.title}>
          {title}
        </h2>
        {blurb && <p className={styles.blurb}>{blurb}</p>}
      </div>

      <div className={styles.grid}>
        {items.map((product, index) => (
          <ProductCard
            key={product?.id ?? product?.slug ?? `${title}-${index}`}
            product={product}
            productNumber={index + 1}
          />
        ))}
      </div>
    </section>
  );
}

export default ShopSection;
