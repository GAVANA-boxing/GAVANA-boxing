import { describe, it, expect, afterEach, vi } from "vitest";
import { PunchPhaseDetector } from "@/lib/punchPhaseDetector";
import FIXTURE from "./fixtures/punch-landmarks.json";

// Replays real, labelled pose sequences through the detector with a simulated
// clock. Truth = peak time (s) of every punch per anatomical hand.
const MATCH_S = 0.6;

function run(clip, stance = "southpaw") {
  let sim = 1e9;
  vi.spyOn(Date, "now").mockImplementation(() => sim);
  const det = new PunchPhaseDetector();
  det.setStance(stance);
  for (const [t, ...pts] of clip.frames) {
    sim = 1e9 + t;
    const L = Array.from({ length: 17 }, () => ({ x: 0, y: 0, z: 0, visibility: 0 }));
    FIXTURE.indices.forEach((idx, k) => { const [x, y, z, visibility] = pts[k]; L[idx] = { x, y, z, visibility }; });
    det.update(L);
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
    expect(ev.filter((e) => e.hand === "right").every((e) => e.type === "jab")).toBe(true);
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
    const ev = run(FIXTURE.clips.jabcross, "southpaw");
    expect(ev.filter((e) => e.hand === "left").every((e) => e.type === "cross")).toBe(true);
    const ortho = run(FIXTURE.clips.jabcross, "orthodox");
    expect(ortho.filter((e) => e.hand === "left").every((e) => e.type === "jab")).toBe(true);
  });
});
