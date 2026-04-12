/**
 * OriginStory.jsx
 * Per-product origin and estate storytelling block.
 * Appears on the product detail page below tasting notes.
 */

'use client';

import React from 'react';
import { MapPin, Mountain, Leaf, Award } from 'lucide-react';
import NextLink from 'next/link';

export function OriginStory({ product }) {
  if (!product) return null;

  const { origin, estate, harvest, certification } = product;

  const details = [
    origin      && { icon: MapPin,   label: 'Origin',        value: origin },
    estate      && { icon: Mountain, label: 'Estate',        value: estate },
    harvest     && { icon: Leaf,     label: 'Harvest Method',value: harvest },
    certification && { icon: Award,  label: 'Standards',     value: certification },
  ].filter(Boolean);

  if (!details.length) return null;

  return (
    <div
      style={{
        backgroundColor: 'rgba(45, 80, 22, 0.04)',
        border:          '1px solid rgba(45, 80, 22, 0.12)',
        borderRadius:    'var(--radius-lg)',
        padding:         'var(--spacing-lg)',
        display:         'flex',
        flexDirection:   'column',
        gap:             'var(--spacing-md)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MapPin size={15} color="var(--color-tea-green)" />
        <span
          style={{
            fontFamily:    'var(--font-sans)',
            fontSize:      11,
            fontWeight:    700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color:         'var(--color-tea-green)',
          }}
        >
          Origin & Traceability
        </span>
      </div>

      {/* Detail rows */}
      <div
        style={{
          display:      'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap:          'var(--spacing-sm)',
        }}
      >
        {details.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            style={{
              display:    'flex',
              alignItems: 'flex-start',
              gap:        8,
            }}
          >
            <Icon
              size={14}
              color="var(--color-muted-olive)"
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <div>
              <p
                style={{
                  fontFamily:    'var(--font-sans)',
                  fontSize:      11,
                  color:         'var(--color-text-secondary)',
                  margin:        '0 0 2px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight:    600,
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize:   13,
                  color:      'var(--color-earth-brown)',
                  margin:     0,
                  lineHeight: 1.4,
                }}
              >
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Link to full origin page */}
      <NextLink
        href="/origin/traceability"
        style={{
          fontFamily:     'var(--font-sans)',
          fontSize:       12,
          color:          'var(--color-tea-green)',
          textDecoration: 'underline',
          textDecorationColor: 'rgba(45,80,22,0.3)',
          textUnderlineOffset: '2px',
          alignSelf:      'flex-start',
          transition:     'text-decoration-color var(--transition-fast)',
        }}
      >
        View full traceability →
      </NextLink>
    </div>
  );
}

export default OriginStory;