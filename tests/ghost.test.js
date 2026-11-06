import { describe, it, expect } from "vitest";
import { buildJabCrossReference } from "@/lib/ghost/reference";
import { analyzeGhostRound, measureRound, armReach, shoulderYaw } from "@/lib/ghost/analyze";
import { LM, guardState } from "@/lib/motionReplay";

const ref = buildJabCrossReference({ stance: "orthodox", cycles: 3 });

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
    expect(Math.abs(shoulderYaw(crossPeak) - shoulderYaw(guard))).toBeGreaterThan(20);
  });
  it("mirrors for southpaw (jab from the right hand)", () => {
    const sp = buildJabCrossReference({ stance: "southpaw" });
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
