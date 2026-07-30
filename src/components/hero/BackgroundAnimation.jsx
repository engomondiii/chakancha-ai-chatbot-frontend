'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

const IMAGES = [
  '/images/backgrounds/beautiful-tea-fields.jpg',
  '/images/backgrounds/nandi-hills-golden.png',
  '/images/backgrounds/nandi-hills-morning.png',
  '/images/backgrounds/nandi-hills-dawn.png',
];

const SLIDE_DURATION = 6500;
const FADE_DURATION = 2200;

/*
 * Camera movement lasts slightly longer than the full time
 * an image remains visible, including its fade-out.
 */
const CAMERA_DURATION =
  SLIDE_DURATION + FADE_DURATION + 400;

const CAMERA_MOVEMENTS = [
  {
    start: 'translate3d(-0.7%, 0.3%, 0) scale(1.04)',
    end: 'translate3d(0.7%, -0.3%, 0) scale(1.075)',
    origin: '50% 45%',
  },
  {
    start: 'translate3d(0.7%, 0.2%, 0) scale(1.04)',
    end: 'translate3d(-0.7%, -0.3%, 0) scale(1.072)',
    origin: '55% 45%',
  },
  {
    start: 'translate3d(0, 0.6%, 0) scale(1.038)',
    end: 'translate3d(0, -0.5%, 0) scale(1.075)',
    origin: '50% 50%',
  },
  {
    start: 'translate3d(-0.5%, -0.2%, 0) scale(1.04)',
    end: 'translate3d(0.6%, 0.3%, 0) scale(1.072)',
    origin: '45% 45%',
  },
];

export function BackgroundAnimation() {
  const containerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(null);

  /* Preload all images */
  useEffect(() => {
    IMAGES.forEach((src) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = src;

      image.decode?.().catch(() => {
        // The browser can still display the image if decode fails.
      });
    });
  }, []);

  const changeSlide = useCallback(
    (nextIndex) => {
      if (nextIndex === currentIndex) return;

      if (fadeTimerRef.current) {
        window.clearTimeout(fadeTimerRef.current);
      }

      setPreviousIndex(currentIndex);
      setCurrentIndex(nextIndex);

      fadeTimerRef.current = window.setTimeout(() => {
        setPreviousIndex(null);
      }, FADE_DURATION + 100);
    },
    [currentIndex]
  );

  /* Automatic slideshow */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      changeSlide((currentIndex + 1) % IMAGES.length);
    }, SLIDE_DURATION);

    return () => window.clearTimeout(timer);
  }, [currentIndex, changeSlide]);

  /* Gentle scroll parallax */
  useEffect(() => {
    let animationFrame = null;

    const handleScroll = () => {
      if (animationFrame) return;

      animationFrame = window.requestAnimationFrame(() => {
        if (containerRef.current) {
          const offset = window.scrollY * 0.1;

          containerRef.current.style.transform =
            `translate3d(0, ${offset}px, 0)`;
        }

        animationFrame = null;
      });
    };

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      if (fadeTimerRef.current) {
        window.clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',

        /*
         * Extra image area prevents empty edges during
         * the pan-and-zoom movement.
         */
        inset: '-5%',

        zIndex: 0,
        overflow: 'hidden',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* Shared continuous camera animation */}
      <style>
        {`
          @keyframes chakanchaCameraMove {
            from {
              transform: var(--camera-start);
            }

            to {
              transform: var(--camera-end);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .chakancha-background-slide {
              animation: none !important;
              transform: scale(1.04) !important;
              transition: opacity 800ms linear !important;
            }
          }
        `}
      </style>

      {IMAGES.map((src, index) => {
        const isActive = index === currentIndex;
        const isPrevious = index === previousIndex;
        const isVisible = isActive || isPrevious;

        const movement =
          CAMERA_MOVEMENTS[
            index % CAMERA_MOVEMENTS.length
          ];

        return (
          <div
            key={src}
            className="chakancha-background-slide"
            aria-hidden={!isActive}
            style={{
              position: 'absolute',
              inset: 0,

              backgroundImage: `url("${src}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 30%',
              backgroundRepeat: 'no-repeat',

              filter:
                'saturate(0.88) contrast(1.04) brightness(0.94)',

              /*
               * Keep all layers mounted and painted.
               * This avoids a small rendering delay when
               * the next image becomes visible.
               */
              opacity: isActive ? 1 : 0,
              zIndex: isActive
                ? 2
                : isPrevious
                  ? 1
                  : 0,

              pointerEvents: 'none',

              '--camera-start': movement.start,
              '--camera-end': movement.end,

              transformOrigin: movement.origin,

              /*
               * The outgoing slide keeps the same animation,
               * so camera movement continues throughout
               * the entire crossfade.
               */
              animation: isVisible
                ? `chakanchaCameraMove ${CAMERA_DURATION}ms linear forwards`
                : 'none',

              /*
               * A linear opacity transition produces the most
               * seamless photographic crossfade.
               */
              transition:
                `opacity ${FADE_DURATION}ms linear`,

              willChange: 'opacity, transform',
              backfaceVisibility: 'hidden',
              transformStyle: 'preserve-3d',
            }}
          />
        );
      })}

      {/* Slide indicators */}
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',

          display: 'flex',
          alignItems: 'center',
          gap: '7px',

          zIndex: 4,
        }}
      >
        {IMAGES.map((_, index) => {
          const isActive = index === currentIndex;

          return (
            <button
              key={index}
              type="button"
              onClick={() => changeSlide(index)}
              aria-label={`Show background ${index + 1}`}
              aria-current={
                isActive ? 'true' : undefined
              }
              style={{
                width: isActive ? '26px' : '7px',
                height: '7px',
                padding: 0,

                border: 0,
                borderRadius: '999px',
                cursor: 'pointer',

                background: isActive
                  ? 'rgba(255, 255, 255, 0.88)'
                  : 'rgba(255, 255, 255, 0.32)',

                transition:
                  'width 700ms ease, background-color 700ms ease',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}