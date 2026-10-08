/**
 * src/components/common/WiseMark.jsx
 *
 * The Wise wordmark, inline.
 *
 * Inline rather than an <img> from Wise's servers: a payment option must not
 * depend on a third party's CDN being reachable, and hotlinking somebody
 * else's asset is rude as well as fragile. The path below is Wise's own
 * logotype; it is used to name the payment method a customer is choosing,
 * which is what it is for.
 *
 * #163300 is Wise's forest green and `brand` renders it on #9FE870, their
 * bright green — the pairing their own buttons use.
 */

import React from 'react';

export const WISE_FOREST = '#163300';
export const WISE_BRIGHT = '#9FE870';

const PATH =
  'M122.4.7h13.5l-6.8 48.6h-13.5zm-17.1 0l-9.1 28-4-28h-9.5l-12 27.9L69.3.8H56.1l4.6 48.6h10.9' +
  'L85 18.6l4.7 30.7h10.7L118.1.7h-12.8zM219 29h-32.1c.2 6.3 3.9 10.5 9.5 10.5 4.2 0 7.5-2.2 ' +
  '10.1-6.5l10.9 4.9C213.5 45.2 205.7 50 196 50c-13.2 0-22-8.9-22-23.2C174 11.1 184.3 0 198.9 0' +
  'c12.8 0 20.8 8.6 20.8 22.1 0 2.2-.2 4.5-.7 6.9zm-12.1-9.3c0-5.6-3.2-9.2-8.2-9.2-5.2 0-9.6 ' +
  '3.7-10.7 9.2zM13.8 15.4L0 31.5h24.7l2.8-7.6H16.9l6.5-7.5v-.2L19.2 9h18.9L23.4 49.3h10L51.1.7' +
  'H5.4zm144.1-4.9c4.8 0 9 2.6 12.6 7l1.9-13.7c-3.4-2.3-8-3.7-14.1-3.7-12.1 0-18.9 7.1-18.9 16.1' +
  ' 0 6.2 3.5 10.1 9.2 12.5l2.7 1.2c5.1 2.2 6.5 3.3 6.5 5.6 0 2.4-2.3 3.9-5.8 3.9-5.8 0-10.5-2.9' +
  '-14-8l-2 14c4 3.1 9.2 4.7 16 4.7 11.5 0 18.6-6.6 18.6-15.9 0-6.3-2.8-10.3-9.8-13.5l-3-1.4c-4.2' +
  '-1.8-5.6-2.9-5.6-4.9.1-2.2 2-3.9 5.7-3.9z';

/**
 * @param {number} height  rendered height in px; the width follows the aspect ratio
 * @param {string} color   wordmark colour — defaults to Wise forest green
 * @param {boolean} brand  render on Wise's bright-green chip
 */
export function WiseMark({ height = 14, color = WISE_FOREST, brand = false, style = {} }) {
  const mark = (
    <svg
      viewBox="0 0 219.7 50.1"
      height={height}
      width={(219.7 / 50.1) * height}
      role="img"
      aria-label="Wise"
      style={{ display: 'block', ...style }}
    >
      <path d={PATH} fill={color} />
    </svg>
  );

  if (!brand) return mark;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: `${Math.round(height * 0.42)}px ${Math.round(height * 0.6)}px`,
        backgroundColor: WISE_BRIGHT,
        borderRadius: Math.round(height * 0.45),
        lineHeight: 0,
      }}
    >
      {mark}
    </span>
  );
}

export default WiseMark;
