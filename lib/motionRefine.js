// Makes a recorded replay look like a person, not a sensor:
//  - zero-lag One-Euro smoothing (calm when still, sharp on punches)
//  - knees never bend backwards
//  - feet stay planted while they are not moving (no skating)
//  - sampleFrame(): interpolates between recorded frames for smooth slow-motion
// Pure functions over replays ({ frames: [{ t, p: Float32Array(33*3) }], … }) in
// MediaPipe world coordinates (meters, hip-centred, y down).

const J = 33;
const ANKLES = [[27, 29, 31], [28, 30, 32]]; // ankle, heel, toe — left, right
const KNEES = [[23, 25, 27, 31], [24, 26, 28, 32]]; // hip, knee, ankle, toe
// Tuned on a labelled jab–cross recording: arms keep ~99% of each punch's reach,
// head/torso jitter drops ~80%, legs ~94%. (One filter for everything had to trade
// one for the other: 86% reach at low jitter, or jittery torso at full reach.)
const ARM_FILTER = { minCutoff: 1.4, beta: 30 };
const BODY_FILTER = { minCutoff: 1.0, beta: 3 };

// ── One-Euro filter (Casiez et al. 2012) ─────────────────────────────────────
const alpha = (cutoff, dt) => { const tau = 1 / (2 * Math.PI * cutoff); return 1 / (1 + tau / dt); };

/**
 * One-Euro over a series (values[], times in seconds). Low cutoff when the
 * signal is slow (kills jitter), higher when it is fast (keeps punches crisp).
 */
export function oneEuro(values, times, { minCutoff = 1.4, beta = 2.0, dCutoff = 1.0 } = {}) {
  const out = new Array(values.length);
  if (!values.length) return out;
  let x = values[0], dx = 0;
  out[0] = x;
  for (let i = 1; i < values.length; i++) {
    const dt = Math.max(times[i] - times[i - 1], 1e-3);
    const rawD = (values[i] - x) / dt;
    dx += alpha(dCutoff, dt) * (rawD - dx);
    const cutoff = minCutoff + beta * Math.abs(dx);
    x += alpha(cutoff, dt) * (values[i] - x);
    out[i] = x;
  }
  return out;
}

/** Forward then backward pass: same smoothing, no time lag. */
export function oneEuroZeroLag(values, times, opts) {
  const fwd = oneEuro(values, times, opts);
  const T = times[times.length - 1];
  const back = oneEuro([...fwd].reverse(), [...times].reverse().map((t) => T - t), opts);
  return back.reverse();
}

// ── Geometry helpers on flat arrays ──────────────────────────────────────────
const get = (p, i) => [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]];
const set = (p, i, v) => { p[i * 3] = v[0]; p[i * 3 + 1] = v[1]; p[i * 3 + 2] = v[2]; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/**
 * Knees bend toward the toes. If a knee sits behind the hip–ankle line
 * (relative to where the foot points), mirror it to the front.
 */
export function fixKnees(p) {
  for (const [h, k, a, toe] of KNEES) {
    const H = get(p, h), K = get(p, k), A = get(p, a), T = get(p, toe);
    const legDir = norm(sub(A, H));
    let foot = sub(T, A);
    foot = sub(foot, mul(legDir, dot(foot, legDir)));       // part of the foot direction across the leg
    if (len(foot) < 0.02) continue;
    foot = norm(foot);
    const onLine = add(H, mul(legDir, dot(sub(K, H), legDir)));
    const off = sub(K, onLine);
    const ahead = dot(off, foot);
    if (ahead < -0.02) set(p, k, sub(K, mul(foot, 2 * ahead)));
  }
}

/**
 * Plant the feet: while an ankle moves slower than `speed` (m/s) for at least
 * `minFrames`, hold ankle/heel/toe at their average spot; ease in/out.
 */
export function lockFeet(frames, { speed = 0.35, minFrames = 3, blend = 2 } = {}) {
  const n = frames.length;
  for (const pts of ANKLES) {
    const a = pts[0];
    const still = new Array(n).fill(false);
    for (let i = 1; i < n; i++) {
      const dt = Math.max((frames[i].t - frames[i - 1].t) / 1000, 1e-3);
      still[i] = len(sub(get(frames[i].p, a), get(frames[i - 1].p, a))) / dt < speed;
    }
    still[0] = still[1] ?? false;
    let i = 0;
    while (i < n) {
      if (!still[i]) { i++; continue; }
      let j = i;
      while (j + 1 < n && still[j + 1]) j++;
      if (j - i + 1 >= minFrames) {
        for (const q of pts) {
          let m = [0, 0, 0];
          for (let k = i; k <= j; k++) m = add(m, get(frames[k].p, q));
          m = mul(m, 1 / (j - i + 1));
          for (let k = i; k <= j; k++) {
            const w = Math.min(1, (k - i + 1) / (blend + 1), (j - k + 1) / (blend + 1));
            const v = get(frames[k].p, q);
            set(frames[k].p, q, add(v, mul(sub(m, v), w)));
          }
        }
      }
      i = j + 1;
    }
  }
}

/** A refined copy of `replay` (the original is not modified). */
export function refineReplay(replay, { smooth = true, knees = true, feet = true } = {}) {
  const src = replay?.frames;
  if (!src || src.length < 3) return replay;
  const frames = src.map((f) => ({ t: f.t, p: new Float32Array(f.p) }));
  if (smooth) {
    const times = frames.map((f) => f.t / 1000);
    for (let c = 0; c < J * 3; c++) {
      const joint = Math.floor(c / 3);
      // Arms carry the punch: follow speed closely there; calm the rest of the body.
      const opts = joint >= 13 && joint <= 22 ? ARM_FILTER : BODY_FILTER;
      const s = oneEuroZeroLag(frames.map((f) => f.p[c]), times, opts);
      for (let i = 0; i < frames.length; i++) frames[i].p[c] = s[i];
    }
  }
  if (knees) for (const f of frames) fixKnees(f.p);
  if (feet) lockFeet(frames);
  return { ...replay, frames, refined: true };
}

/** Pose at time t, linearly interpolated between the two nearest frames (into `out`). */
export function sampleFrame(replay, t, out = new Float32Array(J * 3)) {
  const f = replay?.frames;
  if (!f?.length) return null;
  if (t <= f[0].t) { out.set(f[0].p); return out; }
  if (t >= f[f.length - 1].t) { out.set(f[f.length - 1].p); return out; }
  let lo = 0, hi = f.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (f[mid].t <= t) lo = mid; else hi = mid; }
  const a = f[lo], b = f[hi];
  const k = (t - a.t) / Math.max(b.t - a.t, 1e-6);
  for (let i = 0; i < out.length; i++) out[i] = a.p[i] + (b.p[i] - a.p[i]) * k;
  return out;
}
