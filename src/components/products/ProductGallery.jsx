/**
 * ProductGallery.jsx
 * Image gallery with thumbnail strip for product detail pages.
 * Uses Next.js Image for optimisation.
 */

'use client';

import React, { useState } from 'react';
import NextImage from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function PlaceholderImage({ name }) {
  return (
    <div
      style={{
        width:           '100%',
        height:          '100%',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        background:      'linear-gradient(135deg, #e8efe0 0%, #d4e8c4 50%, #c4dbb4 100%)',
        gap:             12,
      }}
    >
      {/* <span style={{ fontSize: '3.5rem' }}>🍃</span> */}
      <span
        style={{
          fontFamily:  'var(--font-display)',
          fontSize:    14,
          color:       'var(--color-tea-green)',
          textAlign:   'center',
          padding:     '0 16px',
        }}
      >
        {name}
      </span>
    </div>
  );
}

export function ProductGallery({ images = [], productName = '' }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const validImages = images.filter(Boolean);
  const hasImages   = validImages.length > 0;
  const hasPrev     = activeIdx > 0;
  const hasNext     = activeIdx < validImages.length - 1;

  const goPrev = () => setActiveIdx((i) => Math.max(0, i - 1));
  const goNext = () => setActiveIdx((i) => Math.min(validImages.length - 1, i + 1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', maxWidth:400,margin:'0 auto',  }}>
      {/* Main image */}
      <div
        style={{
          position:      'relative',
          width:         '100%',
          aspectRatio:   '1 / 1',
          borderRadius:  'var(--radius-xl)',
          overflow:      'hidden',
          backgroundColor: 'var(--color-warm-cream)',
          boxShadow:     'var(--shadow-md)',
        }}
      >
        {hasImages ? (
          <NextImage
            src={validImages[activeIdx]}
            alt={`${productName} — image ${activeIdx + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'contain' }}
            priority={activeIdx === 0}
          />
        ) : (
          <PlaceholderImage name={productName} />
        )}

        {/* Prev / Next arrows */}
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={!hasPrev}
              style={{
                position:         'absolute',
                left:             12,
                top:              '50%',
                transform:        'translateY(-50%)',
                width:            36,
                height:           36,
                borderRadius:     '50%',
                backgroundColor:  hasPrev ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
                border:           'none',
                cursor:           hasPrev ? 'pointer' : 'default',
                display:          'flex',
                alignItems:       'center',
                justifyContent:   'center',
                transition:       'background-color var(--transition-fast)',
                backdropFilter:   'blur(4px)',
              }}
              aria-label="Previous image"
            >
              <ChevronLeft size={18} color={hasPrev ? 'var(--color-earth-brown)' : 'rgba(0,0,0,0.2)'} />
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={!hasNext}
              style={{
                position:         'absolute',
                right:            12,
                top:              '50%',
                transform:        'translateY(-50%)',
                width:            36,
                height:           36,
                borderRadius:     '50%',
                backgroundColor:  hasNext ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
                border:           'none',
                cursor:           hasNext ? 'pointer' : 'default',
                display:          'flex',
                alignItems:       'center',
                justifyContent:   'center',
                transition:       'background-color var(--transition-fast)',
                backdropFilter:   'blur(4px)',
              }}
              aria-label="Next image"
            >
              <ChevronRight size={18} color={hasNext ? 'var(--color-earth-brown)' : 'rgba(0,0,0,0.2)'} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {validImages.length > 1 && (
        <div style={{ display: 'flex', gap: 8 }}>
          {validImages.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              style={{
                width:         60,
                height:        60,
                borderRadius:  'var(--radius-md)',
                overflow:      'hidden',
                border:        i === activeIdx
                  ? '2px solid var(--color-tea-green)'
                  : '2px solid transparent',
                cursor:        'pointer',
                position:      'relative',
                flexShrink:    0,
                padding:       0,
                backgroundColor: 'var(--color-warm-cream)',
                transition:    'border-color var(--transition-fast)',
              }}
              aria-label={`View image ${i + 1}`}
            >
              <NextImage
                src={src}
                alt={`${productName} thumbnail ${i + 1}`}
                fill
                sizes="60px"
                style={{ objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductGallery;