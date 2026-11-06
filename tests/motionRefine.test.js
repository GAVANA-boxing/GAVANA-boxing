import { describe, it, expect } from "vitest";
import { oneEuroZeroLag, fixKnees, lockFeet, refineReplay, sampleFrame } from "@/lib/motionRefine";

const J = 33;
// Deterministic pseudo-random jitter.
const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed / 2147483647) - 0.5; };

// A standing pose in world coords (meters, hip-centred, y down, facing −z).
function standing() {
  const p = new Float32Array(J * 3);
  const put = (i, x, y, z) => { p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; };
  put(0, 0, -0.62, -0.08);
  put(7, 0.07, -0.6, 0); put(8, -0.07, -0.6, 0);
  put(11, 0.17, -0.45, 0); put(12, -0.17, -0.45, 0);
  put(13, 0.2, -0.2, -0.05); put(14, -0.2, -0.2, -0.05);
  put(15, 0.12, -0.5, -0.25); put(16, -0.12, -0.5, -0.25);
  put(23, 0.1, 0, 0); put(24, -0.1, 0, 0);
  put(25, 0.11, 0.42, -0.06); put(26, -0.11, 0.42, -0.06);   // knees slightly forward (toward the toes)
  put(27, 0.12, 0.84, 0); put(28, -0.12, 0.84, 0);
  put(29, 0.12, 0.88, 0.05); put(30, -0.12, 0.88, 0.05);
  put(31, 0.13, 0.88, -0.14); put(32, -0.13, 0.88, -0.14);   // toes point to −z
  return p;
}

function replayOf(n, fn, dtMs = 50) {
  return { frames: Array.from({ length: n }, (_, i) => ({ t: i * dtMs, p: fn(i) })), duration: (n - 1) * dtMs, punches: [] };
}

describe("oneEuroZeroLag", () => {
  it("removes jitter on a still signal", () => {
    const r = rng(7);
    const times = Array.from({ length: 80 }, (_, i) => i * 0.05);
    const noisy = times.map(() => 1 + r() * 0.04);
    const out = oneEuroZeroLag(noisy, times);
    const sd = (a) => { const m = a.reduce((s, x) => s + x, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length); };
    expect(sd(out)).toBeLessThan(sd(noisy) * 0.4);
  });

  it("keeps a fast punch: most of the peak, and no time shift", () => {
    const times = Array.from({ length: 60 }, (_, i) => i * 0.05);
    // 0 → 0.5 m in 0.1 s, held 0.15 s, back — a jab.
    const x = times.map((t) => (t < 1 ? 0 : t < 1.1 ? (t - 1) * 5 : t < 1.25 ? 0.5 : t < 1.35 ? 0.5 - (t - 1.25) * 5 : 0));
    const out = oneEuroZeroLag(x, times);
    const peak = Math.max(...out);
    expect(peak).toBeGreaterThan(0.4);
    const iPeakIn = x.indexOf(0.5), iPeakOut = out.indexOf(peak);
    expect(Math.abs(iPeakOut - iPeakIn)).toBeLessThanOrEqual(3);
  });
});

describe("fixKnees", () => {
  it("mirrors a knee that bends backwards and keeps limb lengths", () => {
    const p = standing();
    const d = (i, j) => Math.hypot(p[i * 3] - p[j * 3], p[i * 3 + 1] - p[j * 3 + 1], p[i * 3 + 2] - p[j * 3 + 2]);
    p[25 * 3 + 2] = 0.12; // left knee behind the leg line (away from the toes)
    const thigh = d(23, 25), shin = d(25, 27);
    fixKnees(p);
    expect(p[25 * 3 + 2]).toBeLessThan(0); // now toward the toes (−z)
    expect(d(23, 25)).toBeCloseTo(thigh, 5);
    expect(d(25, 27)).toBeCloseTo(shin, 5);
  });

  it("leaves a natural knee alone", () => {
    const p = standing();
    const before = Array.from(p);
    fixKnees(p);
    expect(Array.from(p)).toEqual(before);
  });
});

describe("lockFeet", () => {
  it("holds a still foot exactly in place but lets a stepping foot move", () => {
    const r = rng(3);
    const rep = replayOf(20, (i) => {
      const p = standing();
      p[27 * 3] += r() * 0.004;                          // left foot: still, with jitter
      p[28 * 3 + 2] += i < 10 ? 0 : (i - 10) * 0.06;     // right foot: steps back fast after frame 10
      return p;
    });
    lockFeet(rep.frames);
    const xs = rep.frames.slice(3, 17).map((f) => f.p[27 * 3]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(1e-6);
    expect(rep.frames[19].p[28 * 3 + 2] - rep.frames[10].p[28 * 3 + 2]).toBeGreaterThan(0.4);
  });
});

describe("refineReplay / sampleFrame", () => {
  it("returns a refined copy and leaves the original untouched", () => {
    const r = rng(11);
    const rep = replayOf(30, () => { const p = standing(); for (let i = 0; i < p.length; i++) p[i] += r() * 0.01; return p; });
    const orig = Array.from(rep.frames[5].p);
    const out = refineReplay(rep);
    expect(out.refined).toBe(true);
    expect(out.frames).toHaveLength(30);
    expect(Array.from(rep.frames[5].p)).toEqual(orig);
  });

  it("interpolates between frames", () => {
    const rep = replayOf(2, (i) => { const p = new Float32Array(J * 3); p[0] = i; return p; }, 100);
    expect(sampleFrame(rep, 50)[0]).toBeCloseTo(0.5, 6);
    expect(sampleFrame(rep, -10)[0]).toBe(0);
    expect(sampleFrame(rep, 999)[0]).toBe(1);
  });
});
