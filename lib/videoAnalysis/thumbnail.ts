// Draws the analysis thumbnail: ONLY the pose skeleton on a dark brand background — no pixels
// from the user's video, so nothing personal leaves the device. Browser-only (canvas).
import { CLIP_LIMITS, thumbGeometry, type Pt } from "./clip";

export function skeletonThumbnail(lm: Pt[] | null | undefined, frameW: number, frameH: number, size = 160): string | null {
  if (typeof document === "undefined") return null;
  const g = thumbGeometry(lm, frameW, frameH, size);
  if (!g) return null;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const bg = ctx.createRadialGradient(size / 2, size * 0.32, size * 0.04, size / 2, size / 2, size * 0.78);
  bg.addColorStop(0, "#3b1311");
  bg.addColorStop(1, "#0b0b0d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Same look as the live overlay (components/train/PoseSkeletonOverlay): green bones, gold hands.
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(2, size / 40);
  ctx.strokeStyle = "rgba(52,211,153,0.95)";
  for (const [a, b] of g.lines) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  for (const j of g.joints) {
    ctx.fillStyle = j.hand ? "#F5C451" : "#ffffff";
    ctx.beginPath();
    ctx.arc(j.x, j.y, j.hand ? size / 30 : size / 48, 0, Math.PI * 2);
    ctx.fill();
  }
  if (g.head) {
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = Math.max(1.5, size / 64);
    ctx.beginPath();
    ctx.arc(g.head.x, g.head.y, size / 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  const url = canvas.toDataURL("image/jpeg", 0.8);
  return url.length <= CLIP_LIMITS.maxThumbChars ? url : null;
}
