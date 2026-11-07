import { describe, it, expect } from "vitest";
import { teardownPunch, teardownAll, phaseAt, syntheticReplay, elbowAngle, armExtension, PHASES } from "@/lib/punchTeardown";

describe("punch teardown on a synthetic round", () => {
  const replay = syntheticReplay({ punches: 4 });

  it("takes every punch apart into four ordered phases", () => {
    const all = teardownAll(replay);
    expect(all).toHaveLength(4);
    for (const { teardown: td } of all) {
      expect(td.phases.map((p) => p.key)).toEqual(PHASES);
      for (let i = 1; i < td.phases.length; i++) expect(td.phases[i].startT).toBeGreaterThanOrEqual(td.phases[i - 1].startT);
      expect(td.startT).toBeLessThan(td.peakT);
      expect(td.peakT).toBeLessThan(td.endT);
    }
  });

  it("finds the peak at the detected moment and measures a straight, fast punch", () => {
    const td = teardownPunch(replay, replay.punches[0]);
    expect(td.hand).toBe("left");
    expect(Math.abs(td.peakT - replay.punches[0].t)).toBeLessThanOrEqual(60);
    expect(td.metrics.elbowDeg).toBeGreaterThanOrEqual(165);
    expect(td.metrics.reachPct).toBeGreaterThanOrEqual(95);
    expect(td.metrics.loadMs).toBeGreaterThan(100);
    expect(td.metrics.loadMs).toBeLessThan(400);
    expect(td.metrics.returnMs).toBeLessThanOrEqual(450);
    expect(td.metrics.guardUp).toBe(true);
    expect(td.grade).toBe("good");
  });

  it("sees the shoulders and hips turn into a cross", () => {
    const td = teardownPunch(replay, replay.punches[1]);
    expect(td.type).toBe("cross");
    expect(td.metrics.shoulderTurnDeg).toBeGreaterThanOrEqual(20);
    expect(td.metrics.hipTurnDeg).toBeGreaterThanOrEqual(10);
    expect(td.tips.find((t) => t.key === "shoulderTurn").ok).toBe(true);
  });

  it("flags an arm-only cross and a dropped guard", () => {
    const lazy = syntheticReplay({ punches: 2, lazyCross: true, dropGuardOn: 1 });
    const td = teardownPunch(lazy, lazy.punches[1]);
    expect(td.tips.find((t) => t.key === "shoulderTurn").ok).toBe(false);
    expect(td.tips.find((t) => t.key === "hipTurn").ok).toBe(false);
    expect(td.tips.find((t) => t.key === "guardHand").ok).toBe(false);
    expect(td.metrics.guardUp).toBe(false);
    expect(td.grade).toBe("fix");
  });

  it("phaseAt walks through the phases", () => {
    const td = teardownPunch(replay, replay.punches[0]);
    expect(phaseAt(td, td.startT - 50)).toBe(null);
    expect(phaseAt(td, td.startT)).toBe("load");
    expect(phaseAt(td, td.peakT)).toBe("extend");
    expect(phaseAt(td, (td.peakT + td.endT) / 2)).toBe("return");
  });

  it("infers the hand when the event doesn't say", () => {
    const td = teardownPunch(replay, { t: replay.punches[1].t, type: "punch" });
    expect(td.hand).toBe("right");
  });
});

describe("guards", () => {
  it("returns null for missing data", () => {
    expect(teardownPunch(null, { t: 0 })).toBe(null);
    expect(teardownPunch({ frames: [] }, { t: 0 })).toBe(null);
    expect(teardownPunch(syntheticReplay(), null)).toBe(null);
    expect(teardownAll(null)).toEqual([]);
  });

  it("returns null when nothing moves (no wind-up)", () => {
    const still = syntheticReplay({ punches: 1 });
    const frozen = { ...still, frames: still.frames.map((f) => ({ t: f.t, p: still.frames[0].p })) };
    expect(teardownPunch(frozen, still.punches[0])).toBe(null);
  });

  it("angle and extension helpers stay in range", () => {
    const { frames } = syntheticReplay({ punches: 1 });
    for (const f of frames) {
      for (const hand of ["left", "right"]) {
        const a = elbowAngle(f.p, hand);
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(180);
        expect(armExtension(f.p, hand)).toBeLessThanOrEqual(1.0001);
      }
    }
  });
});
