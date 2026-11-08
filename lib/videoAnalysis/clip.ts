// Uploaded-clip analysis — the pure parts (limits, progress writes, result → Firestore patch,
// skeleton thumbnail geometry). Unit-tested in tests/clipAnalysis.test.ts.
//
// Privacy: the clip is played and analysed in the user's browser by the same MediaPipe pipeline
// as a live round (hooks/usePoseDetection). The video never leaves the device; Firestore gets
// numbers and a thumbnail that is ONLY the drawn skeleton (no pixels from the video).

export type ClipErrorCode =
  | "not_video" | "too_large" | "too_short" | "too_long" | "unsupported_video"
  | "model_load_failed" | "no_body_detected" | "interrupted" | "save_failed";

export const CLIP_LIMITS = {
  maxBytes: 300 * 1024 * 1024,
  minSec: 3,
  maxSec: 180,
  /** Firestore rule caps thumbnailUrl at 24 KB; the skeleton JPEG is ~3–6 KB. */
  maxThumbChars: 24_576,
} as const;

/** File checks before anything is read. */
export function validateClipFile(f: { type?: string; size?: number }): ClipErrorCode | null {
  if (!f.type || !f.type.startsWith("video/")) return "not_video";
  if (!(typeof f.size === "number" && f.size > 0)) return "unsupported_video";
  if (f.size > CLIP_LIMITS.maxBytes) return "too_large";
  return null;
}

/** Duration checks once the browser has read the metadata (NaN / ∞ = it can't decode it). */
export function validateClipDuration(sec: number): ClipErrorCode | null {
  if (!Number.isFinite(sec) || sec <= 0) return "unsupported_video";
  if (sec < CLIP_LIMITS.minSec) return "too_short";
  if (sec > CLIP_LIMITS.maxSec) return "too_long";
  return null;
}

/** Progress (0..100) from the playback position. */
export function clipProgress(currentTime: number, duration: number): number {
  if (!(duration > 0) || !Number.isFinite(currentTime)) return 0;
  return Math.max(0, Math.min(100, Math.round((currentTime / duration) * 100)));
}

/** Firestore gets a progress write only every `step` % (≤ 10 writes per clip). → value to write, or null. */
export function nextProgressWrite(lastWritten: number, pct: number, step = 10): number | null {
  const bucket = Math.floor(pct / step) * step;
  return bucket > lastWritten && bucket < 100 ? bucket : null;
}

export interface ClipSummaryInput {
  /** usePoseDetection().computeSessionSummary() — null when < 5 pose frames */
  summary: { score?: unknown; punchCount?: unknown } | null;
  /** usePoseDetection().getDebugInfo() */
  debug: { framesAttempted?: unknown; framesWithBody?: unknown } | null;
}

export type ClipResultPatch =
  | { status: "completed"; score: number | null; punches: number; poseFramesPct: number; error: null }
  | { status: "failed"; error: ClipErrorCode };

/** Analysis result → the Firestore update (shape and ranges match firestore.rules video_analyses). */
export function clipResultPatch({ summary, debug }: ClipSummaryInput): ClipResultPatch {
  const attempted = Number(debug?.framesAttempted) || 0;
  const withBody = Number(debug?.framesWithBody) || 0;
  if (!summary || withBody === 0) return { status: "failed", error: "no_body_detected" };
  const score = Number(summary.score);
  const punches = Number(summary.punchCount);
  return {
    status: "completed",
    // computeFinalScore returns null when no form check could be measured — stored as null, not 0
    score: summary.score != null && Number.isFinite(score) ? Math.round(Math.min(10, Math.max(0, score)) * 10) / 10 : null,
    punches: Number.isFinite(punches) ? Math.max(0, Math.min(5000, Math.round(punches))) : 0,
    poseFramesPct: attempted > 0 ? Math.round(Math.min(100, (withBody / attempted) * 100)) : 0,
    error: null,
  };
}

// ── Skeleton thumbnail geometry ────────────────────────────────────────────
export interface Pt { x: number; y: number; visibility?: number; held?: boolean }

const EDGES: Array<[number, number]> = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
];
const JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
const MIN_VIS = 0.5;

/** Landmarks (0..1 of a w×h frame) → lines and joints fitted into a size×size square, aspect
 *  kept, body centred with padding. null when fewer than 4 joints are visible. */
export function thumbGeometry(lm: Pt[] | null | undefined, frameW: number, frameH: number, size: number, pad = 0.12) {
  if (!lm || lm.length < 29 || !(frameW > 0 && frameH > 0)) return null;
  const vis = (i: number) => !!lm[i] && Number.isFinite(lm[i].x) && Number.isFinite(lm[i].y) && ((lm[i].visibility ?? 1) >= MIN_VIS || !!lm[i].held);
  const used = JOINTS.filter(vis);
  if (used.length < 4) return null;
  const px = (i: number) => ({ x: lm[i].x * frameW, y: lm[i].y * frameH });
  const xs = used.map((i) => px(i).x);
  const ys = used.map((i) => px(i).y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY, 1);
  const scale = (size * (1 - 2 * pad)) / span;
  const ox = size / 2 - ((minX + maxX) / 2) * scale;
  const oy = size / 2 - ((minY + maxY) / 2) * scale;
  const at = (i: number) => { const p = px(i); return { x: ox + p.x * scale, y: oy + p.y * scale }; };
  return {
    lines: EDGES.filter(([a, b]) => vis(a) && vis(b)).map(([a, b]) => [at(a), at(b)] as const),
    joints: used.filter((i) => i !== 0).map((i) => ({ ...at(i), hand: i === 15 || i === 16 })),
    head: vis(0) ? at(0) : null,
  };
}
