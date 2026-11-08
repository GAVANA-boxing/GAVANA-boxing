import { describe, it, expect } from "vitest";
import { createOneEuro, createLandmarkFilter } from "@/lib/pose/landmarkFilter";

const pose = (x, vis = 0.9) => Array.from({ length: 33 }, () => ({ x, y: 0.5, z: 0, visibility: vis }));

describe("One-Euro filter", () => {
  it("removes jitter when still", () => {
    const f = createOneEuro();
    let out = 0;
    // ±0.01 noise around 0.5 at 10 fps
    for (let i = 0; i < 40; i++) out = f.filter(0.5 + (i % 2 ? 0.01 : -0.01), i * 100);
    expect(Math.abs(out - 0.5)).toBeLessThan(0.006);
  });

  it("keeps up with a fast move (little lag on a punch)", () => {
    const f = createOneEuro();
    for (let i = 0; i < 10; i++) f.filter(0.3, i * 100);
    // the wrist jumps 0.3 → 0.6 over two frames
    f.filter(0.45, 1000);
    const out = f.filter(0.6, 1100);
    expect(out).toBeGreaterThan(0.5); // a fixed EMA α=0.35 would give ≈ 0.45
  });

  it("does not divide by zero on repeated timestamps", () => {
    const f = createOneEuro();
    f.filter(0.2, 100);
    expect(f.filter(0.4, 100)).toBe(0.4);
  });
});

describe("landmark filter — occlusion", () => {
  it("holds a joint's last good position during a short occlusion", () => {
    const lf = createLandmarkFilter({ maxGapMs: 400 });
    for (let t = 0; t <= 500; t += 100) lf.filter(pose(0.5), t);
    const occluded = pose(0.9, 0.1); // glove hides it: garbage x, low visibility
    const out = lf.filter(occluded, 600);
    expect(out[15].held).toBe(true);
    expect(out[15].x).toBeCloseTo(0.5, 2);
    expect(out[15].visibility).toBe(0.1); // downstream gates still see "unsure"
  });

  it("stops holding after maxGapMs and never blends a stale position back in", () => {
    const lf = createLandmarkFilter({ maxGapMs: 300 });
    for (let t = 0; t <= 500; t += 100) lf.filter(pose(0.2), t);
    lf.filter(pose(0.9, 0.1), 600);
    const late = lf.filter(pose(0.9, 0.1), 1000);
    expect(late[15].held).toBeUndefined();
    const back = lf.filter(pose(0.8), 1100); // visible again, somewhere else
    expect(back[15].x).toBeCloseTo(0.8, 5); // fresh start, not 0.2 dragging behind
  });

  it("resets everything after the body was lost for a while", () => {
    const lf = createLandmarkFilter({ maxGapMs: 300 });
    for (let t = 0; t <= 300; t += 100) lf.filter(pose(0.2), t);
    lf.miss(400); lf.miss(800);
    const out = lf.filter(pose(0.7), 1200);
    expect(out[0].x).toBeCloseTo(0.7, 5);
  });

  it("passes through non-finite input without NaN poisoning the filter", () => {
    const lf = createLandmarkFilter();
    lf.filter(pose(0.5), 0);
    const bad = pose(0.5); bad[3] = { x: NaN, y: 0.5, visibility: 0.9 };
    const out = lf.filter(bad, 100);
    expect(out[3].held).toBe(true);
    expect(Number.isFinite(out[3].x)).toBe(true);
    expect(lf.filter(null, 200)).toBeNull();
  });
});
