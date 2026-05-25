"use client";
import { useEffect, useRef } from "react";

// Guard deltaY axis range (positive = hand below nose)
const Y_MIN   = -0.22; // above nose
const Y_MAX   =  0.42; // well below nose
const Y_RANGE = Y_MAX - Y_MIN;

// Match thresholds from mediapipePoseMetrics.js
const GUARD_TOO_LOW  =  0.20;
const GUARD_TOO_HIGH = -0.12;

const DPR = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;

/**
 * Renders a guard-height timeline with punch event markers.
 *
 * motionHistory: {
 *   durationMs,
 *   guardTimeline: [{ t: 0-1, deltaY, status }],
 *   punchTimeline: [{ t: 0-1, type, hand, peakAngle }],
 * }
 */
export default function MotionChart({ motionHistory }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !motionHistory?.guardTimeline?.length) return;

    const CSS_W = canvas.offsetWidth || 280;
    const CSS_H = 88;

    canvas.width  = CSS_W * DPR;
    canvas.height = CSS_H * DPR;
    canvas.style.width  = `${CSS_W}px`;
    canvas.style.height = `${CSS_H}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(DPR, DPR);

    const W = CSS_W;
    const H = CSS_H;

    const toX = (t)      => Math.round(t * W);
    const toY = (deltaY) => Math.round(H - ((deltaY - Y_MIN) / Y_RANGE) * H);

    // ── Background ──────────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, W, H);

    // ── Zone fills ──────────────────────────────────────────────────────────
    const yGoodTop = toY(GUARD_TOO_LOW);
    const yGoodBot = toY(GUARD_TOO_HIGH);
    const yNose    = toY(0);

    // Too-low zone (red, above canvas → down to good line)
    ctx.fillStyle = "rgba(248,113,113,0.07)";
    ctx.fillRect(0, 0, W, yGoodTop);

    // Good zone (green tint)
    ctx.fillStyle = "rgba(52,211,153,0.05)";
    ctx.fillRect(0, yGoodTop, W, yGoodBot - yGoodTop);

    // Too-high zone (blue tint)
    ctx.fillStyle = "rgba(96,165,250,0.05)";
    ctx.fillRect(0, yGoodBot, W, H - yGoodBot);

    // ── Threshold lines ──────────────────────────────────────────────────────
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 1;

    ctx.strokeStyle = "rgba(248,113,113,0.3)";
    ctx.beginPath(); ctx.moveTo(0, yGoodTop); ctx.lineTo(W, yGoodTop); ctx.stroke();

    ctx.strokeStyle = "rgba(52,211,153,0.2)";
    ctx.beginPath(); ctx.moveTo(0, yGoodBot); ctx.lineTo(W, yGoodBot); ctx.stroke();

    // Nose level
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath(); ctx.moveTo(0, yNose); ctx.lineTo(W, yNose); ctx.stroke();

    ctx.setLineDash([]);

    // ── Punch markers ────────────────────────────────────────────────────────
    for (const p of motionHistory.punchTimeline || []) {
      const x = toX(p.t);
      ctx.strokeStyle = p.hand === "left"
        ? "rgba(148,163,184,0.45)"
        : "rgba(245,196,81,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    // ── Guard line ───────────────────────────────────────────────────────────
    const timeline = motionHistory.guardTimeline;
    if (timeline.length < 2) return;

    // Draw colored segments based on status
    for (let i = 1; i < timeline.length; i++) {
      const prev = timeline[i - 1];
      const curr = timeline[i];
      const status = prev.status;
      ctx.strokeStyle =
        status === "too_low"  ? "rgba(248,113,113,0.85)" :
        status === "too_high" ? "rgba(96,165,250,0.7)"   :
        "rgba(255,255,255,0.75)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(toX(prev.t), toY(prev.deltaY));
      ctx.lineTo(toX(curr.t), toY(curr.deltaY));
      ctx.stroke();
    }

    // ── Axis labels ──────────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = `${7 * DPR / DPR}px monospace`;
    ctx.fillText("GUARD", 3, yGoodBot - 3);

    // Duration label right edge
    const secs = Math.round(motionHistory.durationMs / 1000);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.textAlign = "right";
    ctx.fillText(`${secs}s`, W - 3, H - 3);
  }, [motionHistory]);

  if (!motionHistory?.guardTimeline?.length) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%", display: "block",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    />
  );
}
