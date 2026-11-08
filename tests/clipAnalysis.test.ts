import { describe, it, expect } from "vitest";
import {
  CLIP_LIMITS, clipProgress, clipResultPatch, nextProgressWrite, thumbGeometry, validateClipDuration, validateClipFile,
} from "@/lib/videoAnalysis/clip";
import { memoryClipStore } from "@/lib/videoAnalysis/store";

describe("clip limits", () => {
  it("file: video only, not empty, ≤ 300 MB", () => {
    expect(validateClipFile({ type: "image/png", size: 10 })).toBe("not_video");
    expect(validateClipFile({ type: "", size: 10 })).toBe("not_video");
    expect(validateClipFile({ type: "video/mp4", size: 0 })).toBe("unsupported_video");
    expect(validateClipFile({ type: "video/mp4", size: CLIP_LIMITS.maxBytes + 1 })).toBe("too_large");
    expect(validateClipFile({ type: "video/quicktime", size: 5_000_000 })).toBeNull();
  });
  it("duration: 3 s – 3 min; NaN / ∞ = can't decode", () => {
    expect(validateClipDuration(Number.NaN)).toBe("unsupported_video");
    expect(validateClipDuration(Infinity)).toBe("unsupported_video");
    expect(validateClipDuration(2.9)).toBe("too_short");
    expect(validateClipDuration(181)).toBe("too_long");
    expect(validateClipDuration(15)).toBeNull();
  });
});

describe("progress", () => {
  it("percent from playback position, clamped", () => {
    expect(clipProgress(5, 20)).toBe(25);
    expect(clipProgress(25, 20)).toBe(100);
    expect(clipProgress(1, 0)).toBe(0);
  });
  it("writes only on each new 10 % step, never 100 (the result write ends it)", () => {
    expect(nextProgressWrite(0, 9)).toBeNull();
    expect(nextProgressWrite(0, 14)).toBe(10);
    expect(nextProgressWrite(10, 19)).toBeNull();
    expect(nextProgressWrite(10, 47)).toBe(40);
    expect(nextProgressWrite(90, 100)).toBeNull();
  });
});

describe("result patch", () => {
  it("completed: rounded score in 0..10, punches, pose-frame share", () => {
    expect(clipResultPatch({ summary: { score: 7.26, punchCount: 31 }, debug: { framesAttempted: 120, framesWithBody: 111 } }))
      .toEqual({ status: "completed", score: 7.3, punches: 31, poseFramesPct: 93, error: null });
    expect(clipResultPatch({ summary: { score: 14, punchCount: -3 }, debug: { framesAttempted: 10, framesWithBody: 10 } }))
      .toMatchObject({ score: 10, punches: 0, poseFramesPct: 100 });
  });
  it("a score the formula couldn't compute stays null (not 0)", () => {
    expect(clipResultPatch({ summary: { score: null, punchCount: 1 }, debug: { framesAttempted: 30, framesWithBody: 30 } }))
      .toMatchObject({ status: "completed", score: null, punches: 1 });
  });
  it("no summary or no body → failed no_body_detected (never a made-up score)", () => {
    expect(clipResultPatch({ summary: null, debug: { framesAttempted: 50, framesWithBody: 2 } })).toEqual({ status: "failed", error: "no_body_detected" });
    expect(clipResultPatch({ summary: { score: 5 }, debug: { framesAttempted: 50, framesWithBody: 0 } })).toEqual({ status: "failed", error: "no_body_detected" });
  });
});

describe("skeleton thumbnail geometry", () => {
  const body = () => Array.from({ length: 33 }, (_, i) => ({ x: 0.4 + (i % 5) * 0.02, y: 0.2 + i * 0.015, visibility: 0.9 }));
  it("fits the visible body into the square with padding", () => {
    const g = thumbGeometry(body(), 480, 640, 160)!;
    expect(g.lines.length).toBe(12);
    const pts = [...g.joints, ...g.lines.flatMap(([a, b]) => [a, b])];
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(160 * 0.12 - 0.01);
      expect(p.x).toBeLessThanOrEqual(160 * 0.88 + 0.01);
      expect(p.y).toBeGreaterThanOrEqual(160 * 0.12 - 0.01);
      expect(p.y).toBeLessThanOrEqual(160 * 0.88 + 0.01);
    }
    expect(g.joints.filter((j) => j.hand)).toHaveLength(2);
  });
  it("null when the body isn't there", () => {
    expect(thumbGeometry(null, 480, 640, 160)).toBeNull();
    const hidden = body().map((p) => ({ ...p, visibility: 0.1 }));
    expect(thumbGeometry(hidden, 480, 640, 160)).toBeNull();
  });
});

describe("memory store", () => {
  it("records queued → updates in order", async () => {
    const seen: number[] = [];
    const s = memoryClipStore((log) => seen.push(log.length));
    const id = await s.create({ durationSec: 12 });
    await s.update(id, { status: "processing", progressPct: 10 });
    await s.update(id, { status: "completed", score: 7, punches: 20, poseFramesPct: 90, error: null });
    expect(s.log.map((e) => e.data.status)).toEqual(["queued", "processing", "completed"]);
    expect(seen).toEqual([1, 2, 3]);
  });
});
