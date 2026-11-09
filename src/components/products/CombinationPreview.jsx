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
 * picture or clip instead, live, as the choice changes.
 *
 * The shop card and the product page both draw it, so what the customer sees
 * before clicking and after clicking cannot disagree.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";

import styles from "./CombinationPreview.module.css";

/**
 * One tea inside a bundle's panel.
 *
 * Plays that tea's own card video when it has one and falls back to its photo
 * when it does not, which is the same rule its own shop card follows. Nothing
 * extra is uploaded for a bundle: set a clip on Nandi Gold and it plays
 * wherever Nandi Gold appears.
 *
 * `depth` is the slot's position in the stack. The packs overlap, so the first
 * sits in front at full size and each one behind is a little smaller and a
 * little higher -- the way two things actually look standing together, rather
 * than two pictures side by side in a row.
 */
function BundlePack({ pack, depth, spread, playing }) {
  const ref = useRef(null);
  const [deadVideo, setDeadVideo] = useState(false);

  const video = deadVideo ? null : pack.video_url || pack.videoUrl || null;

  useEffect(() => {
    const element = ref.current;
    if (!element || !video) return;

    if (!playing) {
      element.pause();
      return;
    }

    // Set on the element, not trusted to the JSX attribute: React does not
    // reliably apply `muted` to a video it creates on the client, and a
    // browser refuses to autoplay anything it believes has sound.
    element.muted = true;
    element.playsInline = true;
    element.play().catch(() => {});
  }, [playing, video]);

  // Depth and spread are read by the stylesheet; keeping the arithmetic in CSS
  // means a bundle of three or four needs no new code here.
  const style = { "--pack-depth": depth, "--pack-spread": spread };

  if (video) {
    return (
      <video
        ref={ref}
        className={styles.bundlePack}
        style={style}
        src={video}
        poster={pack.image || undefined}
        onError={() => setDeadVideo(true)}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
      />
    );
  }

  if (pack.image) {
    return (
      <img
        className={styles.bundlePack}
        style={style}
        src={pack.image}
        alt=""
        loading="lazy"
        draggable="false"
      />
    );
  }

  // No picture and no clip. The slot is still held, because a row of one tile
  // under a picker that says two contradicts the thing being sold.
  return (
    <span className={styles.bundlePackName} style={style}>
      {pack.name}
    </span>
  );
}


/**
 * The stack: one tile per thing in the basket-to-be.
 *
 * `items` are the chosen teas in slot order; `extra` is anything travelling
 * with them, such as a container, and is drawn last so it stands at the back.
 * They are kept as separate arguments rather than one list because the teas
 * are a choice the customer is making and the extra is one they have already
 * made -- the caller should not have to flatten that distinction to call this.
 */
export function CombinationPreview({
  items = [],
  extra = [],
  playing = false,
  label = "",
}) {
  const all = [...items, ...extra];
  if (all.length === 0) return null;

  return (
    <div
      className={styles.bundlePacks}
      data-count={all.length}
      role="img"
      aria-label={
        label || all.map((thing) => thing?.name).filter(Boolean).join(" and ")
      }
    >
      {all.map((thing, slot) => (
        <BundlePack
          /*
            Keyed on the thing, not the slot, so changing a dropdown replaces
            the element and the new pack animates in -- rather than the old
            one's video swapping its source behind an unchanged frame.
          */
          key={`${slot}-${thing.slug}`}
          pack={thing}
          depth={slot}
          spread={slot - (all.length - 1) / 2}
          playing={playing}
        />
      ))}
    </div>
  );
}

export default CombinationPreview;
