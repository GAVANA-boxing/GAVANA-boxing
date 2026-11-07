// Punch Teardown — one punch from a recorded round, taken apart.
//
// Input: a motion replay (lib/motionReplay.js: frames of 33 world landmarks in
// metres, y down, plus detected punches). For one punch this finds the four
// phases — Load → Rotate → Extend → Return — and measures what a coach looks
// at: shoulder and hip turn, elbow at full reach, reach, the other hand's
// guard and how fast the hand comes back. Pure and deterministic, so it is
// unit-tested; components/train/PunchTeardown.js only draws the result.

import { LM, frameIndexAt } from "@/lib/motionReplay";

export const PHASES = Object.freeze(["load", "rotate", "extend", "return"]);

const ARM = {
  left: { s: LM.L_SHOULDER, e: LM.L_ELBOW, w: LM.L_WRIST, otherS: LM.R_SHOULDER, otherW: LM.R_WRIST },
  right: { s: LM.R_SHOULDER, e: LM.R_ELBOW, w: LM.R_WRIST, otherS: LM.L_SHOULDER, otherW: LM.L_WRIST },
};

const pt = (p, i) => ({ x: p[i * 3], y: p[i * 3 + 1], z: p[i * 3 + 2] });
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const len = (v) => Math.hypot(v.x, v.y, v.z);
const dist = (a, b) => len(sub(a, b));

/** Elbow angle in degrees (180 = arm straight). */
export function elbowAngle(p, hand) {
  const a = ARM[hand];
  const u = sub(pt(p, a.s), pt(p, a.e));
  const v = sub(pt(p, a.w), pt(p, a.e));
  const d = len(u) * len(v);
  if (!d) return 0;
  const c = Math.max(-1, Math.min(1, (u.x * v.x + u.y * v.y + u.z * v.z) / d));
  return (Math.acos(c) * 180) / Math.PI;
}

/** How far the hand is from its shoulder, as a share of the arm's length (0..~1). */
export function armExtension(p, hand) {
  const a = ARM[hand];
  const s = pt(p, a.s), e = pt(p, a.e), w = pt(p, a.w);
  const armLen = dist(s, e) + dist(e, w);
  return armLen > 0 ? dist(s, w) / armLen : 0;
}

/** Heading of a left→right body line seen from above (degrees). */
function yaw(p, li, ri) {
  const l = pt(p, li), r = pt(p, ri);
  return (Math.atan2(r.z - l.z, r.x - l.x) * 180) / Math.PI;
}
const turnBetween = (a, b) => {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
};

/** Which hand threw it: the event says so, else the hand that reached furthest. */
function punchHand(replay, punch, i0, i1) {
  if (punch?.hand === "left" || punch?.hand === "right") return punch.hand;
  let best = { hand: "right", ext: -1 };
  for (let i = i0; i <= i1; i++) {
    for (const hand of ["left", "right"]) {
      const ext = armExtension(replay.frames[i].p, hand);
      if (ext > best.ext) best = { hand, ext };
    }
  }
  return best.hand;
}

const LOAD_LEAD_MS = 150;
const STRAIGHT = new Set(["jab", "cross", "straight", "punch"]);

/**
 * Take one punch apart.
 * @param {object} replay  from buildReplay (frames: [{t, p}], punches: [{t, type, hand}])
 * @param {object} punch   one of replay.punches
 * @param {object} [opts]  { searchMs = 280, windowMs = 650 }
 * @returns {null | {
 *   hand, type, startT, peakT, endT,
 *   phases: [{ key, startT, endT }],
 *   metrics: { reachPct, elbowDeg, shoulderTurnDeg, hipTurnDeg, guardUp, guardGapCm, loadMs, returnMs },
 *   tips: [{ key, ok }],
 *   grade: "good" | "ok" | "fix"
 * }}
 */
export function teardownPunch(replay, punch, { searchMs = 280, windowMs = 650 } = {}) {
  const frames = replay?.frames;
  if (!frames?.length || !punch || !Number.isFinite(punch.t)) return null;

  const at = (t) => Math.max(0, frameIndexAt(replay, t));
  const iSearch0 = at(punch.t - searchMs);
  const iSearch1 = at(punch.t + searchMs);
  const hand = punchHand(replay, punch, iSearch0, iSearch1);
  const ext = (i) => armExtension(frames[i].p, hand);

  // Peak: furthest reach near the detected moment.
  let peak = iSearch0;
  for (let i = iSearch0; i <= iSearch1; i++) if (ext(i) > ext(peak)) peak = i;

  // Start / end: the hand at its closest before and after the peak.
  const iWin0 = at(frames[peak].t - windowMs);
  const iWin1 = at(frames[peak].t + windowMs);
  let start = peak;
  for (let i = peak; i >= iWin0; i--) if (ext(i) < ext(start)) start = i;
  let end = peak;
  for (let i = peak; i <= iWin1; i++) if (ext(i) < ext(end)) end = i;
  if (peak - start < 1) return null; // no visible wind-up → not a punch we can take apart

  // Rotate begins when the hand has covered a quarter of its travel; Extend at 60 %.
  const e0 = ext(start), eP = ext(peak);
  const firstAbove = (share) => {
    for (let i = start; i <= peak; i++) if (ext(i) >= e0 + share * (eP - e0)) return i;
    return peak;
  };
  const rotate = firstAbove(0.25);
  const extend = Math.max(rotate, firstAbove(0.6));
  const T = (i) => frames[i].t;

  const pS = frames[start].p, pP = frames[peak].p;
  const arm = ARM[hand];
  const other = pt(pP, arm.otherW), otherShoulder = pt(pP, arm.otherS), nose = pt(pP, LM.NOSE);
  // Guard: the other hand at or above shoulder height (y down) and near the face.
  const guardUp = other.y <= otherShoulder.y + 0.05;
  const guardGapCm = Math.round(dist(other, nose) * 100);

  const metrics = {
    reachPct: Math.round(eP * 100),
    elbowDeg: Math.round(elbowAngle(pP, hand)),
    shoulderTurnDeg: Math.round(turnBetween(yaw(pS, LM.L_SHOULDER, LM.R_SHOULDER), yaw(pP, LM.L_SHOULDER, LM.R_SHOULDER))),
    hipTurnDeg: Math.round(turnBetween(yaw(pS, LM.L_HIP, LM.R_HIP), yaw(pP, LM.L_HIP, LM.R_HIP))),
    guardUp,
    guardGapCm,
    loadMs: Math.round(T(peak) - T(start)),
    returnMs: Math.round(T(end) - T(peak)),
  };

  const type = punch.type || "punch";
  const straight = STRAIGHT.has(type);
  const rear = type === "cross" || (type === "punch" && hand === "right");
  const tips = [];
  if (straight) tips.push({ key: "fullExtension", ok: metrics.elbowDeg >= 150 });
  if (rear) tips.push({ key: "shoulderTurn", ok: metrics.shoulderTurnDeg >= 15 });
  if (rear) tips.push({ key: "hipTurn", ok: metrics.hipTurnDeg >= 8 });
  tips.push({ key: "guardHand", ok: guardUp });
  if (end > peak) tips.push({ key: "fastReturn", ok: metrics.returnMs <= 450 });

  const misses = tips.filter((t) => !t.ok).length;
  const grade = misses === 0 ? "good" : misses === 1 ? "ok" : "fix";

  // Load also covers the set-up just before the hand moves (weight shift, shoulder loading).
  const loadT = Math.max(frames[0].t, T(start) - LOAD_LEAD_MS);
  return {
    hand,
    type,
    startT: loadT,
    peakT: T(peak),
    endT: T(end),
    phases: [
      { key: "load", startT: loadT, endT: T(rotate) },
      { key: "rotate", startT: T(rotate), endT: T(extend) },
      { key: "extend", startT: T(extend), endT: T(peak) },
      { key: "return", startT: T(peak), endT: T(end) },
    ],
    metrics,
    tips,
    grade,
  };
}

/** The phase playing at time t (null outside the punch). */
export function phaseAt(teardown, t) {
  if (!teardown || t < teardown.startT || t > teardown.endT) return null;
  for (const ph of teardown.phases) if (t >= ph.startT && t <= ph.endT) return ph.key;
  return null;
}

/** Teardowns for every punch that can be taken apart, in time order. */
export function teardownAll(replay) {
  return (replay?.punches || [])
    .map((pk, index) => ({ index, punch: pk, teardown: teardownPunch(replay, pk) }))
    .filter((x) => x.teardown);
}

/**
 * A synthetic round for tests and the visual fixture: a boxer in guard throws
 * one punch per `everyMs` alternating jab (left) and cross (right), with the
 * shoulders and hips turning into the cross. Metres, y down, ~20 fps.
 */
export function syntheticReplay({ punches = 4, everyMs = 1200, fps = 20, dropGuardOn = -1, lazyCross = false } = {}) {
  const dt = 1000 / fps;
  const duration = punches * everyMs + 600;
  const frames = [];
  const events = [];
  for (let k = 0; k < punches; k++) {
    const hand = k % 2 === 0 ? "left" : "right";
    events.push({ t: 400 + k * everyMs + 220, type: hand === "left" ? "jab" : "cross", hand, k });
  }
  for (let t = 0; t <= duration; t += dt) {
    const p = new Float32Array(33 * 3);
    const set = (i, x, y, z) => { p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; };
    // Which punch (if any) is in flight, and how far: 0 → 1 (peak at 220 ms) → 0.
    let active = null, s = 0;
    for (const ev of events) {
      const u = t - (ev.t - 220);
      if (u >= 0 && u <= 520) {
        active = ev;
        s = u <= 220 ? Math.sin((u / 220) * (Math.PI / 2)) : Math.cos(((u - 220) / 300) * (Math.PI / 2));
        s = Math.max(0, s);
      }
    }
    const crossTurn = active?.hand === "right" ? s * (lazyCross ? 0.05 : 0.45) : 0; // radians
    const rot = (x, z, a) => [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)];
    const body = (i, x, y, z, a) => { const [rx, rz] = rot(x, z, a); set(i, rx, y, rz); };

    body(LM.NOSE, 0, -0.62, -0.08, crossTurn * 0.6);
    body(LM.L_SHOULDER, 0.19, -0.45, 0, crossTurn);
    body(LM.R_SHOULDER, -0.19, -0.45, 0, crossTurn);
    body(LM.L_HIP, 0.13, 0, 0, crossTurn * 0.55);
    body(LM.R_HIP, -0.13, 0, 0, crossTurn * 0.55);
    set(LM.L_KNEE, 0.15, 0.42, -0.05); set(LM.R_KNEE, -0.15, 0.42, 0.05);
    set(LM.L_ANKLE, 0.17, 0.85, -0.12); set(LM.R_ANKLE, -0.17, 0.85, 0.12);
    set(31, 0.17, 0.9, -0.2); set(32, -0.17, 0.9, 0.05);

    for (const hand of ["left", "right"]) {
      const a = ARM[hand];
      const side = hand === "left" ? 1 : -1;
      const sh = pt(p, a.s);
      const out = active?.hand === hand ? s : 0;
      const dropped = active && active.hand !== hand && active.k === dropGuardOn;
      // Guard: hand by the chin, elbow tucked. Punch: arm straightens toward the camera (−z).
      const guardW = { x: sh.x - side * 0.12, y: dropped ? sh.y + 0.32 : sh.y - 0.12, z: sh.z - 0.2 };
      const fullW = { x: sh.x - side * 0.08, y: sh.y + 0.02, z: sh.z - 0.6 };
      const w = { x: guardW.x + (fullW.x - guardW.x) * out, y: guardW.y + (fullW.y - guardW.y) * out, z: guardW.z + (fullW.z - guardW.z) * out };
      // Elbow: below and behind in guard, on the line at full reach.
      const bend = 1 - out;
      const e = { x: (sh.x + w.x) / 2 + side * 0.05 * bend, y: (sh.y + w.y) / 2 + 0.14 * bend, z: (sh.z + w.z) / 2 + 0.06 * bend };
      set(a.e, e.x, e.y, e.z);
      set(a.w, w.x, w.y, w.z);
    }
    frames.push({ t, p });
  }
  return {
    frames,
    duration: frames[frames.length - 1].t,
    punches: events.map(({ t, type, hand }) => ({ t, type, hand })),
  };
}
