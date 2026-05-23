"use client";

import { useEffect, useRef } from "react";
import { analyzeMovement, createAnalyzerState } from "@/lib/movementAnalyzer";

const W = 160;
const H = 120;
const FRAME_MS = 125; // ~8fps — independent of punch detector's 12fps loop

export function useMovementAnalyzer({ videoRef, isActive, onEvent }) {
  const canvasRef = useRef(null);
  const prevDataRef = useRef(null);
  const stateRef = useRef(createAnalyzerState());
  const timerRef = useRef(null);

  const stableOnEvent = useRef(onEvent);
  useEffect(() => { stableOnEvent.current = onEvent; }, [onEvent]);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearTimeout(timerRef.current);
      prevDataRef.current = null;
      stateRef.current = createAnalyzerState();
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
        const { events, updatedState } = analyzeMovement(
          curr, prevDataRef.current, stateRef.current
        );
        stateRef.current = updatedState;
        if (events.length > 0) {
          stableOnEvent.current?.(events);
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
      stateRef.current = createAnalyzerState();
    };
  }, [isActive, videoRef]);
}
