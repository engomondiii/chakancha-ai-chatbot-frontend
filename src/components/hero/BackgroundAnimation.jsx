"use client";

import React, { useEffect, useRef } from "react";

const VIDEO_SRC = "/images/backgrounds/herovideo2.mp4";

/*
 * Poster shown while the video loads.
 */
const POSTER_SRC = "/images/backgrounds/heroBg.svg";

/*
 * Crossfade between the two video copies.
 * The loop point is hidden inside this dissolve.
 */
const LOOP_FADE_MS = 2000;

/*
 * Continuous camera drift applied to the wrapper
 * around both video copies, so it never resets
 * when the videos swap.
 */
const CAMERA_DURATION = 26000;

export function BackgroundAnimation() {
  const containerRef = useRef(null);

  const videoARef = useRef(null);
  const videoBRef = useRef(null);

  /*
   * Which copy is currently on top.
   * Held in a ref: the swap is driven directly through
   * the DOM to avoid re-rendering mid-fade.
   */
  const activeRef = useRef("A");
  const fadingRef = useRef(false);

  /* Gentle scroll parallax */
  useEffect(() => {
    let animationFrame = null;

    const handleScroll = () => {
      if (animationFrame) return;

      animationFrame = window.requestAnimationFrame(() => {
        if (containerRef.current) {
          const offset = window.scrollY * 0.1;

          containerRef.current.style.transform = `translate3d(0, ${offset}px, 0)`;
        }

        animationFrame = null;
      });
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  /* =====================================================
     SEAMLESS LOOP

     Two copies of the same video. Shortly before the
     active copy reaches its end, the standby copy starts
     from 0 and crossfades in. The restart is never
     visible because it happens mid-dissolve.
  ===================================================== */

  useEffect(() => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;

    if (!videoA || !videoB) return;

    const getVideos = () =>
      activeRef.current === "A"
        ? { active: videoA, standby: videoB }
        : { active: videoB, standby: videoA };

    const crossfadeToStandby = () => {
      if (fadingRef.current) return;

      fadingRef.current = true;

      const { active, standby } = getVideos();

      standby.currentTime = 0;

      const beginFade = () => {
        /*
         * Opacity transitions are declared inline on
         * both videos, so setting opacity is enough.
         */
        standby.style.opacity = "1";
        active.style.opacity = "0";

        window.setTimeout(() => {
          active.pause();

          activeRef.current = activeRef.current === "A" ? "B" : "A";

          fadingRef.current = false;
        }, LOOP_FADE_MS + 100);
      };

      const playPromise = standby.play();

      if (playPromise?.then) {
        playPromise.then(beginFade).catch(() => {
          /*
           * If the standby copy cannot start, fall back
           * to the native hard loop on the active copy.
           */
          fadingRef.current = false;
        });
      } else {
        beginFade();
      }
    };

    const handleTimeUpdate = (event) => {
      const video = event.currentTarget;

      /*
       * Only the visible copy schedules the swap.
       */
      const { active } = getVideos();

      if (video !== active) return;

      if (!Number.isFinite(video.duration)) return;

      const remaining = video.duration - video.currentTime;

      if (remaining <= LOOP_FADE_MS / 1000 + 0.2) {
        crossfadeToStandby();
      }
    };

    videoA.addEventListener("timeupdate", handleTimeUpdate);
    videoB.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      videoA.removeEventListener("timeupdate", handleTimeUpdate);
      videoB.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  /* =====================================================
     REDUCED MOTION

     Pause whichever copies are playing.
  ===================================================== */

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const applyPreference = () => {
      const videos = [videoARef.current, videoBRef.current];

      videos.forEach((video) => {
        if (!video) return;

        if (media.matches) {
          video.pause();
        } else if (video.style.opacity !== "0") {
          video.play().catch(() => {
            // Autoplay may be blocked; the poster remains visible.
          });
        }
      });
    };

    applyPreference();

    media.addEventListener("change", applyPreference);

    return () => {
      media.removeEventListener("change", applyPreference);
    };
  }, []);

  const videoStyle = (isInitiallyActive) => ({
    position: "absolute",
    inset: 0,

    width: "100%",
    height: "100%",

    objectFit: "cover",
    objectPosition: "center 30%",

    filter: "saturate(0.88) contrast(1.04) brightness(0.94)",

    opacity: isInitiallyActive ? 1 : 0,

    /*
     * A linear dissolve reads most photographic;
     * both copies fade over the same window so the
     * combined brightness stays constant.
     */
    transition: `opacity ${LOOP_FADE_MS}ms linear`,

    pointerEvents: "none",

    backfaceVisibility: "hidden",
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",

        /*
         * Extra area prevents empty edges during
         * the pan-and-zoom movement and parallax.
         */
        inset: "-5%",

        zIndex: 0,
        overflow: "hidden",
        willChange: "transform",
        backfaceVisibility: "hidden",
      }}
    >
      {/* Continuous camera drift */}
      <style>
        {`
          @keyframes chakanchaCameraDrift {
            from {
              transform: translate3d(-0.6%, 0.3%, 0) scale(1.055);
            }

            to {
              transform: translate3d(0.6%, -0.3%, 0) scale(1.08);
            }
          }

          .chakancha-camera {
            position: absolute;
            inset: 0;

            transform-origin: 50% 45%;

            will-change: transform;

            animation:
              chakanchaCameraDrift ${CAMERA_DURATION}ms
              ease-in-out infinite alternate;
          }

          @media (prefers-reduced-motion: reduce) {
            .chakancha-camera {
              animation: none !important;
              transform: scale(1.055) !important;
            }
          }
        `}
      </style>

      {/*
       * The drift lives on this wrapper, not on the
       * videos, so camera motion is continuous across
       * the loop crossfade.
       */}
      <div className="chakancha-camera">
        <video
          ref={videoARef}
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          style={videoStyle(true)}
        />

        <video
          ref={videoBRef}
          src={VIDEO_SRC}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          style={videoStyle(false)}
        />
      </div>
    </div>
  );
}
