"use client";

import { useEffect, useRef } from "react";
import { coverFit, toBox, SKELETON_EDGES } from "@/lib/pose/overlayGeometry";

// Live skeleton over the camera preview. Built to cost almost nothing next to inference:
//   - its own requestAnimationFrame loop, decoupled from MediaPipe (≈10 fps): it redraws only
//     when a NEW pose frame arrives (frameId changes), otherwise it does no work;
//   - backing store sized to the box × devicePixelRatio (capped at 2) and only resized when
//     the box changes — no per-frame allocation;
//   - stops when the round isn't running or the tab is hidden;
//   - same box + CSS transform as the <video> (mirror / iOS rotation), so the lines sit on
//     the body; `object-fit: cover` cropping is mapped by lib/pose/overlayGeometry.
// data-frames-drawn counts redraws (used by the E2E test).
const MIN_VIS = 0.5;

export default function PoseSkeletonOverlay({ getLatestPose, videoRef, isActive, style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    let raf = 0;
    let lastFrame = -1;
    let drawn = 0;
    let boxKey = "";

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (document.visibilityState !== "visible") return;
      const { landmarks, frameId } = getLatestPose() || {};
      if (frameId === lastFrame) return;
      lastFrame = frameId;
      const video = videoRef.current;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const key = `${w}x${h}@${dpr}`;
      if (key !== boxKey) { boxKey = key; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const fit = video ? coverFit(video.videoWidth, video.videoHeight, w, h) : null;
      if (!landmarks || !fit) return;
      const p = (i) => toBox(landmarks[i], video.videoWidth, video.videoHeight, fit);
      const ok = (i) => landmarks[i] && (landmarks[i].visibility ?? 1) >= MIN_VIS;
      ctx.lineCap = "round";
      ctx.lineWidth = 3;
      for (const [a, b] of SKELETON_EDGES) {
        if (!landmarks[a] || !landmarks[b] || !(ok(a) || landmarks[a].held) || !(ok(b) || landmarks[b].held)) continue;
        const A = p(a), B = p(b);
        ctx.strokeStyle = landmarks[a].held || landmarks[b].held ? "rgba(255,255,255,0.35)" : "rgba(52,211,153,0.9)";
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      }
      for (const i of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
        if (!ok(i)) continue;
        const P = p(i);
        ctx.fillStyle = i === 15 || i === 16 ? "#F5C451" : "#ffffff";
        ctx.beginPath(); ctx.arc(P.x, P.y, i === 15 || i === 16 ? 6 : 4, 0, Math.PI * 2); ctx.fill();
      }
      drawn++;
      canvas.dataset.framesDrawn = String(drawn);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, canvas.width, canvas.height); };
  }, [isActive, getLatestPose, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="pose-overlay"
      aria-hidden="true"
      // zIndex 6: above the stage's dim / shade layers (≤ 5), below the HUD (9+).
      // A <canvas> is a replaced element: `inset: 0` alone doesn't size it (it stays 300×150), so
      // without a style it fills its box explicitly. (Train passes the video's own box style.)
      style={{
        ...style,
        position: style?.position || "absolute",
        inset: style?.position ? undefined : 0,
        width: style?.width ?? "100%",
        height: style?.height ?? "100%",
        pointerEvents: "none",
        zIndex: 6,
      }}
    />
  );
}
