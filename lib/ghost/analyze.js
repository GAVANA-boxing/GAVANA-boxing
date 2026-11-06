// Ghost Round analysis: compare the user's jab–cross round against the ghost
// reference, using the same measurements on both, and pick ONE coaching tip.
// Pure functions over replays ({ frames: [{ t, p }], punches: [{ t, hand }] }).

import { LM, guardState } from "@/lib/motionReplay";

const COMBO_GAP_MS = 900;      // a cross within this after a jab = a combo
const PEAK_BEFORE_MS = 400;    // punch events are logged around/after the peak
const PEAK_AFTER_MS = 120;

const v = (p, i) => [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function sides(stance) {
  return stance === "southpaw"
    ? { leadHand: "right", rearHand: "left", lead: { s: LM.R_SHOULDER, w: LM.R_WRIST }, rear: { s: LM.L_SHOULDER, w: LM.L_WRIST }, rearGuardKey: "left", leadGuardKey: "right" }
    : { leadHand: "left", rearHand: "right", lead: { s: LM.L_SHOULDER, w: LM.L_WRIST }, rear: { s: LM.R_SHOULDER, w: LM.R_WRIST }, rearGuardKey: "right", leadGuardKey: "left" };
}

/** Arm reach at a frame: shoulder→wrist distance in shoulder-widths. */
export function armReach(p, arm) {
  const sw = Math.max(dist(v(p, LM.L_SHOULDER), v(p, LM.R_SHOULDER)), 0.1);
  return dist(v(p, arm.s), v(p, arm.w)) / sw;
}

/** Shoulder-line yaw in degrees (rotation around the vertical axis). */
export function shoulderYaw(p) {
  const l = v(p, LM.L_SHOULDER), r = v(p, LM.R_SHOULDER);
  return (Math.atan2(r[2] - l[2], r[0] - l[0]) * 180) / Math.PI;
}

/** Frame with the largest reach for `arm` around a punch at time t. */
function peakFrame(replay, t, arm) {
  let best = null, bestReach = -Infinity;
  for (const fr of replay.frames) {
    if (fr.t < t - PEAK_BEFORE_MS || fr.t > t + PEAK_AFTER_MS) continue;
    const r = armReach(fr.p, arm);
    if (r > bestReach) { bestReach = r; best = fr; }
  }
  return best;
}

function isNearPunch(replay, t, ms = 450) {
  return replay.punches.some((pk) => Math.abs(pk.t - t) <= ms);
}

/** Measure one replay. Returns the per-round metrics used for comparison. */
export function measureRound(replay, stance = "orthodox") {
  const S = sides(stance);
  if (!replay?.frames?.length) {
    return { jabs: 0, crosses: 0, combos: 0, jabReach: null, crossReach: null, rearGuardOnJab: null, crossRotation: null };
  }
  const jabs = replay.punches.filter((pk) => pk.hand === S.leadHand);
  const crosses = replay.punches.filter((pk) => pk.hand === S.rearHand);

  let combos = 0, lastJab = -Infinity;
  for (const pk of replay.punches) {
    if (pk.hand === S.leadHand) lastJab = pk.t;
    else if (pk.hand === S.rearHand && pk.t - lastJab <= COMBO_GAP_MS) { combos++; lastJab = -Infinity; }
  }

  // Guard-position yaw baseline: frames away from any punch.
  const baseYaw = median(replay.frames.filter((fr) => !isNearPunch(replay, fr.t)).map((fr) => shoulderYaw(fr.p)));

  const jabReach = [], rearUp = [], crossReach = [], crossRot = [];
  for (const pk of jabs) {
    const fr = peakFrame(replay, pk.t, S.lead);
    if (!fr) continue;
    jabReach.push(armReach(fr.p, S.lead));
    rearUp.push(guardState(fr.p)[S.rearGuardKey] === "up" ? 1 : 0);
  }
  for (const pk of crosses) {
    const fr = peakFrame(replay, pk.t, S.rear);
    if (!fr) continue;
    crossReach.push(armReach(fr.p, S.rear));
    if (baseYaw != null) crossRot.push(Math.abs(shoulderYaw(fr.p) - baseYaw));
  }

  return {
    jabs: jabs.length,
    crosses: crosses.length,
    combos,
    jabReach: median(jabReach),
    crossReach: median(crossReach),
    rearGuardOnJab: mean(rearUp),
    crossRotation: median(crossRot),
  };
}

export const TIPS = {
  combo: {
    mn: "Jab-ийн дараа шууд cross шид — хоёулаа нэг хэмнэлээр: «нэг-хоёр».",
    ko: "잽 다음 바로 크로스 — 한 리듬으로 「원-투」.",
    en: "Throw the cross right after the jab — one rhythm: “one-two”.",
  },
  guard: {
    mn: "Jab хийх үед хойд гараа эрүүндээ барь — тэр мөчид нүүр чинь нээлттэй үлдэж байна.",
    ko: "잽을 칠 때 뒷손은 턱에 붙여 두세요 — 그 순간 얼굴이 열려 있어요.",
    en: "Keep your rear hand on your chin while you jab — your face is open at that moment.",
  },
  rotation: {
    mn: "Cross-оо гараараа биш, мөр, ташаагаа эргүүлж цох — хойд мөр чинь урагшаа гарах ёстой.",
    ko: "크로스는 팔이 아니라 어깨와 골반 회전으로 — 뒷어깨가 앞으로 나와야 해요.",
    en: "Throw the cross from your shoulders and hips, not just the arm — the rear shoulder should come forward.",
  },
  reach: {
    mn: "Гараа бүрэн сунга — jab, cross хоёулаа зорилтдоо хүрэхгүй дутуу байна.",
    ko: "팔을 끝까지 뻗으세요 — 펀치가 목표에 못 미치고 있어요.",
    en: "Extend fully — your punches are stopping short of the target.",
  },
  great: {
    mn: "Ghost-той маш ойр! Дараагийн раундад хурдаа нэмж, хэмнэлээ барь.",
    ko: "고스트와 거의 같아요! 다음 라운드는 속도를 올리고 리듬을 유지하세요.",
    en: "Very close to the ghost! Next round, add speed and keep the rhythm.",
  },
};

const ratio = (you, ref) => (you == null || !ref ? 0 : Math.max(0, Math.min(1, you / ref)));

/**
 * Compare a user round to the reference. Returns the metrics for both, a
 * 0–100 match score, and the ONE tip worth fixing first (by priority: no
 * combos → guard (defence first) → rotation → reach → great).
 */
export function analyzeGhostRound(userReplay, refReplay, stance = "orthodox") {
  const you = measureRound(userReplay, stance);
  const ref = measureRound(refReplay, stance);

  const parts = {
    combo: you.combos > 0 ? 1 : 0,
    guard: you.rearGuardOnJab ?? 0,
    rotation: ratio(you.crossRotation, ref.crossRotation),
    reach: (ratio(you.jabReach, ref.jabReach) + ratio(you.crossReach, ref.crossReach)) / 2,
  };
  const match = Math.round((parts.combo * 0.2 + parts.guard * 0.3 + parts.rotation * 0.25 + parts.reach * 0.25) * 100);

  let tip = "great";
  if (you.combos === 0) tip = "combo";
  else if ((you.rearGuardOnJab ?? 0) < 0.6) tip = "guard";
  else if (parts.rotation < 0.6) tip = "rotation";
  else if (parts.reach < 0.85) tip = "reach";

  return { you, ref, match, tip, tipText: TIPS[tip] };
}
