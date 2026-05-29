/**
 * Boxing Intelligence Engine
 *
 * Deterministic biomechanical heuristics — no ML.
 * Scores punch mechanics from PunchPhaseDetector events + pose session metrics.
 * Outputs are normalized 0-100 so scores are directly comparable.
 *
 * Normalized velocity thresholds calibrated for MediaPipe lite, shoulder-relative,
 * front-facing camera, ~10fps, EMA α=0.35.
 */

import { computeRingIQ } from "./ringIQ.js";

// ── Phase 4: Fighter DNA ───────────────────────────────────────────────────────
// Maps the fighter's aggregate profile to professional-boxer archetypes.
// Each archetype has a match formula using tactical + defensive + ringIQ metrics.

const ARCHETYPES = [
  {
    id:     "tank",
    label:  "Tank Davis",
    traits: ["Explosive power shots", "Short-range pressure", "High finish rate"],
    match:  ({ tactical, ringIQ }) =>
      (tactical?.rhythmAggression ?? 0) >= 60 &&
      (tactical?.singleShotPct ?? 100) >= 50 &&
      (ringIQ?.overcommitRate ?? 0) < 30,
  },
  {
    id:     "bivol",
    label:  "Bivol Style",
    traits: ["Jab-led pressure", "High volume", "Disciplined guard"],
    match:  ({ tactical, defensive }) =>
      tactical?.dominantEntry === "jab" &&
      (tactical?.pressureChainPct ?? 0) >= 40 &&
      (defensive?.defensiveStyle !== "guard_reliant"),
  },
  {
    id:     "inoue",
    label:  "Inoue Pressure",
    traits: ["Non-stop combination work", "Hook-heavy entries", "Relentless rhythm"],
    match:  ({ tactical, ringIQ }) =>
      (tactical?.pressureChainPct ?? 0) >= 55 &&
      (tactical?.dominantEntry === "hook" || tactical?.entryPreference?.hook >= 35) &&
      (ringIQ?.iqScore ?? 0) >= 55,
  },
  {
    id:     "shakur",
    label:  "Shakur Rhythm",
    traits: ["Counter-punch specialist", "Rhythm variation", "Evasive footwork"],
    match:  ({ tactical, defensive, ringIQ }) =>
      (tactical?.counterPct ?? 0) >= 35 &&
      (defensive?.defensiveStyle === "evasive" || defensive?.slipCount >= 3) &&
      !(ringIQ?.predictableRhythm),
  },
  {
    id:     "canelo",
    label:  "Canelo Style",
    traits: ["Balanced attack", "Body-head combos", "High Ring IQ"],
    match:  ({ tactical, ringIQ }) =>
      (ringIQ?.iqScore ?? 0) >= 65 &&
      (tactical?.singleShotPct ?? 100) < 60 &&
      (tactical?.pressureChainPct ?? 0) >= 30,
  },
];

export function computeFighterDNA(tactical, defensive, ringIQ) {
  if (!tactical && !ringIQ) return null;

  const ctx = { tactical, defensive, ringIQ };

  // Find best-matching archetype (first match wins — ordered by specificity)
  const matched = ARCHETYPES.find((a) => a.match(ctx));

  const archetype = matched ?? {
    id:     "raw",
    label:  "Raw Fighter",
    traits: ["Unformed style", "High growth potential", "Build on combo work"],
  };

  // Similarity score — how strongly do the metrics align?
  // Simple heuristic: count how many positive signals the fighter has
  let signals = 0;
  if ((tactical?.pressureChainPct ?? 0) >= 40) signals++;
  if ((tactical?.counterPct ?? 0) >= 25) signals++;
  if ((tactical?.singleShotPct ?? 100) < 60) signals++;
  if ((defensive?.defensiveTotal ?? 0) >= 3) signals++;
  if ((ringIQ?.iqScore ?? 0) >= 60) signals++;
  if ((ringIQ?.panicFlurries?.length ?? 0) === 0) signals++;
  const similarity = Math.round((signals / 6) * 100);

  return {
    archetype:       archetype.id,
    archetypeLabel:  archetype.label,
    archetypeTraits: archetype.traits,
    similarity,
  };
}

const CONFIDENT = 0.45; // minimum confidence to include in quality analysis

// ── Utility ────────────────────────────────────────────────────────────────────

function avg(arr) {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Map value in [inLo, inHi] to [outLo, outHi] with linear interpolation
function remap(val, inLo, inHi, outLo, outHi) {
  const t = clamp((val - inLo) / (inHi - inLo), 0, 1);
  return Math.round(outLo + t * (outHi - outLo));
}

// ── Guard recovery ─────────────────────────────────────────────────────────────
// Uses recoilMs on each punch event.

export function scoreGuardRecovery(punchEvents) {
  const valid = punchEvents.filter(
    (e) => e.recoilMs != null && (e.confidence ?? 1) >= CONFIDENT
  );
  if (valid.length < 2) return null;

  const msArr  = valid.map((e) => e.recoilMs);
  const avgMs  = avg(msArr);
  const worstMs = Math.max(...msArr);

  // Score: tighter recovery = better
  const score =
    avgMs < 220  ? 100 :
    avgMs < 350  ? remap(avgMs, 220, 350,  88, 100) :
    avgMs < 480  ? remap(avgMs, 350, 480,  62, 88) :
    avgMs < 650  ? remap(avgMs, 480, 650,  35, 62) :
    avgMs < 900  ? remap(avgMs, 650, 900,  12, 35) : 5;

  const rating =
    score >= 85 ? "quick" :
    score >= 60 ? "average" :
    score >= 30 ? "slow" : "very slow";

  return {
    score,
    avgMs:   Math.round(avgMs),
    worstMs: Math.round(worstMs),
    rating,
    count:   valid.length,
  };
}

// ── Combo rhythm ───────────────────────────────────────────────────────────────
// Detects combo structure and timing consistency.

export function scoreComboRhythm(punchEvents) {
  const confident = punchEvents.filter((e) => (e.confidence ?? 1) >= CONFIDENT);
  if (confident.length < 3) return null;

  const sorted    = [...confident].sort((a, b) => a.ts - b.ts);
  const intervals = sorted.slice(1).map((e, i) => e.ts - sorted[i].ts);

  const COMBO_THRESH = 800; // ms gap: punches within this = same combo

  // Spam: mechanically too fast to be intentional (<150ms)
  const spamCount = intervals.filter((d) => d < 150).length;
  const spamPct   = Math.round((spamCount / intervals.length) * 100);

  // Combo detection
  let comboCount = 0, currentLen = 1, longestCombo = 1;
  for (const iv of intervals) {
    if (iv < COMBO_THRESH) {
      currentLen++;
      longestCombo = Math.max(longestCombo, currentLen);
    } else {
      if (currentLen > 1) comboCount++;
      currentLen = 1;
    }
  }
  if (currentLen > 1) comboCount++;

  // Rhythm consistency — coefficient of variation of combo intervals
  const comboIvs = intervals.filter((d) => d < COMBO_THRESH);
  const avgComboMs = avg(comboIvs);
  let rhythmCV = null;
  if (comboIvs.length >= 2 && avgComboMs > 0) {
    const variance = avg(comboIvs.map((d) => (d - avgComboMs) ** 2));
    rhythmCV = Math.round((Math.sqrt(variance) / avgComboMs) * 100) / 100;
  }

  // Score composition
  let score = 45;
  score -= spamPct * 0.5;                                  // spam penalty
  score += Math.min(20, comboCount * 6);                   // combo bonus
  if (longestCombo >= 4) score += 12;
  else if (longestCombo >= 3) score += 6;
  if (rhythmCV !== null) {
    if      (rhythmCV < 0.20) score += 28;
    else if (rhythmCV < 0.35) score += 16;
    else if (rhythmCV < 0.55) score +=  6;
    else                      score -=  8;
  }
  score = clamp(Math.round(score), 0, 100);

  const rating =
    rhythmCV === null         ? "single punches" :
    rhythmCV  < 0.22          ? "rhythmic" :
    rhythmCV  < 0.45          ? "mechanical" : "erratic";

  return {
    score,
    avgIntervalMs: avgComboMs ? Math.round(avgComboMs) : null,
    comboCount,
    longestCombo,
    spamPct,
    rhythmCV,
    rating,
  };
}

// ── Punch quality by type ──────────────────────────────────────────────────────

function snapScore(snapVel) {
  if (snapVel == null) return 50;
  return snapVel >= 0.100 ? 100 :
         snapVel >= 0.078 ? remap(snapVel, 0.078, 0.100, 75, 100) :
         snapVel >= 0.055 ? remap(snapVel, 0.055, 0.078, 45, 75) :
                            remap(snapVel, 0.020, 0.055, 10, 45);
}

function recoilScore(ms) {
  if (ms == null) return 50;
  return ms < 240  ? 100 :
         ms < 380  ? remap(ms,  240, 380, 78, 100) :
         ms < 560  ? remap(ms,  380, 560, 45,  78) :
                     remap(ms,  560, 900, 10,  45);
}

function extensionScore(angle) {
  return angle >= 162 ? 100 :
         angle >= 148 ? remap(angle, 148, 162, 80, 100) :
         angle >= 132 ? remap(angle, 132, 148, 50,  80) :
                        remap(angle, 105, 132, 10,  50);
}

function straightnessScore(lateralRatioPct) {
  // Lateral% from punchEvent is 0-100 (percentage)
  const r = lateralRatioPct / 100;
  return r < 0.25 ? 100 :
         r < 0.42 ? remap(r * 100, 25, 42, 68, 100) :
         r < 0.58 ? remap(r * 100, 42, 58, 32,  68) :
                    remap(r * 100, 58, 85,  5,  32);
}

export function scorePunchQuality(punchEvents, type) {
  const valid = punchEvents.filter(
    (e) => e.type === type && (e.confidence ?? 1) >= CONFIDENT
  );
  if (valid.length < 2) return null;

  const avgAngle  = avg(valid.map((e) => e.peakAngle));
  const avgSnap   = avg(valid.filter((e) => e.snapVelocity > 0).map((e) => e.snapVelocity));
  const avgRec    = avg(valid.filter((e) => e.recoilMs != null).map((e) => e.recoilMs));
  const avgLat    = avg(valid.map((e) => e.lateralRatio)); // 0-100

  if (type === "jab" || type === "cross") {
    const ext    = extensionScore(avgAngle);
    const snap   = snapScore(avgSnap);
    const recoil = recoilScore(avgRec);
    const str    = straightnessScore(avgLat ?? 35);

    const score = Math.round(ext * 0.35 + snap * 0.30 + recoil * 0.20 + str * 0.15);
    return { score, type, extension: ext, snap, recoil, straightness: str,
             avgAngle: Math.round(avgAngle), count: valid.length };
  }

  if (type === "hook") {
    // Hook ideal: elbow 95-115°, high lateral arc
    const IDEAL_HOOK = 105;
    const angleDiff  = Math.abs(avgAngle - IDEAL_HOOK);
    const hookAngle  = angleDiff < 8  ? 100 :
                       angleDiff < 18 ? remap(angleDiff, 8, 18, 82, 100) :
                       angleDiff < 35 ? remap(angleDiff, 18, 35, 50, 82) :
                                        remap(angleDiff, 35, 60, 10, 50);

    const arc        = avgLat == null ? 50 :
                       avgLat  > 70 ? 100 :
                       avgLat  > 55 ? remap(avgLat, 55, 70, 62, 100) :
                       avgLat  > 40 ? remap(avgLat, 40, 55, 28,  62) :
                                      remap(avgLat, 20, 40,  5,  28);

    const snap   = snapScore(avgSnap);
    const recoil = recoilScore(avgRec);

    const score = Math.round(hookAngle * 0.30 + arc * 0.35 + snap * 0.20 + recoil * 0.15);
    return { score, type, elbowAngle: hookAngle, arc, snap, recoil,
             avgAngle: Math.round(avgAngle), avgLat: Math.round(avgLat ?? 0), count: valid.length };
  }

  return null;
}

// ── Hip rotation ───────────────────────────────────────────────────────────────

function scoreHipRotation(rotationMetric) {
  if (!rotationMetric) return null;
  const score = { good: 80, under_rotated: 32, over_rotated: 55 }[rotationMetric.status] ?? 50;
  return { score, status: rotationMetric.status };
}

// ── Balance ────────────────────────────────────────────────────────────────────

function scoreBalance(balanceMetric) {
  if (!balanceMetric) return null;
  const score = balanceMetric.status === "good" ? 88 :
                balanceMetric.status === "off_balance" ? 28 : 50;
  return { score, status: balanceMetric.status };
}

// ── Fighting style detection ───────────────────────────────────────────────────
//
// Four archetypes: pressure / outboxer / explosive / counter
// Each archetype accumulates points from observable signals.

const STYLE_LABELS = {
  pressure:  "Pressure Fighter",
  outboxer:  "Outboxer",
  explosive: "Explosive",
  counter:   "Counter Puncher",
};

function detectStyle(punchEvents, scores) {
  if (punchEvents.length < 5) return null;

  const sorted    = [...punchEvents].sort((a, b) => a.ts - b.ts);
  const intervals = sorted.slice(1).map((e, i) => e.ts - sorted[i].ts);
  const avgIv     = avg(intervals) ?? 1000;

  const total     = punchEvents.length;
  const jabRatio  = punchEvents.filter((e) => e.type === "jab").length  / total;
  const hookRatio = punchEvents.filter((e) => e.type === "hook").length / total;
  const avgSnap   = avg(punchEvents.filter((e) => e.snapVelocity > 0).map((e) => e.snapVelocity)) ?? 0;
  const guardScr  = scores.guardRecovery?.score ?? 50;
  const combosCnt = scores.comboRhythm?.comboCount ?? 0;
  const rhythmCV  = scores.comboRhythm?.rhythmCV ?? 0.5;

  const pts = { pressure: 0, outboxer: 0, explosive: 0, counter: 0 };

  // Volume
  if      (total >= 20) { pts.pressure += 25; pts.explosive += 10; }
  else if (total >= 12) { pts.pressure += 10; pts.explosive +=  5; }
  else if (total <= 6)  { pts.counter  += 20; pts.outboxer  += 10; }

  // Pace (interval between punches)
  if      (avgIv < 320) { pts.pressure += 20; pts.explosive += 15; }
  else if (avgIv < 600) { pts.outboxer += 12; }
  else                  { pts.outboxer += 18; pts.counter   += 15; }

  // Jab ratio
  if      (jabRatio > 0.55) { pts.outboxer += 22; pts.counter  +=  8; }
  else if (jabRatio < 0.22) { pts.pressure += 10; pts.explosive+=  8; }

  // Hook usage
  if      (hookRatio > 0.30) { pts.pressure += 14; pts.explosive += 14; }
  else if (hookRatio < 0.05) { pts.counter  +=  8; pts.outboxer  +=  8; }

  // Guard recovery
  if      (guardScr >= 78) { pts.counter  += 14; pts.outboxer += 10; }
  else if (guardScr <  38) { pts.pressure +=  8; }

  // Snap
  if      (avgSnap >= 0.085) { pts.explosive += 20; }
  else if (avgSnap < 0.040)  { pts.counter   +=  8; }

  // Combo activity
  if (combosCnt >= 3) { pts.pressure += 14; pts.explosive += 10; }

  // Rhythm
  if      (rhythmCV < 0.28) { pts.outboxer += 14; }
  else if (rhythmCV > 0.55) { pts.explosive += 10; }

  const [bestStyle, bestPts] = Object.entries(pts).sort((a, b) => b[1] - a[1])[0];
  const confidence = Math.min(1, bestPts / 65);

  return {
    style:      bestStyle,
    label:      STYLE_LABELS[bestStyle],
    confidence: Math.round(confidence * 100) / 100,
  };
}

// ── Weakness detection ─────────────────────────────────────────────────────────

function detectWeakness(scores) {
  const candidates = [
    { key: "guardRecovery", label: "guard recovery",  score: scores.guardRecovery?.score },
    { key: "comboRhythm",   label: "combo rhythm",    score: scores.comboRhythm?.score },
    { key: "jabQuality",    label: "jab quality",     score: scores.jabQuality?.score },
    { key: "crossQuality",  label: "cross quality",   score: scores.crossQuality?.score },
    { key: "hookQuality",   label: "hook quality",    score: scores.hookQuality?.score },
    { key: "hipRotation",   label: "hip rotation",    score: scores.hipRotation?.score },
    { key: "balance",       label: "balance",         score: scores.balance?.score },
  ].filter((c) => c.score != null);

  if (!candidates.length) return null;
  return candidates.sort((a, b) => a.score - b.score)[0];
}

// ── Coaching message generation ────────────────────────────────────────────────
//
// Covers analysis areas NOT already handled by cinematicCoaching.js:
//   - combo rhythm
//   - jab path (straightness)
//   - cross snap / power transfer
//   - hook arc + elbow alignment
//
// Guard recovery, rotation, balance, stance are deliberately skipped here
// because cinematicCoaching.js already generates messages for those.

function intelligenceCoaching(scores) {
  const out = [];

  // Combo rhythm
  const cr = scores.comboRhythm;
  if (cr) {
    if (cr.score < 35) {
      out.push({ type: "improve",  message: "Punches are scattered — work on 2-punch combos (1-2) with consistent timing before adding volume" });
    } else if (cr.score < 62) {
      out.push({ type: "improve",  message: "Rhythm developing — set a tempo and stick to it, each combo the same beat" });
    } else if (cr.score >= 75 && cr.comboCount >= 2) {
      out.push({ type: "strength", message: "Combo timing is clean — consistent rhythm between punches" });
    }
  }

  // Jab quality
  const jq = scores.jabQuality;
  if (jq) {
    if ((jq.straightness ?? 100) < 42) {
      out.push({ type: "improve",  message: "Jab drifting wide — keep the fist travelling in a straight line from chin to target and back" });
    } else if (jq.extension < 48) {
      out.push({ type: "improve",  message: "Jab is short — reach through the target, don't stop at contact" });
    } else if (jq.snap < 48) {
      out.push({ type: "improve",  message: "Jab is slow — drive it out sharply from the shoulder, don't push it" });
    } else if (jq.score >= 72) {
      out.push({ type: "strength", message: "Jab is working — reaching out straight with snap and quick return" });
    }
  }

  // Cross quality
  const xq = scores.crossQuality;
  if (xq) {
    if (xq.extension < 48) {
      out.push({ type: "improve",  message: "Cross is short — fully commit the rear shoulder, drive through the target" });
    } else if (xq.snap < 45) {
      out.push({ type: "improve",  message: "Cross has no pop — rotate into it hard, don't just reach with the arm" });
    } else if (xq.score >= 72) {
      out.push({ type: "strength", message: "Cross extension is solid — rear hand driving through with power" });
    }
  }

  // Hook quality
  const hq = scores.hookQuality;
  if (hq) {
    if ((hq.elbowAngle ?? 100) < 45) {
      out.push({ type: "improve",  message: "Hook arm is too straight — keep elbow at 90° before releasing the arc, not a slap" });
    } else if ((hq.arc ?? 100) < 40) {
      out.push({ type: "improve",  message: "Hook has no arc — commit to the lateral swing, don't pull it short" });
    } else if (hq.score >= 70) {
      out.push({ type: "strength", message: "Hook mechanics are tight — good bend and lateral arc" });
    }
  }

  // Limit to most impactful messages (1 improve per category already enforced above)
  // Prioritise: improve first, then strengths; cap total at 4 new messages
  const improve   = out.filter((m) => m.type === "improve");
  const strength  = out.filter((m) => m.type === "strength");
  return [...improve.slice(0, 3), ...strength.slice(0, 2)];
}

// ── Phase 1: Tactical Identity ─────────────────────────────────────────────────
//
// Computed from comboStats (ComboSequencer output) + punchEvents.
// Produces behavioural fingerprint independent of raw punch count or quality scores.
//
// Metrics:
//   singleShotPct      — % of punches thrown outside any combo (isolated shots)
//   entryPreference    — { jab, cross, hook } % of combo starts per type
//   dominantEntry      — most common combo entry punch
//   pressureChainPct   — % of combos classified as "pressure" (forward)
//   counterPct         — % of combos classified as "counter" (reactive)
//   rhythmAggression   — composite: avg combo rhythm × pressure orientation (0-100)
//   profile            — one of: pressure_builder | counter_striker | single_shot |
//                                combo_boxer | explosive_blitzer | balanced
//   profileLabel       — human-readable profile name
//   tacticalCues       — 1-2 coaching lines specific to this tactical profile

export function computeTacticalIdentity(comboStats, punchEvents = []) {
  if (!comboStats || !punchEvents.length) return null;

  const { sessionCombos = [], comboCount = 0, maxComboLength = 0 } = comboStats;
  const totalPunches = punchEvents.length;

  // ── Single-shot tendency ──────────────────────────────────────────────────────
  // Punches that land inside a recorded combo vs total detected.
  // High % = fighter relies on isolated power shots rather than combination work.
  const punchesInCombos = sessionCombos.reduce((s, c) => s + (c.length ?? 0), 0);
  const singleShotPct   = totalPunches > 0
    ? Math.round(Math.max(0, (totalPunches - punchesInCombos) / totalPunches) * 100)
    : 100;

  // ── Combo entry preference ────────────────────────────────────────────────────
  // First punch of each combo reveals habitual "door opener".
  const entryCounts = { jab: 0, cross: 0, hook: 0 };
  for (const c of sessionCombos) {
    const first = c.types?.[0];
    if (first && entryCounts[first] !== undefined) entryCounts[first]++;
  }
  const totalEntries = sessionCombos.length;
  const entryPreference = totalEntries > 0 ? {
    jab:   Math.round((entryCounts.jab   / totalEntries) * 100),
    cross: Math.round((entryCounts.cross / totalEntries) * 100),
    hook:  Math.round((entryCounts.hook  / totalEntries) * 100),
  } : null;
  const dominantEntry = entryPreference
    ? Object.entries(entryPreference).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  // ── Pressure vs counter chain % ───────────────────────────────────────────────
  const pressureCombos   = sessionCombos.filter((c) => c.category === "pressure").length;
  const counterCombos    = sessionCombos.filter((c) => c.category === "counter").length;
  const pressureChainPct = comboCount > 0 ? Math.round((pressureCombos / comboCount) * 100) : 0;
  const counterPct       = comboCount > 0 ? Math.round((counterCombos  / comboCount) * 100) : 0;

  // ── Rhythm aggression ─────────────────────────────────────────────────────────
  // Fighters who combine fast combo rhythm WITH pressure orientation score highest.
  const avgComboRhythm = sessionCombos.length > 0
    ? Math.round(sessionCombos.reduce((s, c) => s + (c.quality?.rhythm ?? 50), 0) / sessionCombos.length)
    : 0;
  // pressure multiplier 0.5-1.0, rhythm 0-100 → product 0-100
  const pressureMult    = 0.5 + (pressureChainPct / 200);
  const rhythmAggression = Math.round(Math.min(100, avgComboRhythm * pressureMult));

  // ── Tactical profile classification ───────────────────────────────────────────
  let profile, profileLabel;

  if (singleShotPct > 65) {
    profile      = "single_shot";
    profileLabel = "Single Shot Puncher";
  } else if (pressureChainPct >= 55 && singleShotPct < 55 && dominantEntry === "jab") {
    profile      = "pressure_builder";
    profileLabel = "Pressure Builder";
  } else if (counterPct >= 40) {
    profile      = "counter_striker";
    profileLabel = "Counter Striker";
  } else if (comboCount >= 8 && maxComboLength >= 4) {
    profile      = "combo_boxer";
    profileLabel = "Combo Boxer";
  } else if (rhythmAggression >= 65) {
    profile      = "explosive_blitzer";
    profileLabel = "Explosive Blitzer";
  } else {
    profile      = "balanced";
    profileLabel = "Balanced Fighter";
  }

  // ── Tactical coaching cues ────────────────────────────────────────────────────
  const tacticalCues = [];

  if (dominantEntry === "jab" && pressureChainPct >= 40) {
    tacticalCues.push("Jab-led pressure is your signature — keep setting the table");
  } else if (dominantEntry === "cross" || dominantEntry === "hook") {
    tacticalCues.push("Power-punch entry signals counter instinct — time it off a slip or parry");
  } else if (!dominantEntry) {
    tacticalCues.push("No clear entry pattern yet — commit to a lead punch and build from it");
  }

  if (singleShotPct > 55) {
    tacticalCues.push("Chain single shots into 2-punch combos — doubles the effective pressure");
  } else if (pressureChainPct >= 60) {
    tacticalCues.push("Pressure chain is strong — vary your exit angles to avoid counters");
  } else if (counterPct >= 40) {
    tacticalCues.push("Counter timing is developing — keep guard tight in the window before firing");
  }

  return {
    profile,
    profileLabel,
    singleShotPct,
    entryPreference,
    dominantEntry,
    pressureChainPct,
    counterPct,
    rhythmAggression,
    avgComboRhythm,
    tacticalCues: tacticalCues.slice(0, 2),
  };
}

// ── Phase 2: Defensive Intelligence ───────────────────────────────────────────
//   Interprets defensiveStats from DefensiveDetector into a coaching profile.

export function computeDefensiveProfile(defensiveStats) {
  if (!defensiveStats) return null;

  const { slipCount, bobCount, defensiveTotal, defensiveFreqPerMin, defensiveStyle } = defensiveStats;

  const styleLabel = {
    guard_reliant:    "Guard Reliant",
    evasive:          "Evasive Mover",
    pressure_shell:   "Shell & Pressure",
    active_defender:  "Active Defender",
    mixed_defense:    "Mixed Defense",
  }[defensiveStyle] ?? "Unknown";

  const cues = [];

  if (defensiveStyle === "guard_reliant") {
    cues.push("Add head movement — slipping punches reduces incoming damage");
  } else if (defensiveStyle === "evasive") {
    cues.push("Strong lateral movement — pair slips with counters to capitalise");
  } else if (defensiveStyle === "pressure_shell") {
    cues.push("Shell defense keeps you covered — add slips to create counter angles");
  } else if (defensiveStyle === "active_defender") {
    cues.push("High defensive output — balance it with offensive aggression");
  }

  if (slipCount > 0 && bobCount === 0) {
    cues.push("Try adding bob-and-weave to your head movement arsenal");
  }

  return {
    slipCount,
    bobCount,
    defensiveTotal,
    defensiveFreqPerMin,
    defensiveStyle,
    defensiveStyleLabel: styleLabel,
    defensiveCues: cues.slice(0, 2),
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function analyzeSession(sessionSummary, punchEvents = []) {
  if (!punchEvents.length) return null;

  const scores = {
    guardRecovery: scoreGuardRecovery(punchEvents),
    comboRhythm:   scoreComboRhythm(punchEvents),
    jabQuality:    scorePunchQuality(punchEvents, "jab"),
    crossQuality:  scorePunchQuality(punchEvents, "cross"),
    hookQuality:   scorePunchQuality(punchEvents, "hook"),
    hipRotation:   scoreHipRotation(sessionSummary?.rotation),
    balance:       scoreBalance(sessionSummary?.balance),
  };

  const styleInfo  = detectStyle(punchEvents, scores);
  const weakness   = detectWeakness(scores);
  const coaching   = intelligenceCoaching(scores);
  const tactical   = computeTacticalIdentity(sessionSummary?.comboStats, punchEvents);
  const defensive  = computeDefensiveProfile(sessionSummary?.defensiveStats);
  const ringIQ     = computeRingIQ(punchEvents, sessionSummary?.comboStats);
  const fighterDNA = computeFighterDNA(tactical, defensive, ringIQ);

  return {
    scores,
    style:           styleInfo?.style      ?? null,
    styleLabel:      styleInfo?.label      ?? null,
    styleConfidence: styleInfo?.confidence ?? 0,
    weakness,
    coaching,
    tactical,
    defensive,
    ringIQ,
    fighterDNA,
  };
}
