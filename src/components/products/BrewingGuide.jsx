/**
 * BrewingGuide.jsx
 * Brewing instructions component for product detail pages.
 * Shows temperature, time, amount, and resteep info with clear visual layout.
 */

'use client';

import React, { useState } from 'react';
import { Thermometer, Clock, Leaf, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

const BREWING_ICONS = {
  temperature: Thermometer,
  time:        Clock,
  amount:      Leaf,
  resteeps:    RotateCcw,
};

function BrewingStep({ icon: Icon, label, value, highlight = false }) {
  return (
    <div
      style={{
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        gap:             6,
        padding:         '14px 12px',
        backgroundColor: highlight ? 'rgba(45,80,22,0.06)' : 'white',
        border:          `1px solid ${highlight ? 'rgba(45,80,22,0.2)' : 'var(--color-border)'}`,
        borderRadius:    'var(--radius-lg)',
        flex:            1,
        minWidth:        80,
        textAlign:       'center',
        transition:      'background-color var(--transition-fast)',
      }}
    >
      <Icon
        size={18}
        color={highlight ? 'var(--color-tea-green)' : 'var(--color-muted-olive)'}
      />
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize:   13,
          fontWeight: 700,
          color:      highlight ? 'var(--color-tea-green)' : 'var(--color-earth-brown)',
          lineHeight: 1.3,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize:   11,
          color:      'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function BrewingGuide({ product, collapsed = false }) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);

  if (!product) return null;

  const {
    brewingTemp,
    brewingTime,
    teaAmount,
    resteeps,
    name,
  } = product;

  if (!brewingTemp && !brewingTime) return null;

  return (
    <div
      style={{
        border:        '1px solid var(--color-border)',
        borderRadius:  'var(--radius-lg)',
        overflow:      'hidden',
        backgroundColor: 'var(--color-warm-cream)',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        style={{
          width:           '100%',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          padding:         '14px var(--spacing-lg)',
          background:      'none',
          border:          'none',
          cursor:          'pointer',
          textAlign:       'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Leaf size={16} color="var(--color-tea-green)" />
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize:   14,
              fontWeight: 600,
              color:      'var(--color-earth-brown)',
            }}
          >
            Brewing Guide
          </span>
        </div>
        {isExpanded
          ? <ChevronUp size={16} color="var(--color-text-secondary)" />
          : <ChevronDown size={16} color="var(--color-text-secondary)" />
        }
      </button>

      {/* Steps */}
      {isExpanded && (
        <div
          style={{
            padding:   '0 var(--spacing-lg) var(--spacing-lg)',
            display:   'flex',
            flexDirection: 'column',
            gap:       var_spacing_md(),
            animation: 'slideDown var(--transition-standard) var(--ease-out)',
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {brewingTemp && (
              <BrewingStep
                icon={Thermometer}
                label="Temperature"
                value={brewingTemp}
                highlight
              />
            )}
            {brewingTime && (
              <BrewingStep
                icon={Clock}
                label="Steep Time"
                value={brewingTime}
                highlight
              />
            )}
            {teaAmount && (
              <BrewingStep
                icon={Leaf}
                label="Per Cup"
                value={teaAmount}
              />
            )}
            {resteeps != null && (
              <BrewingStep
                icon={RotateCcw}
                label="Resteeps"
                value={`${resteeps}×`}
              />
            )}
          </div>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize:   12,
              color:      'var(--color-text-secondary)',
              margin:     0,
              lineHeight: 1.6,
            }}
          >
            For best results, use filtered water and pre-warm your cup. Adjust steeping
            time to taste — longer for stronger, shorter for delicate.
          </p>
        </div>
      )}
    </div>
  );
}

// Helper to avoid template literal in inline style (Next.js edge case)
function var_spacing_md() { return 'var(--spacing-md)'; }

export default BrewingGuide;