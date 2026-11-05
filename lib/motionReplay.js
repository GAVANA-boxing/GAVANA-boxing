// 3D motion replay — the user's own session as a 3D skeleton.
//
// During recording, usePoseDetection pushes MediaPipe world landmarks (meters,
// hip-centred) into a recorder; after the session the replay is rendered in
// 3D (components/train/MotionReplay3D). Everything here is pure so it is
// unit-tested; the 3D view only draws what this module computes.

export const JOINTS = 33;

// MediaPipe pose landmark indices
export const LM = {
  NOSE: 0,
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_ELBOW: 13, R_ELBOW: 14,
  L_WRIST: 15, R_WRIST: 16,
  L_HIP: 23, R_HIP: 24,
  L_KNEE: 25, R_KNEE: 26,
  L_ANKLE: 27, R_ANKLE: 28,
};

// Skeleton bones to draw (pairs of landmark indices).
export const BONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // shoulders + arms
  [15, 17], [15, 19], [17, 19], [16, 18], [16, 20], [18, 20], // hands
  [11, 23], [12, 24], [23, 24], // torso
  [23, 25], [25, 27], [24, 26], [26, 28], // legs
  [27, 31], [28, 32], // feet
];

export const ARM_BONES = new Set(["11-13", "13-15", "12-14", "14-16", "15-17", "15-19", "17-19", "16-18", "16-20", "18-20"]);

/**
 * Records pose frames during a session. Throttled to one frame per
 * `minIntervalMs` (~20 fps), capped at `maxFrames` (oldest dropped), with a
 * light EMA to remove landmark jitter. Each frame is a Float32Array(33*3).
 */
export function createReplayRecorder({ maxFrames = 2400, minIntervalMs = 50, smoothing = 0.55 } = {}) {
  let frames = [];
  let lastTs = -Infinity;
  let prev = null;

  return {
    push(points, ts) {
      if (!points || points.length < JOINTS || !Number.isFinite(ts)) return false;
      if (ts - lastTs < minIntervalMs) return false;
      lastTs = ts;
      const p = new Float32Array(JOINTS * 3);
      for (let i = 0; i < JOINTS; i++) {
        const lm = points[i];
        const x = Number(lm?.x) || 0, y = Number(lm?.y) || 0, z = Number(lm?.z) || 0;
        const k = i * 3;
        if (prev) {
          p[k] = smoothing * x + (1 - smoothing) * prev[k];
          p[k + 1] = smoothing * y + (1 - smoothing) * prev[k + 1];
          p[k + 2] = smoothing * z + (1 - smoothing) * prev[k + 2];
        } else {
          p[k] = x; p[k + 1] = y; p[k + 2] = z;
        }
      }
      prev = p;
      frames.push({ ts, p });
      if (frames.length > maxFrames) frames.shift();
      return true;
    },
    reset() { frames = []; lastTs = -Infinity; prev = null; },
    size() { return frames.length; },
    snapshot() { return frames.slice(); },
  };
}

/**
 * Turn recorded frames + punch events into a replay:
 *   { frames: [{ t, p }], duration, punches: [{ t, type, hand }] }
 * where t is ms since the first frame. Punches outside the window are dropped.
 * Returns null when there is too little to replay.
 */
export function buildReplay(frames, punchEvents = []) {
  if (!Array.isArray(frames) || frames.length < 10) return null;
  const t0 = frames[0].ts;
  const out = frames.map((f) => ({ t: f.ts - t0, p: f.p }));
  const duration = out[out.length - 1].t;
  const punches = (punchEvents || [])
    .filter((e) => Number.isFinite(e?.ts) && e.ts >= t0 && e.ts - t0 <= duration)
    .map((e) => ({ t: e.ts - t0, type: e.type || "punch", hand: e.hand || null }))
    .sort((a, b) => a.t - b.t);
  return { frames: out, duration, punches };
}

/** Index of the last frame at or before `t` (binary search). */
export function frameIndexAt(replay, t) {
  const f = replay?.frames;
  if (!f?.length) return -1;
  if (t <= f[0].t) return 0;
  let lo = 0, hi = f.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (f[mid].t <= t) lo = mid; else hi = mid - 1;
  }
  return lo;
}

/** Next punch strictly after `t`, or null. */
export function nextPunchAfter(replay, t) {
  return replay?.punches?.find((pk) => pk.t > t + 1) || null;
}

/** True when a punch landed within ±windowMs of t (for highlighting arms). */
export function isPunchMoment(replay, t, windowMs = 220) {
  return !!replay?.punches?.some((pk) => Math.abs(pk.t - t) <= windowMs);
}

const at = (p, i) => ({ x: p[i * 3], y: p[i * 3 + 1], z: p[i * 3 + 2] });

/**
 * Guard check for one frame, from real data: a hand is "down" when the wrist is
 * clearly below shoulder height. World landmarks are y-down (larger y = lower).
 * Returns { left, right } as "up" | "down".
 */
export function guardState(p, tolerance = 0.12) {
  const ls = at(p, LM.L_SHOULDER), rs = at(p, LM.R_SHOULDER);
  const lw = at(p, LM.L_WRIST), rw = at(p, LM.R_WRIST);
  return {
    left: lw.y > ls.y + tolerance ? "down" : "up",
    right: rw.y > rs.y + tolerance ? "down" : "up",
  };
}

/** Share of frames (0..1) where either hand was down outside punch moments. */
export function guardDropRatio(replay) {
  const f = replay?.frames;
  if (!f?.length) return 0;
  let counted = 0, dropped = 0;
  for (const fr of f) {
    if (isPunchMoment(replay, fr.t, 300)) continue;
    counted++;
    const g = guardState(fr.p);
    if (g.left === "down" || g.right === "down") dropped++;
  }
  return counted ? dropped / counted : 0;
}

/** Lowest point (largest y) across the replay — where to put the floor. */
export function floorY(replay) {
  let max = -Infinity;
  for (const fr of replay?.frames || []) {
    for (const i of [LM.L_ANKLE, LM.R_ANKLE, 31, 32]) {
      const y = fr.p[i * 3 + 1];
      if (Number.isFinite(y) && y > max) max = y;
    }
  }
  return Number.isFinite(max) && max > 0.3 ? max : 0.9;
}
