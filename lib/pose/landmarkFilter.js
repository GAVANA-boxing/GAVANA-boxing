// Landmark clean-up between MediaPipe and everything that draws or measures the body
// (overlay, pose metrics, defensive / head-movement detection). The punch detector keeps
// reading RAW landmarks — it has its own tuned smoothing (lib/punchPhaseDetector.js).
//
// Per joint, per axis:
//   - One-Euro filter (Casiez et al., CHI 2012): little smoothing when the joint moves fast
//     (a punch keeps its speed), more when it is still (jitter disappears). Time-based, so
//     it behaves the same at 10 or 30 fps.
//   - Visibility gate: a joint MediaPipe isn't sure about (glove hides the wrist, bad light,
//     out of frame) doesn't move the filtered position. For a short gap we HOLD its last
//     good position (`held: true`), so overlays don't flicker and lines don't jump to
//     garbage; after `maxGapMs` the joint is reset so a stale position is never blended in.
//   - The visibility MediaPipe reported is passed through unchanged, so downstream gates
//     (computePoseMetrics, lowerBodyVisible) still skip unsure joints.
// Pure and framework-free; tested in tests/landmarkFilter.test.js.

const TWO_PI = 2 * Math.PI;

function smoothingFactor(cutoffHz, dtSec) {
  const tau = 1 / (TWO_PI * cutoffHz);
  return 1 / (1 + tau / dtSec);
}

/** One-Euro filter for one scalar signal. Times in milliseconds. */
export function createOneEuro({ minCutoff = 1.0, beta = 1.0, dCutoff = 1.0 } = {}) {
  let xPrev = null;
  let dxPrev = 0;
  let tPrev = null;
  return {
    filter(x, tMs) {
      if (xPrev === null || tPrev === null || tMs <= tPrev) {
        xPrev = x; dxPrev = 0; tPrev = tMs;
        return x;
      }
      const dt = (tMs - tPrev) / 1000;
      const dx = (x - xPrev) / dt;
      const aD = smoothingFactor(dCutoff, dt);
      const dxHat = aD * dx + (1 - aD) * dxPrev;
      const cutoff = minCutoff + beta * Math.abs(dxHat);
      const a = smoothingFactor(cutoff, dt);
      const xHat = a * x + (1 - a) * xPrev;
      xPrev = xHat; dxPrev = dxHat; tPrev = tMs;
      return xHat;
    },
    reset() { xPrev = null; dxPrev = 0; tPrev = null; },
  };
}

/**
 * @param {{ minVisibility?: number, maxGapMs?: number, minCutoff?: number, beta?: number, dCutoff?: number }} opts
 * @returns {{ filter(landmarks: Array<{x,y,z?,visibility?}>, tMs: number): Array<object>,
 *            miss(tMs: number): void, reset(): void }}
 */
export function createLandmarkFilter({ minVisibility = 0.5, maxGapMs = 400, minCutoff = 1.0, beta = 1.0, dCutoff = 1.0 } = {}) {
  const joints = new Map(); // index → { fx, fy, fz, last: {x,y,z,t} | null }
  let lastSeenMs = null;

  const joint = (i) => {
    let j = joints.get(i);
    if (!j) {
      const mk = () => createOneEuro({ minCutoff, beta, dCutoff });
      j = { fx: mk(), fy: mk(), fz: mk(), last: null };
      joints.set(i, j);
    }
    return j;
  };
  const resetJoint = (j) => { j.fx.reset(); j.fy.reset(); j.fz.reset(); j.last = null; };

  return {
    filter(landmarks, tMs) {
      if (!Array.isArray(landmarks)) return null;
      // The whole body was lost for longer than a short gap: start fresh.
      if (lastSeenMs !== null && tMs - lastSeenMs > maxGapMs) for (const j of joints.values()) resetJoint(j);
      lastSeenMs = tMs;
      return landmarks.map((lm, i) => {
        const vis = typeof lm?.visibility === "number" ? lm.visibility : 1;
        const j = joint(i);
        const finite = Number.isFinite(lm?.x) && Number.isFinite(lm?.y);
        if (finite && vis >= minVisibility) {
          const x = j.fx.filter(lm.x, tMs);
          const y = j.fy.filter(lm.y, tMs);
          const z = j.fz.filter(Number.isFinite(lm.z) ? lm.z : 0, tMs);
          j.last = { x, y, z, t: tMs };
          return { ...lm, x, y, z };
        }
        if (j.last && tMs - j.last.t <= maxGapMs) {
          return { ...lm, x: j.last.x, y: j.last.y, z: j.last.z, visibility: vis, held: true };
        }
        resetJoint(j);
        return { ...lm };
      });
    },
    /** No pose in this frame. Long gaps reset the filter on the next detection. */
    miss() { /* lastSeenMs stays — filter() compares against it */ },
    reset() { for (const j of joints.values()) resetJoint(j); lastSeenMs = null; },
  };
}
