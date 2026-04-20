/**
 * src/components/products/TastingNotes.jsx — Integration Phase 3
 *
 * What changed from the original:
 *  - normalizeNotes() added to handle both backend and mock data formats:
 *      Backend: tasting_notes = [{note: "Malt"}, {note: "Honey"}]
 *      Mock/normalized: tastingNotes = ["Malt", "Honey"]
 *  - flavorProfile reads from both flavorProfile and flavor_profile
 *  - Everything else unchanged
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

/**
 * Normalise notes to string array.
 * Backend returns [{note: "..."}, ...]; hook normalizes to strings,
 * but we handle both forms here for resilience.
 */
function normalizeNotes(notes) {
  if (!notes || !Array.isArray(notes)) return [];
  return notes.map((n) => (typeof n === 'object' && n !== null ? n.note : n)).filter(Boolean);
}

export function TastingNotes({ notes, flavorProfile, compact = false }) {
  const normalizedNotes   = normalizeNotes(notes);
  const displayProfile    = flavorProfile || '';

  if (!normalizedNotes.length && !displayProfile) return null;

  if (compact) {
    return (
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontStyle: 'italic',
        color: 'var(--color-muted-olive)', margin: 0, lineHeight: 1.5 }}>
        {displayProfile}
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {displayProfile && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontStyle: 'italic',
          color: 'var(--color-muted-olive)', margin: 0 }}>
          {displayProfile}
        </p>
      )}

      {normalizedNotes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {normalizedNotes.map((note) => {
            const bg     = getNoteColor(note);
            const isDark = isDarkColor(bg);
            return (
              <span key={note} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                backgroundColor: bg,
                color:           isDark ? 'white' : 'var(--color-earth-brown)',
                borderRadius:    'var(--radius-pill)', padding: '4px 12px',
                fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)'}`,
                whiteSpace: 'nowrap',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)',
                  flexShrink: 0 }} />
                {note}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function isDarkColor(hex) {
  if (!hex || hex.startsWith('var(')) return false;
  const clean = hex.replace('#', '');
  if (clean.length < 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

export default TastingNotes;