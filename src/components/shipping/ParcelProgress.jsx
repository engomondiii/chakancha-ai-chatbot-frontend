/**
 * src/components/shipping/ParcelProgress.jsx
 *
 * The five stages of a parcel, as a bar.
 *
 * Deliberately coarse. DHL emits dozens of checkpoint codes and showing them
 * as the headline turns "where is my tea" into a reading exercise; the detail
 * belongs in the timeline underneath. A parcel that has gone wrong is not
 * drawn on this bar at all — see ParcelPanel — because a progress bar is a
 * promise, and a held parcel is not progressing.
 */

'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { PARCEL_STAGES, stageIndex } from '@/lib/shipping/parcel';

export default function ParcelProgress({ status }) {
  const reached = stageIndex(status);

  return (
    <ol
      aria-label="Parcel progress"
      style={{
        display: 'flex', listStyle: 'none', margin: 0, padding: 0,
        gap: 0, flexWrap: 'wrap',
      }}
    >
      {PARCEL_STAGES.map((stage, index) => {
        const done    = index <= reached;
        const current = index === reached;

        return (
          <li
            key={stage.id}
            aria-current={current ? 'step' : undefined}
            style={{
              flex: '1 1 110px', minWidth: 0, position: 'relative',
              paddingTop: 30, textAlign: 'center',
            }}
          >
            {/* The rail. Drawn per step rather than once behind them so it
                wraps with the steps on a narrow screen instead of floating. */}
            {index > 0 && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute', top: 10, right: '50%', width: '100%', height: 2,
                  backgroundColor: done ? 'var(--color-tea-green)' : 'var(--color-border)',
                }}
              />
            )}

            <span
              aria-hidden="true"
              style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 22, height: 22, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: done ? 'var(--color-tea-green)' : 'white',
                border: `2px solid ${done ? 'var(--color-tea-green)' : 'var(--color-border)'}`,
                color: 'white',
              }}
            >
              {done && <Check size={12} strokeWidth={3} />}
            </span>

            <span
              style={{
                display: 'block', fontFamily: 'var(--font-sans)', fontSize: 12,
                fontWeight: current ? 700 : 500,
                color: done ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                opacity: done ? 1 : 0.55,
                padding: '0 4px',
              }}
            >
              {stage.label}
            </span>

            {current && (
              <span
                style={{
                  display: 'block', fontFamily: 'var(--font-sans)', fontSize: 11,
                  color: 'var(--color-text-secondary)', marginTop: 2, padding: '0 4px',
                }}
              >
                {stage.hint}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
