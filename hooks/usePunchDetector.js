"use client";

import { useCallback, useEffect, useRef } from "react";

// Off-screen canvas resolution — small enough to be fast on mobile
const W = 160;
const H = 120;
const FRAME_MS = 80;           // ~12fps analysis
const MOTION_THRESHOLD = 0.13; // 13% of pixels must change (was 0.05 — too sensitive to body sway)
const SPIKE_MULT = 2.3;        // spike must be 2.3× rolling avg (was 1.8 — too many false positives)
const COOLDOWN_MS = 550;       // min ms between detected punches (was 380)
const HISTORY_SIZE = 6;        // longer rolling window for stable baseline (was 4)
const MAX_MOTION = 0.42;       // full-frame saturation = camera proximity change, not a punch
// Head zone: top 30% of frame, center 50% wide — filters out head turns/nods
const HEAD_Y_MAX = Math.floor(H * 0.30);
const HEAD_X_MIN = Math.floor(W * 0.25);
const HEAD_X_MAX = Math.floor(W * 0.75);
const HEAD_DOMINANCE = 0.60;   // if head zone > 60% of changed pixels → head movement, skip

// Detect punches by analyzing motion spikes in camera frames.
// Uses pure Canvas pixel diff — no ML libraries, instant startup.
// onPunch({ type: "jab"|"cross", speed: 0-1, intensity: number })
export function usePunchDetector({ videoRef, isActive, onPunch }) {
  const canvasRef = useRef(null);
  const prevDataRef = useRef(null);
  const historyRef = useRef([]);
  const lastPunchRef = useRef(0);
  const timerRef = useRef(null);

  const stableOnPunch = useRef(onPunch);
  useEffect(() => { stableOnPunch.current = onPunch; }, [onPunch]);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearTimeout(timerRef.current);
      prevDataRef.current = null;
      historyRef.current = [];
      return;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = W;
      canvasRef.current.height = H;
    }
    const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });

    let active = true;

    function analyze() {
      if (!active) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        timerRef.current = setTimeout(analyze, FRAME_MS);
        return;
      }

      ctx.drawImage(video, 0, 0, W, H);
      const curr = ctx.getImageData(0, 0, W, H).data;

      if (prevDataRef.current) {
        const prev = prevDataRef.current;
        let changed = 0, headChanged = 0, sampled = 0;

        // Sample every 3rd pixel; track head-zone pixels separately
        for (let y = 0; y < H; y += 3) {
          for (let x = 0; x < W; x += 3) {
            const i = (y * W + x) * 4;
            const g1 = (prev[i] * 77 + prev[i+1] * 150 + prev[i+2] * 29) >> 8;
            const g2 = (curr[i] * 77 + curr[i+1] * 150 + curr[i+2] * 29) >> 8;
            if (Math.abs(g1 - g2) > 22) {
              changed++;
              if (y < HEAD_Y_MAX && x >= HEAD_X_MIN && x < HEAD_X_MAX) headChanged++;
            }
            sampled++;
          }
        }

        const ratio = changed / sampled;
        historyRef.current.push(ratio);
        if (historyRef.current.length > HISTORY_SIZE) historyRef.current.shift();

        const rollingAvg = historyRef.current.slice(0, -1).reduce((a, b) => a + b, 0) /
          Math.max(1, historyRef.current.length - 1);

        // Skip: full-frame saturation (proximity change) or head-zone dominates (head movement)
        const headDominant = changed > 0 && (headChanged / changed) > HEAD_DOMINANCE;

        const now = Date.now();
        if (
          ratio > MOTION_THRESHOLD &&
          ratio < MAX_MOTION &&
          !headDominant &&
          ratio > rollingAvg * SPIKE_MULT &&
          now - lastPunchRef.current > COOLDOWN_MS
        ) {
          lastPunchRef.current = now;
          const speed = Math.min(1, ratio / (MOTION_THRESHOLD * 2.5));
          stableOnPunch.current({ speed, intensity: ratio });
        }
      }

      prevDataRef.current = new Uint8ClampedArray(curr);
      timerRef.current = setTimeout(analyze, FRAME_MS);
    }

    analyze();

    return () => {
      active = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      prevDataRef.current = null;
      historyRef.current = [];
    };
  }, [isActive, videoRef]);
}
