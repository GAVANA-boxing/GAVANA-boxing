"use client";

import { useEffect, useRef } from "react";
import { LM, frameIndexAt, isPunchMoment } from "@/lib/motionReplay";

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
        const P = (i) => px(p, i);
        // Hologram look, matching the 3D ghost (lib/three/fighterAvatar.js).
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = "rgba(103,232,249,0.9)";
        ctx.shadowBlur = 10 * dpr;

        // Torso: shoulders → hips, filled glass.
        const [ls, rs, rh, lh] = [P(LM.L_SHOULDER), P(LM.R_SHOULDER), P(LM.R_HIP), P(LM.L_HIP)];
        ctx.fillStyle = "rgba(103,232,249,0.16)";
        ctx.strokeStyle = "rgba(103,232,249,0.85)";
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath(); ctx.moveTo(...ls); ctx.lineTo(...rs); ctx.lineTo(...rh); ctx.lineTo(...lh); ctx.closePath();
        ctx.fill(); ctx.stroke();

        const limb = (a, b, width, color) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = width * dpr;
          ctx.beginPath(); ctx.moveTo(...P(a)); ctx.lineTo(...P(b)); ctx.stroke();
        };
        const legC = "rgba(103,232,249,0.75)";
        for (const [a, b] of [[LM.L_HIP, LM.L_KNEE], [LM.L_KNEE, LM.L_ANKLE], [LM.R_HIP, LM.R_KNEE], [LM.R_KNEE, LM.R_ANKLE]]) limb(a, b, 9, legC);
        const armC = punching ? "rgba(245,196,81,0.95)" : "rgba(103,232,249,0.9)";
        for (const [a, b] of [[LM.L_SHOULDER, LM.L_ELBOW], [LM.L_ELBOW, LM.L_WRIST], [LM.R_SHOULDER, LM.R_ELBOW], [LM.R_ELBOW, LM.R_WRIST]]) limb(a, b, 7, armC);

        // Head.
        const [hx, hy] = P(LM.NOSE);
        ctx.fillStyle = "rgba(103,232,249,0.25)";
        ctx.strokeStyle = "rgba(103,232,249,0.95)";
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath(); ctx.arc(hx, hy - 3 * dpr, 10 * dpr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Gloves: red like the 3D fighter, gold on the punch.
        ctx.shadowColor = punching ? "rgba(245,196,81,0.9)" : "rgba(255,59,48,0.8)";
        for (const w of [LM.L_WRIST, LM.R_WRIST]) {
          const [x, y] = P(w);
          ctx.fillStyle = punching ? "#F5C451" : "#FF3B30";
          ctx.beginPath(); ctx.arc(x, y, 7.5 * dpr, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [replay, size, playing]);

  return <canvas ref={ref} style={{ width: size, height: size * 1.4, display: "block" }} aria-label="Ghost" />;
}
