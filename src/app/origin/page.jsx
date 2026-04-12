'use client';
import React from 'react';
import { OriginHero }            from '@/components/origin/OriginHero';
import { EstateInfo }            from '@/components/origin/EstateInfo';
import { TeaPickerStories }      from '@/components/origin/TeaPickerStories';
import { MapView }               from '@/components/origin/MapView';

export default function OriginPage() {
  return (
    <div>
      <OriginHero />
      <div style={{ maxWidth: 'var(--max-width-content)', margin: '0 auto', padding: 'var(--spacing-3xl) var(--spacing-lg)' }}>
        <Section title="About Nandi Hills">
          <p style={bodyText}>Nandi Hills sits in Kenya's Rift Valley at elevations between 1,900 and 2,300 metres. The cool highland climate, volcanic soil, and consistent rainfall create ideal conditions for slow-growing, flavour-rich tea. It is one of the finest tea-growing regions on the planet — and one of the least well-known outside the specialty market.</p>
          <EstateInfo />
        </Section>
        <Section title="Where we are">
          <MapView />
        </Section>
        <Section title="The people behind the tea">
          <p style={bodyText}>Every leaf is hand-picked by skilled workers — people with years of knowledge about quality, timing, and care. These are the people Chakancha was built to honour.</p>
          <TeaPickerStories />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 'var(--spacing-3xl)' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h2)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 var(--spacing-xl)' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>{children}</div>
    </section>
  );
}

const bodyText = { fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0, maxWidth: 700 };