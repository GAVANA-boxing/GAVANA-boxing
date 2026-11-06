import { describe, it, expect, afterEach, vi } from "vitest";
import { PunchPhaseDetector, _isHook3D, _isLeadHook3D } from "@/lib/punchPhaseDetector";
import FIXTURE from "./fixtures/punch-landmarks.json";

// Replays real, labelled pose sequences through the detector with a simulated
// clock. Truth = peak time (s) of every punch per anatomical hand, plus what
// kind of punch the whole clip is (`types`: straight = jab/cross, or hook).
const MATCH_S = 0.6;

function run(clip, { stance = "southpaw", world = true } = {}) {
  let sim = 1e9;
  vi.spyOn(Date, "now").mockImplementation(() => sim);
  const det = new PunchPhaseDetector();
  det.setStance(stance);
  for (const [t, pts, wpts] of clip.frames) {
    sim = 1e9 + t;
    const L = Array.from({ length: 17 }, () => ({ x: 0, y: 0, z: 0, visibility: 0 }));
    FIXTURE.indices.forEach((idx, k) => { const [x, y, z, visibility] = pts[k]; L[idx] = { x, y, z, visibility }; });
    let W = null;
    if (world) {
      W = Array.from({ length: 17 }, () => ({ x: 0, y: 0, z: 0 }));
      FIXTURE.worldIndices.forEach((idx, k) => { const [x, y, z] = wpts[k]; W[idx] = { x, y, z }; });
    }
    det.update(L, W);
  }
  return det.getPunchEvents().map((e) => ({ t: (e.ts - 1e9) / 1000, hand: e.hand, type: e.type }));
}

function score(events, truth, hand) {
  const got = events.filter((e) => e.hand === hand).map((e) => e.t);
  const used = new Set();
  let hit = 0;
  for (const t of truth[hand]) {
    let best = -1;
    got.forEach((g, i) => { if (!used.has(i) && Math.abs(g - t) <= MATCH_S && (best < 0 || Math.abs(g - t) < Math.abs(got[best] - t))) best = i; });
    if (best >= 0) { used.add(best); hit++; }
  }
  return { hit, phantom: got.length - used.size };
}

afterEach(() => vi.restoreAllMocks());

describe("punch detector on real recordings (southpaw)", () => {
  it("jabs only: no phantom punches from the guard hand while the torso turns", () => {
    const { truth } = FIXTURE.clips.IMG_6153;
    const ev = run(FIXTURE.clips.IMG_6153);
    expect(score(ev, truth, "right")).toEqual({ hit: 6, phantom: 0 });
    expect(ev.filter((e) => e.hand === "left")).toHaveLength(0);
    expect(ev.every((e) => e.type === "jab")).toBe(true);
  });

  it("jab–cross: keeps the real cross (rear hand) while dropping guard-hand phantoms", () => {
    for (const name of ["jabcross", "IMG_6156"]) {
      const { truth } = FIXTURE.clips[name];
      const ev = run(FIXTURE.clips[name]);
      const r = score(ev, truth, "right"), l = score(ev, truth, "left");
      expect(r.hit, `${name} jabs`).toBe(truth.right.length);
      expect(r.phantom, `${name} right phantoms`).toBe(0);
      // The last cross peaks right at the end of each clip, before it can be logged.
      expect(l.hit, `${name} crosses`).toBeGreaterThanOrEqual(truth.left.length - 1);
      expect(l.phantom, `${name} left phantoms`).toBe(0);
    }
  });

  it("labels jab/cross by the stance setting", () => {
    const ev = run(FIXTURE.clips.jabcross, { stance: "southpaw" });
    expect(ev.filter((e) => e.hand === "left").every((e) => e.type === "cross")).toBe(true);
    const ortho = run(FIXTURE.clips.jabcross, { stance: "orthodox" });
    expect(ortho.filter((e) => e.hand === "left").every((e) => e.type === "jab")).toBe(true);
  });
});

describe("punch type from 3D (world landmarks)", () => {
  it("never calls a straight punch a hook (2D did on jab–cross clips)", () => {
    for (const name of ["jabcross", "IMG_6156", "IMG_6153"]) {
      const ev = run(FIXTURE.clips[name]);
      expect(ev.filter((e) => e.type === "hook"), name).toEqual([]);
    }
  });

  it("calls rear hooks hooks, not crosses (2D called all of them crosses)", () => {
    const { truth } = FIXTURE.clips.IMG_6182;
    const ev = run(FIXTURE.clips.IMG_6182);
    const left = ev.filter((e) => e.hand === "left");
    expect(score(ev, truth, "left").hit).toBeGreaterThanOrEqual(4);
    expect(left.every((e) => e.type === "hook")).toBe(true);
    // Known open issue (README): a big rear hook turns the head away from the lead
    // guard hand, which can push it past the phantom gate — at most an echo per hook.
    expect(ev.filter((e) => e.hand === "right").length).toBeLessThanOrEqual(2);
  });

  it("finds lead hooks (the 2D state machine never fired on them) without guard-hand echoes", () => {
    for (const name of ["IMG_6181", "IMG_6155"]) {
      const { truth } = FIXTURE.clips[name];
      const ev = run(FIXTURE.clips[name]);
      const r = score(ev, truth, "right");
      expect(r, `${name} lead hooks`).toEqual({ hit: truth.right.length, phantom: 0 });
      expect(ev.filter((e) => e.hand === "right").every((e) => e.type === "hook"), name).toBe(true);
      expect(score(ev, truth, "left").phantom, `${name} rear-hand echoes`).toBe(0);
    }
  });

  it("lead-hook rule: elbow up + fist swings to the middle; guard cover and jabs don't count", () => {
    const guard = [{ side: 0.62 }, { side: 0.65 }];
    expect(_isLeadHook3D({ side: 0.11, rise: -0.17, wristLow: -0.08, elbow: 89, reach: 0.86 }, guard)).toBe(true);
    // Guard hand covering the face during the wind-up: same swing, elbow down.
    expect(_isLeadHook3D({ side: -0.32, rise: -0.59, wristLow: 0.23, elbow: 91, reach: 0.98 }, [{ side: 0.39 }])).toBe(false);
    // Jab: the fist moves OUT (side grows), the arm straightens.
    expect(_isLeadHook3D({ side: 0.93, rise: -0.26, wristLow: -0.12, elbow: 121, reach: 1.25 }, guard)).toBe(false);
    // Jab coming back: small swing.
    expect(_isLeadHook3D({ side: 0.77, rise: -0.62, wristLow: 0.06, elbow: 66, reach: 0.78 }, [{ side: 0.93 }])).toBe(false);
    expect(_isLeadHook3D(null, guard)).toBe(false);
  });

  it("falls back to the 2D classifier without world landmarks", () => {
    const ev = run(FIXTURE.clips.IMG_6153, { world: false });
    expect(score(ev, FIXTURE.clips.IMG_6153.truth, "right").hit).toBe(6);
  });

  it("shape rules: short-on-own-side = jab caught early; sideways = hook; forward = straight", () => {
    expect(_isHook3D({ reach: 0.87, fwd: 0.8, elbow: 80, across: 0.4 })).toBe(true);    // lead hook
    expect(_isHook3D({ reach: 0.86, fwd: 0.82, elbow: 88, across: -0.3 })).toBe(false); // jab, logged before full reach
    expect(_isHook3D({ reach: 1.1, fwd: 0.05, elbow: 105, across: 1.1 })).toBe(true);  // rear hook
    expect(_isHook3D({ reach: 1.3, fwd: 0.6, elbow: 120, across: 1.2 })).toBe(false);  // cross
    expect(_isHook3D({ reach: 1.25, fwd: 1.2, elbow: 125, across: -0.4 })).toBe(false); // jab
  });
});
