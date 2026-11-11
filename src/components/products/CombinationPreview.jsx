/**
 * src/components/products/CombinationPreview.jsx
 *
 * What the customer is actually getting, drawn from the things themselves.
 *
 * A bundle is one product at one price whose contents are chosen, and a
 * container may be added beside it. None of that is a photograph anybody can
 * upload: two Gold, two Black and one of each are three different baskets at
 * the same price, and multiplying that by "with or without a container" is six
 * pictures for one product. So the preview is composed from each item's own
 * picture instead, live, as the choice changes.
 *
 * The shop card and the product page both draw it, so what the customer sees
 * before clicking and after clicking cannot disagree.
 *
 * Pictures only, no footage. A clip is the right thing on a single tea's card,
 * where it has the whole panel and a few seconds of attention; two of them in
 * a panel split between two teas is motion competing with motion, and the
 * thing being chosen -- which pack is which -- is exactly what a moving image
 * is worst at showing. The pack shots are also what the customer will be
 * comparing against when the parcel arrives.
 *
 * Repeats are counted, not repeated. Two Nandi Black drew two identical
 * pictures side by side, which reads as a rendering fault rather than as a
 * quantity -- and it spent half the panel saying something "x2" says in two
 * characters.
 */

"use client";

import React from "react";

import styles from "./CombinationPreview.module.css";

/**
 * Collapse repeats into counts, keeping first-appearance order.
 *
 * Two Gold is one picture and a "x2", not two pictures. That is both what the
 * customer means and what reads: a repeated image looks like a mistake, and a
 * count does not.
 */
function groupBySlug(things) {
  const groups = [];
  const seen = new Map();

  things.forEach((thing) => {
    const key = thing?.slug || thing?.name;
    if (seen.has(key)) {
      groups[seen.get(key)].count += 1;
      return;
    }

    seen.set(key, groups.length);
    groups.push({ thing, count: 1 });
  });

  return groups;
}

/**
 * How many frames this set of things will actually draw.
 *
 * Exported because the card has to know before it renders: a panel showing one
 * picture needs no more room than any other product's, and only a genuine pair
 * is worth widening the card for. Taking it from the same grouping the preview
 * uses is what stops the two from ever disagreeing about what "two" means.
 */
export function frameCount(items = [], extra = []) {
  return groupBySlug([...items, ...extra].filter(Boolean)).length;
}

/**
 * One thing in the basket-to-be: its own photograph, or its name.
 */
function BundlePack({ pack }) {
  if (pack.image) {
    return (
      <img
        className={styles.media}
        src={pack.image}
        alt=""
        loading="lazy"
        draggable="false"
      />
    );
  }

  // No picture on this tea. It still gets its frame, because a panel showing
  // one tile beside a picker that says two contradicts what is being sold.
  return <span className={styles.mediaName}>{pack.name}</span>;
}

/**
 * The panel: one frame per distinct thing, sharing the width evenly.
 *
 * `items` are the chosen teas in slot order; `extra` is anything travelling
 * with them, such as a container, and is drawn last. They are kept as separate
 * arguments rather than one list because the teas are a choice the customer is
 * making and the extra is one they have already made -- the caller should not
 * have to flatten that distinction to call this.
 */
export function CombinationPreview({ items = [], extra = [], label = "" }) {
  const all = [...items, ...extra].filter(Boolean);
  if (all.length === 0) return null;

  const groups = groupBySlug(all);

  const described = groups
    .map(({ thing, count }) =>
      count > 1 ? `${count} × ${thing.name}` : thing.name,
    )
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className={styles.preview}
      data-frames={groups.length}
      role="img"
      aria-label={label || described}
    >
      {groups.map(({ thing, count }) => (
        <figure
          /*
            Keyed on the thing, not on its position, so changing a dropdown
            replaces the frame and the new one animates in -- rather than the
            old one swapping its source behind an unchanged picture.
          */
          key={thing.slug || thing.name}
          className={styles.frame}
        >
          <BundlePack pack={thing} />

          {count > 1 && (
            <span className={styles.count} aria-hidden="true">
              ×{count}
            </span>
          )}
        </figure>
      ))}
    </div>
  );
}

export default CombinationPreview;
