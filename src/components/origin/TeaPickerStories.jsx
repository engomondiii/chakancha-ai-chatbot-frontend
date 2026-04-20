/**
 * src/components/origin/TeaPickerStories.jsx — Integration Phase 4
 *
 * What changed from the original:
 *  - Fetches real data from GET /api/v1/content/tea-pickers/
 *    (TeaPickersView → TeaPickerProfileSerializer)
 *  - Backend fields: name, years_experience, quote, role, estate, photo_url
 *  - Falls back to hardcoded STORIES when API is unavailable (dev mode)
 *  - Loading skeleton added
 *  - Everything else unchanged (visual layout, left border style)
 */

'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

const FALLBACK_STORIES = [
  { name: 'Achieng W.',  years_experience: 14, quote: 'I have been picking tea since my mother taught me. With Chakancha\'s living wage, my children go to school without worry.', role: 'Senior picker · Kapsabet Estate' },
  { name: 'Kipchoge M.', years_experience: 8,  quote: 'The quality standards here mean we take pride in every leaf. We are not just workers — we are part of the product.', role: 'Quality picker · Chemase Estate' },
  { name: 'Wanjiru N.',  years_experience: 22, quote: 'Twenty-two years in these hills. Chakancha is the first that actually shows us the numbers.', role: 'Lead picker · Tindiret Estate' },
];

export function TeaPickerStories() {
  const [stories,   setStories]   = useState(FALLBACK_STORIES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get(ENDPOINTS.CONTENT.TEA_PICKERS)
      .then((data) => {
        const items = Array.isArray(data) ? data : (data.results || data);
        if (items && items.length > 0) setStories(items);
      })
      .catch(() => { /* Use fallback */ })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
        {[1,2,3].map((i) => (
          <div key={i} style={{ borderLeft: '3px solid var(--color-border)', paddingLeft: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 80, backgroundColor: 'var(--color-warm-cream)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0 }}>
        Shared with permission. Names used with consent.
      </p>
      {stories.map((s) => (
        <div key={s.name} style={{ borderLeft: '3px solid var(--color-tea-green)', paddingLeft: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {s.photo_url && (
            <img src={s.photo_url} alt={s.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)', marginBottom: 4 }} />
          )}
          <blockquote style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontStyle: 'italic', color: 'var(--color-earth-brown)', margin: 0, lineHeight: 1.6 }}>
            "{s.quote}"
          </blockquote>
          <div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
              {s.name}
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
              {s.role || (s.estate ? `${s.estate} Estate` : '')}
              {s.years_experience ? ` · ${s.years_experience} years experience` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TeaPickerStories;