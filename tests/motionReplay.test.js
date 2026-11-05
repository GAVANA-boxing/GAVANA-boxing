import { describe, it, expect } from "vitest";
import {
  createReplayRecorder, buildReplay, frameIndexAt, nextPunchAfter, isPunchMoment,
  guardState, guardDropRatio, floorY, JOINTS, LM, BONES,
} from "@/lib/motionReplay";

// A standing pose (world coords, y-down, meters). Hands up = wrists above shoulders.
function pose({ handsUp = true, ankleY = 0.85 } = {}) {
  const pts = Array.from({ length: JOINTS }, () => ({ x: 0, y: 0, z: 0 }));
  pts[LM.L_SHOULDER] = { x: 0.18, y: -0.45, z: 0 };
  pts[LM.R_SHOULDER] = { x: -0.18, y: -0.45, z: 0 };
  const wy = handsUp ? -0.5 : -0.05;
  pts[LM.L_WRIST] = { x: 0.12, y: wy, z: -0.2 };
  pts[LM.R_WRIST] = { x: -0.12, y: wy, z: -0.2 };
  pts[LM.L_ANKLE] = { x: 0.1, y: ankleY, z: 0 };
  pts[LM.R_ANKLE] = { x: -0.1, y: ankleY, z: 0 };
  return pts;
}

function recordSession(n, { handsUpFn = () => true, step = 50 } = {}) {
  const rec = createReplayRecorder({ smoothing: 1 });
  for (let i = 0; i < n; i++) rec.push(pose({ handsUp: handsUpFn(i) }), 1000 + i * step);
  return rec;
}

describe("createReplayRecorder", () => {
  it("throttles frames closer than minIntervalMs", () => {
    const rec = createReplayRecorder({ minIntervalMs: 50 });
    expect(rec.push(pose(), 0)).toBe(true);
    expect(rec.push(pose(), 20)).toBe(false);
    expect(rec.push(pose(), 60)).toBe(true);
    expect(rec.size()).toBe(2);
  });
  it("caps memory by dropping the oldest frames", () => {
    const rec = createReplayRecorder({ maxFrames: 5, minIntervalMs: 0 });
    for (let i = 0; i < 12; i++) rec.push(pose(), i);
    const snap = rec.snapshot();
    expect(snap.length).toBe(5);
    expect(snap[0].ts).toBe(7);
  });
  it("ignores incomplete landmark sets and resets cleanly", () => {
    const rec = createReplayRecorder();
    expect(rec.push([{ x: 1 }], 0)).toBe(false);
    rec.push(pose(), 0);
    rec.reset();
    expect(rec.size()).toBe(0);
  });
  it("smooths jitter between frames", () => {
    const rec = createReplayRecorder({ minIntervalMs: 0, smoothing: 0.5 });
    const a = pose(); const b = pose();
    b[LM.L_WRIST] = { x: 1.12, y: -0.5, z: -0.2 };
    rec.push(a, 0); rec.push(b, 1);
    const p = rec.snapshot()[1].p;
    expect(p[LM.L_WRIST * 3]).toBeCloseTo(0.62, 5); // halfway between 0.12 and 1.12
  });
});

describe("buildReplay", () => {
  it("returns null when there is too little motion", () => {
    expect(buildReplay(recordSession(5).snapshot())).toBeNull();
    expect(buildReplay(null)).toBeNull();
  });
  it("re-times frames from 0 and keeps only punches inside the window", () => {
    const r = buildReplay(recordSession(40).snapshot(), [
      { ts: 500, type: "jab" },          // before start → dropped
      { ts: 1100, type: "cross", hand: "right" },
      { ts: 1500, type: "jab", hand: "left" },
      { ts: 9999, type: "hook" },        // after end → dropped
    ]);
    expect(r.frames[0].t).toBe(0);
    expect(r.duration).toBe(39 * 50);
    expect(r.punches.map((p) => p.t)).toEqual([100, 500]);
  });
});

describe("timeline helpers", () => {
  const r = buildReplay(recordSession(40).snapshot(), [{ ts: 1100, type: "cross" }, { ts: 1500, type: "jab" }]);
  it("finds the frame at a time", () => {
    expect(frameIndexAt(r, -5)).toBe(0);
    expect(frameIndexAt(r, 0)).toBe(0);
    expect(frameIndexAt(r, 149)).toBe(2);
    expect(frameIndexAt(r, 150)).toBe(3);
    expect(frameIndexAt(r, 1e9)).toBe(39);
  });
  it("jumps to the next punch and flags punch moments", () => {
    expect(nextPunchAfter(r, 0).t).toBe(100);
    expect(nextPunchAfter(r, 100).t).toBe(500);
    expect(nextPunchAfter(r, 500)).toBeNull();
    expect(isPunchMoment(r, 300)).toBe(true);  // 200ms after the 100ms punch
    expect(isPunchMoment(r, 900)).toBe(false); // 400ms after the last punch
    expect(isPunchMoment(r, 450)).toBe(true);
  });
});

describe("guard analysis (real data, not guesses)", () => {
  it("detects hands up vs down", () => {
    const flat = (pts) => { const p = new Float32Array(JOINTS * 3); pts.forEach((v, i) => { p[i * 3] = v.x; p[i * 3 + 1] = v.y; p[i * 3 + 2] = v.z; }); return p; };
    expect(guardState(flat(pose({ handsUp: true })))).toEqual({ left: "up", right: "up" });
    expect(guardState(flat(pose({ handsUp: false })))).toEqual({ left: "down", right: "down" });
  });
  it("measures how often the guard dropped outside punches", () => {
    const r = buildReplay(recordSession(40, { handsUpFn: (i) => i < 30 }).snapshot());
    expect(guardDropRatio(r)).toBeCloseTo(10 / 40, 5);
  });
  it("finds the floor from the ankles, with a fallback", () => {
    const r = buildReplay(recordSession(20).snapshot());
    expect(floorY(r)).toBeCloseTo(0.85, 5);
    expect(floorY({ frames: [] })).toBe(0.9);
  });
  it("only references valid landmark indices", () => {
    for (const [a, b] of BONES) { expect(a).toBeLessThan(JOINTS); expect(b).toBeLessThan(JOINTS); }
  });
});
