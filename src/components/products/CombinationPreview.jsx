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
 *
 * Repeats are counted, not repeated. Two Nandi Black drew two identical
 * pictures side by side, which reads as a rendering fault rather than as a
 * quantity -- and it spent half the panel saying something "x2" says in two
 * characters, leaving each copy half the size it could have been.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";

import styles from "./CombinationPreview.module.css";

/**
 * One thing in the basket-to-be: its own clip, or its own photograph.
 *
 * Plays that tea's own card video when it has one and falls back to its photo
 * when it does not, which is the same rule its own shop card follows. Nothing
 * extra is uploaded for a bundle: set a clip on Nandi Gold and it plays
 * wherever Nandi Gold appears.
 */
function BundlePack({ pack, playing, stills = false }) {
  const ref = useRef(null);
  const [deadVideo, setDeadVideo] = useState(false);

  //
  // `stills` is not "paused". A paused video still carries its clip down the
  // wire, decodes a frame and holds a decoder open, and on a page showing two
  // of them that is a real cost for something nobody is going to watch. Asking
  // for stills means the clip is never fetched at all; the photograph is the
  // element.
  //
  const video =
    stills || deadVideo ? null : pack.video_url || pack.videoUrl || null;

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

  if (video) {
    return (
      <video
        ref={ref}
        className={`${styles.media} ${styles.mediaVideo}`}
        src={video}
        poster={pack.image || undefined}
        onError={() => setDeadVideo(true)}
        /*
          No autoPlay attribute: playback is the caller's decision, made in the
          effect above. Left on, the clip would start the instant it mounted
          and only then be paused, so a panel meant to open still would flicker
          into motion first.
        */
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
        className={styles.media}
        src={pack.image}
        alt=""
        loading="lazy"
        draggable="false"
      />
    );
  }

  // Neither picture nor clip. The thing still gets its frame, because a panel
  // showing one tile beside a picker that says two contradicts what is being
  // sold.
  return <span className={styles.mediaName}>{pack.name}</span>;
}

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
 * The panel: one frame per distinct thing, sharing the width evenly.
 *
 * `items` are the chosen teas in slot order; `extra` is anything travelling
 * with them, such as a container, and is drawn last. They are kept as separate
 * arguments rather than one list because the teas are a choice the customer is
 * making and the extra is one they have already made -- the caller should not
 * have to flatten that distinction to call this.
 */
export function CombinationPreview({
  items = [],
  extra = [],
  playing = false,
  stills = false,
  label = "",
}) {
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
            old one's video swapping its source behind an unchanged picture.
          */
          key={thing.slug || thing.name}
          className={styles.frame}
        >
          <BundlePack pack={thing} playing={playing} stills={stills} />

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
