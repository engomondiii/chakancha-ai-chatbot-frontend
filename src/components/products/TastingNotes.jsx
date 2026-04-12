/**
 * TastingNotes.jsx
 * Displays tasting notes and flavor profile for a tea product.
 * Used on both ProductCard and ProductDetail.
 */

'use client';

import React from 'react';

const NOTE_COLORS = {
  'Malt':             '#6B5544',
  'Honey':            '#D4A574',
  'Dark chocolate':   '#4A2C2A',
  'Earthy undertone': '#8B8C5A',
  'Fresh grass':      '#4A7C2C',
  'Sweet pea':        '#7CB87A',
  'Light floral':     '#B8C5D6',
  'Clean finish':     '#FDFDFB',
  'Hibiscus':         '#C0435A',
  'Berry':            '#8B4476',
  'Mineral finish':   '#B8C5D6',
  'White peach':      '#F5D6B5',
  'Jasmine':          '#E8D5C4',
  'Melon':            '#C8D87A',
  'Silky finish':     '#E8E0D5',
};

function getNoteColor(note) {
  return NOTE_COLORS[note] || 'var(--color-mist-gray)';
}

export function TastingNotes({ notes = [], flavorProfile, compact = false }) {
  if (!notes.length && !flavorProfile) return null;

  if (compact) {
    return (
      <p
        style={{
          fontFamily:  'var(--font-sans)',
          fontSize:    13,
          fontStyle:   'italic',
          color:       'var(--color-muted-olive)',
          margin:      0,
          lineHeight:  1.5,
        }}
      >
        {flavorProfile}
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Flavor profile summary */}
      {flavorProfile && (
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize:   14,
            fontStyle:  'italic',
            color:      'var(--color-muted-olive)',
            margin:     0,
          }}
        >
          {flavorProfile}
        </p>
      )}

      {/* Individual note pills */}
      {notes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {notes.map((note) => {
            const bg = getNoteColor(note);
            const isDark = isDarkColor(bg);

            return (
              <span
                key={note}
                style={{
                  display:          'inline-flex',
                  alignItems:       'center',
                  gap:              5,
                  backgroundColor:  bg,
                  color:            isDark ? 'white' : 'var(--color-earth-brown)',
                  borderRadius:     'var(--radius-pill)',
                  padding:          '4px 12px',
                  fontSize:         12,
                  fontFamily:       'var(--font-sans)',
                  fontWeight:       500,
                  border:           `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)'}`,
                  whiteSpace:       'nowrap',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)', flexShrink: 0 }} />
                {note}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Simple luminance check for text colour contrast
function isDarkColor(hex) {
  if (!hex || hex.startsWith('var(')) return false;
  const clean = hex.replace('#', '');
  if (clean.length < 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  // Perceived luminance
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

export default TastingNotes;