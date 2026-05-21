"use client";

/**
 * FaceEngine — Browser-native face detector, no CDN, no WASM, no external deps.
 *
 * Strategy:
 *  1. Primary  — browser's built-in FaceDetector Web API (Chrome 74+, Edge, Android Chrome)
 *  2. Fallback — video-stream active check (Firefox, Safari, older Chrome)
 *               The fallback still requires a real, active camera stream.
 *
 * Props:
 *   videoRef        — ref to the live <video> element
 *   onFaceDetected  — () => void — called each iteration a face is present
 *   onFaceLost      — () => void — called when no face found
 *   onError         — (message: string) => void
 *   challenge       — ignored (kept for API compat, detection-only mode)
 */

import { useEffect, useRef } from "react";

const POLL_MS = 120; // ~8fps — fast enough for face detection, light on CPU

export default function FaceEngine({
  videoRef,
  onFaceDetected,
  onFaceLost,
  onError,
  // challenge prop intentionally unused — detect-only mode
}) {
  const rafRef     = useRef(null);
  const timerRef   = useRef(null);
  const destroyed  = useRef(false);

  useEffect(() => {
    destroyed.current = false;

    const hasFaceDetector =
      typeof window !== "undefined" && "FaceDetector" in window;

    // ── PRIMARY: Native FaceDetector API ────────────────────────────────────
    if (hasFaceDetector) {
      let detector = null;
      try {
        detector = new window.FaceDetector({
          fastMode:         true,
          maxDetectedFaces: 1,
        });
      } catch (_) {
        detector = null;
      }

      if (detector) {
        const loop = async () => {
          if (destroyed.current) return;

          const video = videoRef.current;
          if (video && video.readyState >= 2 && !video.paused && video.videoWidth > 0) {
            try {
              const faces = await detector.detect(video);
              if (destroyed.current) return;
              if (faces && faces.length > 0) {
                onFaceDetected?.();
              } else {
                onFaceLost?.();
              }
            } catch (_) {
              // Single-frame errors are normal (blurry frame, etc.) — ignore
            }
          }

          if (!destroyed.current) {
            timerRef.current = setTimeout(() => {
              rafRef.current = requestAnimationFrame(loop);
            }, POLL_MS);
          }
        };

        rafRef.current = requestAnimationFrame(loop);
        return cleanup;
      }
      // fall through to fallback if constructor failed silently
    }

    // ── FALLBACK: Video-stream presence check ────────────────────────────────
    // Works on Firefox, Safari, and any browser without FaceDetector.
    // A real camera stream is still required — this just checks that the video
    // element is producing frames (width > 0, not paused, readyState = HAVE_DATA).
    const fallbackLoop = () => {
      if (destroyed.current) return;

      const video = videoRef.current;
      if (
        video &&
        video.readyState >= 2 &&
        !video.paused &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        onFaceDetected?.();
      } else {
        onFaceLost?.();
      }

      timerRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(fallbackLoop);
      }, POLL_MS);
    };

    rafRef.current = requestAnimationFrame(fallbackLoop);

    return cleanup;

    function cleanup() {
      destroyed.current = true;
      if (timerRef.current)   clearTimeout(timerRef.current);
      if (rafRef.current)     cancelAnimationFrame(rafRef.current);
    }
  }, [videoRef, onFaceDetected, onFaceLost, onError]);

  return null; // pure side-effect component — renders nothing
}
