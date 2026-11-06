"use client";

import { useEffect, useRef } from "react";
import { BONES, LM, frameIndexAt, isPunchMoment } from "@/lib/motionReplay";

/**
 * Lightweight 2D ghost (front view, mirrored like a selfie) that loops at real
 * speed. Used during the live round, where a second WebGL scene next to the
 * running pose model would be too heavy for phones.
 */
export default function GhostCanvas2D({ replay, size = 150, playing = true }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !replay?.frames?.length) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = size * dpr;
    cv.height = size * 1.4 * dpr;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;
    // World y spans roughly -0.7 (head) … 0.9 (feet) → fit with a margin.
    const scale = H / 1.8;
    const px = (p, i) => [W / 2 - p[i * 3] * scale, H * 0.42 + p[i * 3 + 1] * scale];

    let raf, start = performance.now();
    const draw = (now) => {
      const t = playing ? (now - start) % Math.max(replay.duration, 1) : 0;
      const fr = replay.frames[Math.max(0, frameIndexAt(replay, t))];
      ctx.clearRect(0, 0, W, H);
      if (fr) {
        const p = fr.p;
        const punching = isPunchMoment(replay, t);
        ctx.lineCap = "round";
        for (const [a, b] of BONES) {
          const arm = a <= 22 && b <= 22 && a >= 11;
          ctx.strokeStyle = punching && arm ? "rgba(255,59,48,0.95)" : "rgba(103,232,249,0.85)";
          ctx.lineWidth = (arm ? 5 : 6) * dpr;
          const [x1, y1] = px(p, a), [x2, y2] = px(p, b);
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
        const [hx, hy] = px(p, LM.NOSE);
        ctx.fillStyle = "rgba(103,232,249,0.9)";
        ctx.beginPath(); ctx.arc(hx, hy, 9 * dpr, 0, Math.PI * 2); ctx.fill();
        for (const w of [LM.L_WRIST, LM.R_WRIST]) {
          const [x, y] = px(p, w);
          ctx.fillStyle = punching ? "#F5C451" : "#22C55E";
          ctx.beginPath(); ctx.arc(x, y, 6 * dpr, 0, Math.PI * 2); ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [replay, size, playing]);

  return <canvas ref={ref} style={{ width: size, height: size * 1.4, display: "block" }} aria-label="Ghost" />;
}
