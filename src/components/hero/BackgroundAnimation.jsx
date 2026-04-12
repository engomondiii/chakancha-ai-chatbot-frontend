'use client';

import React, { useEffect, useRef, useState } from 'react';

const IMAGES = [
  '/images/backgrounds/nandi-hills-golden.png',
  '/images/backgrounds/nandi-hills-morning.png',
  '/images/backgrounds/nandi-hills-dawn.png',
];

const SLIDE_DURATION = 7000; // ms per slide
const FADE_DURATION  = 1800; // ms crossfade

/**
 * BackgroundAnimation
 *
 * - 3-image crossfade slideshow
 * - Subtle slow zoom on the active slide
 * - Very light parallax on scroll
 *
 * NO mist/white overlay layers — those were washing out the beautiful
 * Nandi Hills images and making content look foggy.
 * Readability is handled by the dark gradient overlay in HeroSection.
 */
export function BackgroundAnimation() {
  const containerRef              = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  /* Slideshow */
  useEffect(() => {
    const timer = setInterval(
      () => setCurrentIndex((prev) => (prev + 1) % IMAGES.length),
      SLIDE_DURATION
    );
    return () => clearInterval(timer);
  }, []);

  /* Parallax */
  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return;
      containerRef.current.style.transform =
        `translateY(${window.scrollY * 0.3}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: '-8% 0 0 0', zIndex: 0 }}
    >
      {/* ── Slideshow images ─────────────────────────────────────────── */}
      {IMAGES.map((src, i) => (
        <div
          key={src}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            backgroundRepeat: 'no-repeat',
            opacity: i === currentIndex ? 1 : 0,
            transition: `opacity ${FADE_DURATION}ms ease-in-out`,
            /* Slow zoom only on the active slide */
            animation:
              i === currentIndex
                ? 'subtleZoom 14s ease-in-out infinite alternate'
                : 'none',
          }}
        />
      ))}

      {/* ── Slide dot indicators ─────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          zIndex: 4,
        }}
      >
        {IMAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              width:  i === currentIndex ? '28px' : '8px',
              height: '8px',
              borderRadius: '999px',
              background:
                i === currentIndex
                  ? 'rgba(255,255,255,0.95)'
                  : 'rgba(255,255,255,0.40)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 500ms ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}