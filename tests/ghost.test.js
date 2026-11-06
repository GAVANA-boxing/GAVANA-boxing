import { describe, it, expect } from "vitest";
import { buildJabCrossReference } from "@/lib/ghost/reference";
import { analyzeGhostRound, measureRound, armReach, shoulderYaw, angleDiff } from "@/lib/ghost/analyze";
import { LM, guardState } from "@/lib/motionReplay";

// Keyframed reference: exact, known mechanics for the analyzer tests.
const ref = buildJabCrossReference({ stance: "orthodox", cycles: 3, source: "keyframed" });

// Deep-copy a replay so variants can be edited.
const clone = (r) => ({ ...r, frames: r.frames.map((f) => ({ t: f.t, p: new Float32Array(f.p) })), punches: r.punches.map((p) => ({ ...p })) });
const setJ = (p, i, [x, y, z]) => { p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; };
const getJ = (p, i) => [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]];

describe("ghost reference (jab–cross)", () => {
  it("has 3 jabs from the lead hand and 3 crosses from the rear hand", () => {
    expect(ref.punches.filter((p) => p.type === "jab" && p.hand === "left")).toHaveLength(3);
    expect(ref.punches.filter((p) => p.type === "cross" && p.hand === "right")).toHaveLength(3);
    expect(ref.duration).toBe(4800);
  });
  it("actually extends the arms and keeps the rear hand up on the jab", () => {
    const guard = ref.frames[0].p;
    const jabPeak = ref.frames.find((f) => f.t === 400).p;
    const crossPeak = ref.frames.find((f) => f.t === 800).p;
    const lead = { s: LM.L_SHOULDER, w: LM.L_WRIST }, rear = { s: LM.R_SHOULDER, w: LM.R_WRIST };
    expect(armReach(jabPeak, lead)).toBeGreaterThan(armReach(guard, lead) * 1.5);
    expect(armReach(crossPeak, rear)).toBeGreaterThan(armReach(guard, rear) * 1.5);
    expect(guardState(jabPeak).right).toBe("up");
    const turn = angleDiff(shoulderYaw(crossPeak), shoulderYaw(guard));
    expect(turn).toBeGreaterThan(30);
    expect(turn).toBeLessThan(90);
  });
  it("mirrors for southpaw (jab from the right hand)", () => {
    const sp = buildJabCrossReference({ stance: "southpaw", source: "keyframed" });
    expect(sp.punches.filter((p) => p.type === "jab").every((p) => p.hand === "right")).toBe(true);
    const m = measureRound(sp, "southpaw");
    expect(m.combos).toBe(3);
    expect(m.rearGuardOnJab).toBe(1);
  });
});

describe("analyzeGhostRound", () => {
  it("scores the ghost against itself as a near-perfect match", () => {
    const r = analyzeGhostRound(ref, ref, "orthodox");
    expect(r.you.combos).toBe(3);
    expect(r.match).toBeGreaterThanOrEqual(95);
    expect(r.tip).toBe("great");
  });

  it("asks for the one-two when there are no crosses", () => {
    const u = clone(ref);
    u.punches = u.punches.filter((p) => p.type === "jab");
    expect(analyzeGhostRound(u, ref).tip).toBe("combo");
  });

  it("flags a rear hand that drops during the jab (defence first)", () => {
    const u = clone(ref);
    for (const f of u.frames) {
      const tc = f.t % 1600;
      if (tc > 250 && tc < 550) { const w = getJ(f.p, LM.R_WRIST); setJ(f.p, LM.R_WRIST, [w[0], 0.05, w[2]]); }
    }
    const r = analyzeGhostRound(u, ref);
    expect(r.you.rearGuardOnJab).toBe(0);
    expect(r.tip).toBe("guard");
  });

  it("flags an arm-only cross with no shoulder rotation", () => {
    const u = clone(ref);
    const ls = getJ(ref.frames[0].p, LM.L_SHOULDER), rs = getJ(ref.frames[0].p, LM.R_SHOULDER);
    for (const f of u.frames) { setJ(f.p, LM.L_SHOULDER, ls); setJ(f.p, LM.R_SHOULDER, rs); }
    expect(analyzeGhostRound(u, ref).tip).toBe("rotation");
  });

  it("flags punches that stop short", () => {
    const u = clone(ref);
    for (const f of u.frames) {
      for (const [s, w] of [[LM.L_SHOULDER, LM.L_WRIST], [LM.R_SHOULDER, LM.R_WRIST]]) {
        const S = getJ(f.p, s), W = getJ(f.p, w);
        setJ(f.p, w, [S[0] + (W[0] - S[0]) * 0.6, S[1] + (W[1] - S[1]) * 0.6, S[2] + (W[2] - S[2]) * 0.6]);
      }
    }
    expect(analyzeGhostRound(u, ref).tip).toBe("reach");
  });

  it("handles an empty round without crashing", () => {
    const r = analyzeGhostRound(null, ref);
    expect(r.tip).toBe("combo");
    expect(r.match).toBeLessThan(30);
  });
});

describe("angleDiff", () => {
  it("wraps across ±180° (a fighter facing the camera sits right on that boundary)", () => {
    expect(angleDiff(170, -170)).toBeCloseTo(20, 6);
    expect(angleDiff(160.6, -145.8)).toBeCloseTo(53.6, 1);
    expect(angleDiff(10, 350)).toBeCloseTo(20, 6);
    expect(angleDiff(45, 45)).toBe(0);
  });
});

describe("motion-capture reference (CMU 14_03, default ghost)", () => {
  const mocap = buildJabCrossReference({ stance: "orthodox", cycles: 3 });
  it("is a real jab–cross: 3 combos, full reach, the shoulders turn on the cross", () => {
    const m = measureRound(mocap, "orthodox");
    expect(mocap.source).toMatch(/CMU/);
    expect(m.combos).toBe(3);
    expect(m.jabReach).toBeGreaterThan(1.1);
    expect(m.crossReach).toBeGreaterThan(1.1);
    expect(m.crossRotation).toBeGreaterThan(15);
    expect(m.crossRotation).toBeLessThan(70);
  });
  it("teaches a correct guard: rear hand up on every jab, never dropped", () => {
    expect(measureRound(mocap, "orthodox").rearGuardOnJab).toBe(1);
    for (const f of mocap.frames) {
      const g = guardState(f.p);
      expect(g.left === "up" && g.right === "up").toBe(true);
    }
  });
  it("loops without a jump (last frame ≈ first frame)", () => {
    const n = mocap.frames.length / 3;
    const a = mocap.frames[n - 1].p, b = mocap.frames[n].p;
    let maxJump = 0;
    for (let i = 0; i < a.length; i++) maxJump = Math.max(maxJump, Math.abs(a[i] - b[i]));
    expect(maxJump).toBeLessThan(0.08);
  });
  it("mirrors for southpaw and still matches itself", () => {
    const sp = buildJabCrossReference({ stance: "southpaw" });
    expect(sp.punches.find((p) => p.type === "jab").hand).toBe("right");
    expect(analyzeGhostRound(sp, sp, "southpaw").tip).toBe("great");
    expect(analyzeGhostRound(mocap, mocap, "orthodox").match).toBeGreaterThanOrEqual(95);
  });
});
