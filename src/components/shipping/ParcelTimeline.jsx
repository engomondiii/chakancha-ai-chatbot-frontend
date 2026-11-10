/**
 * src/components/shipping/ParcelTimeline.jsx
 *
 * Every checkpoint DHL has recorded, newest first.
 *
 * Newest first because the question is always "where is it now". The oldest
 * entries are the ones nobody re-reads, so they go at the bottom and, past a
 * handful, behind a toggle — a parcel to Europe collects a dozen scans and a
 * list that long buries the only line that matters.
 */

'use client';

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

const VISIBLE_BY_DEFAULT = 5;

function formatWhen(value) {
  if (!value) return '';
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) return '';
  return when.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function ParcelTimeline({ checkpoints = [] }) {
  const [expanded, setExpanded] = useState(false);

  if (!checkpoints.length) {
    return (
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
        No checkpoints yet. The first one is recorded when the parcel is scanned
        at collection.
      </p>
    );
  }

  const shown  = expanded ? checkpoints : checkpoints.slice(0, VISIBLE_BY_DEFAULT);
  const hidden = checkpoints.length - shown.length;

  return (
    <div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {shown.map((checkpoint, index) => {
          const latest = index === 0;
          return (
            <li
              key={`${checkpoint.at}-${index}`}
              style={{
                position: 'relative', paddingLeft: 24, paddingBottom: 18,
                borderLeft: index === shown.length - 1 && !hidden
                  ? '1px solid transparent'
                  : '1px solid var(--color-border)',
                marginLeft: 4,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute', left: -5, top: 3, width: 9, height: 9,
                  borderRadius: '50%',
                  backgroundColor: latest ? 'var(--color-tea-green)' : 'var(--color-border)',
                  border: '2px solid var(--color-background-main, #fbfaf7)',
                  boxSizing: 'content-box',
                }}
              />
              <p style={{
                margin: 0, fontFamily: 'var(--font-sans)', fontSize: 13.5,
                fontWeight: latest ? 600 : 500, color: 'var(--color-text-primary)',
              }}>
                {checkpoint.description}
              </p>
              <p style={{
                margin: '3px 0 0', fontFamily: 'var(--font-sans)', fontSize: 12,
                color: 'var(--color-text-secondary)',
                display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
              }}>
                <span>{formatWhen(checkpoint.at)}</span>
                {checkpoint.location && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={11} /> {checkpoint.location}
                  </span>
                )}
              </p>
              {/* DHL attaches a remark to the checkpoints that need one —
                  what customs is waiting for, why a delivery was missed. It
                  is the carrier writing about this parcel, so it is shown
                  rather than summarised. */}
              {checkpoint.remark && (
                <p style={{
                  margin: '4px 0 0', fontFamily: 'var(--font-sans)', fontSize: 12.5,
                  color: 'var(--color-text-primary)', opacity: 0.85,
                }}>
                  {checkpoint.remark}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
            color: 'var(--color-tea-green)', background: 'none', border: 'none',
            padding: 0, cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          Show {hidden} earlier {hidden === 1 ? 'checkpoint' : 'checkpoints'}
        </button>
      )}
    </div>
  );
}
