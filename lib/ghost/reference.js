// Ghost Round reference: a jab–cross combo as a 3D replay, in the same format
// as lib/motionReplay buildReplay() ({ frames: [{ t, p }], duration, punches }).
//
// Default reference is real motion capture (see buildJabCrossReference). A
// keyframed version is kept from textbook mechanics: the jab extends the lead
// hand while the rear hand stays at the chin; the cross rotates the shoulders
// so the rear shoulder drives forward, while the lead hand returns to guard.
//
// World coords match MediaPipe world landmarks: meters, hip-centred, y down,
// smaller z = closer to the camera.

import { JOINTS, LM } from "@/lib/motionReplay";
import MOCAP_JAB_CROSS from "./mocap-jab-cross.json";
import COACH_JAB_CROSS from "./coach-jab-cross.json";

const CYCLE_S = 1.6;          // one jab–cross + reset
const FPS = 20;
const JAB_PEAK = 0.4;         // seconds into the cycle
const CROSS_PEAK = 0.78;

const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
// 0 → 1 → 0 bump centred on `peak`, half-width `w` (seconds)
const bump = (t, peak, w) => smooth(1 - Math.abs(t - peak) / w);
const lerp = (a, b, k) => a + (b - a) * k;
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

function orthodoxPose(tc) {
  const jab = bump(tc, JAB_PEAK, 0.16);
  const cross = bump(tc, CROSS_PEAK, 0.18);
  const P = Array.from({ length: JOINTS }, () => [0, 0, 0]);
  const set = (i, v) => { P[i] = v; };

  // Shoulders: bladed stance (lead/left forward); the cross rotates them.
  const ls = lerp3([0.17, -0.45, -0.06], [0.15, -0.45, 0.08], cross);
  const rs = lerp3([-0.17, -0.45, 0.06], [-0.13, -0.46, -0.11], cross);
  set(LM.L_SHOULDER, ls);
  set(LM.R_SHOULDER, rs);
  set(LM.NOSE, lerp3([0.01, -0.62, -0.08], [0.03, -0.61, -0.1], cross));

  // Lead hand: guard → jab extension (straight toward the camera).
  const lw = lerp3([0.12, -0.5, -0.24], [0.06, -0.48, -0.66], jab);
  // Rear hand: stays at the chin during the jab, drives out on the cross.
  const rw = lerp3([-0.09, -0.53, -0.14], [0.0, -0.48, -0.68], cross);
  set(LM.L_WRIST, lw);
  set(LM.R_WRIST, rw);

  // Elbows: between shoulder and wrist, bent down at guard, straight at full extension.
  const elbow = (s, w, ext) => {
    const m = lerp3(s, w, 0.5);
    return [m[0] + (s[0] > 0 ? 0.04 : -0.04) * (1 - ext), m[1] + 0.13 * (1 - ext), m[2] + 0.04 * (1 - ext)];
  };
  set(LM.L_ELBOW, elbow(ls, lw, jab));
  set(LM.R_ELBOW, elbow(rs, rw, cross));

  // Hands (17–20) just past the wrists.
  for (const [i, w] of [[17, lw], [19, lw], [18, rw], [20, rw]]) set(i, [w[0] * 0.95, w[1] - 0.03, w[2] - 0.05]);

  // Hips pivot slightly with the cross; legs in a fixed orthodox stance.
  const yaw = 0.07 * cross;
  set(LM.L_HIP, [0.11, 0, 0.02 + yaw]);
  set(LM.R_HIP, [-0.11, 0, -0.02 - yaw]);
  set(LM.L_KNEE, [0.14, 0.42, -0.12]);
  set(LM.R_KNEE, [-0.13, 0.42, 0.1]);
  set(LM.L_ANKLE, [0.15, 0.84, -0.2]);
  set(LM.R_ANKLE, [-0.15, 0.84, 0.16]);
  set(31, [0.17, 0.88, -0.3]);
  set(32, [-0.13, 0.88, 0.06]);
  return P;
}

// MediaPipe left/right index pairs (to mirror orthodox → southpaw).
const SWAP = [[11, 12], [13, 14], [15, 16], [17, 18], [19, 20], [21, 22], [23, 24], [25, 26], [27, 28], [29, 30], [31, 32]];

function mirror(P) {
  const out = P.map(([x, y, z]) => [-x, y, z]);
  for (const [a, b] of SWAP) { const t = out[a]; out[a] = out[b]; out[b] = t; }
  return out;
}

/**
 * Ghost from a recorded segment (e.g. motion capture): `seg` = { fps, frames:
 * [33×[x,y,z]], jabFrame, crossFrame, lead }. Repeats it `cycles` times; the
 * last frames ease back into the first so the loop has no visible jump.
 * Southpaw mirrors it.
 */
export function buildReferenceFromSegment(seg, { stance = "orthodox", cycles = 3, blend = 5 } = {}) {
  const southpaw = stance === "southpaw";
  const segLeadLeft = (seg.lead || "left") === "left";
  const needMirror = southpaw === segLeadLeft; // mirror when the recording's lead side differs
  const n = seg.frames.length;
  const dt = 1000 / seg.fps;
  const base = seg.frames.map((P, i) => {
    if (i < n - blend) return P;
    const w = (i - (n - blend) + 1) / (blend + 1);           // 0 → 1 toward the first frame
    const Q = seg.frames[0];
    return P.map((v, j) => [lerp(v[0], Q[j][0], w), lerp(v[1], Q[j][1], w), lerp(v[2], Q[j][2], w)]);
  });
  const lead = southpaw ? "right" : "left";
  const rear = southpaw ? "left" : "right";
  const frames = [];
  const punches = [];
  for (let c = 0; c < cycles; c++) {
    base.forEach((P0, i) => {
      const P = needMirror ? mirror(P0) : P0;
      const p = new Float32Array(JOINTS * 3);
      P.forEach((v, j) => { p[j * 3] = v[0]; p[j * 3 + 1] = v[1]; p[j * 3 + 2] = v[2]; });
      frames.push({ t: Math.round((c * n + i) * dt), p });
    });
    punches.push({ t: Math.round((c * n + seg.jabFrame) * dt), type: "jab", hand: lead });
    punches.push({ t: Math.round((c * n + seg.crossFrame) * dt), type: "cross", hand: rear });
  }
  return {
    frames, duration: frames[frames.length - 1].t, punches, stance: southpaw ? "southpaw" : "orthodox", kind: "jab-cross", source: seg.source || "recorded",
    // What the camera pipeline measures for this performer (see analyze.js): compare users with that.
    cameraTargets: seg.cameraTargets || null,
  };
}

/**
 * Keyframed jab–cross. `cycles` repetitions at real speed (1.6 s each).
 * Southpaw mirrors the body so the jab comes from the right hand.
 */
export function buildKeyframedJabCross({ stance = "orthodox", cycles = 3 } = {}) {
  const southpaw = stance === "southpaw";
  const lead = southpaw ? "right" : "left";
  const rear = southpaw ? "left" : "right";
  const frames = [];
  const total = CYCLE_S * cycles;
  for (let i = 0; i * (1 / FPS) <= total + 1e-9; i++) {
    const tSec = i / FPS;
    const tc = tSec % CYCLE_S;
    let P = orthodoxPose(tc);
    if (southpaw) P = mirror(P);
    const p = new Float32Array(JOINTS * 3);
    P.forEach((v, j) => { p[j * 3] = v[0]; p[j * 3 + 1] = v[1]; p[j * 3 + 2] = v[2]; });
    frames.push({ t: Math.round(tSec * 1000), p });
  }
  const punches = [];
  for (let c = 0; c < cycles; c++) {
    punches.push({ t: Math.round((c * CYCLE_S + JAB_PEAK) * 1000), type: "jab", hand: lead });
    punches.push({ t: Math.round((c * CYCLE_S + CROSS_PEAK) * 1000), type: "cross", hand: rear });
  }
  return { frames, duration: frames[frames.length - 1].t, punches, stance: southpaw ? "southpaw" : "orthodox", kind: "jab-cross" };
}

/**
 * The Ghost Round reference. Default: GAVANA's coach (the founder) — a real
 * southpaw jab–cross captured with a single camera (Rokoko Vision), unedited;
 * orthodox users see it mirrored. It carries `cameraTargets`: the same coach as
 * GAVANA's camera measures him, which is what users are scored against.
 *
 * `source: "mocap"` — CMU Graphics Lab Motion Capture Database (subject 14,
 * clip 03, "boxing"), with the non-punching hand raised to a coached guard.
 * Data: mocap.cs.cmu.edu — free for research and commercial projects; created
 * with funding from NSF EIA-0196217.
 * `source: "keyframed"` — the hand-keyframed version.
 */
export function buildJabCrossReference({ stance = "orthodox", cycles = 3, source = "coach" } = {}) {
  if (source === "keyframed") return buildKeyframedJabCross({ stance, cycles });
  if (source === "mocap") return buildReferenceFromSegment(MOCAP_JAB_CROSS, { stance, cycles });
  return buildReferenceFromSegment(COACH_JAB_CROSS, { stance, cycles });
}
