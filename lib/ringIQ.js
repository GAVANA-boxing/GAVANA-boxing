/**
 * Ring IQ Engine — Phase 3
 *
 * Reads behavioural patterns from punch events and combo stats to assess
 * the fighter's in-ring decision-making quality:
 *
 *  - panicFlurry    — burst of punches in short time with low avg quality
 *  - calmPacing     — deliberate pacing with consistent timing
 *  - overcommitting — punches with very long guard-return (recoilMs) times
 *  - predictableRhythm — very low CV in inter-punch timing (easy to read)
 *  - comboRepetition   — same combo type thrown ≥3 times
 *
 * Returns a 0-100 Ring IQ score plus detected pattern list.
 */

// ── Thresholds ──────────────────────────────────────────────────────────────

const FLURRY_WINDOW_MS   = 3000;  // window to detect burst
const FLURRY_MIN_PUNCHES = 5;     // burst size
const FLURRY_MAX_QUALITY = 50;    // avg quality below this = panic
const OVERCOMMIT_MS      = 750;   // recoilMs above this = overcommit
const CALM_MIN_GAP_MS    = 1800;  // avg gap above this = calm pacing
const CALM_MAX_CV        = 0.30;  // rhythm CV below this = calm
const RHYTHM_PRED_CV     = 0.20;  // CV below this = predictable (too readable)
const REPEAT_MIN         = 3;     // combo sequence must appear this many times

// ── Helpers ─────────────────────────────────────────────────────────────────

function avg(arr) {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const mean = avg(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);
}

function cv(arr) {
  const m = avg(arr);
  return m > 0 ? stdDev(arr) / m : 0;
}

// ── Detectors ───────────────────────────────────────────────────────────────

function detectPanicFlurries(punchEvents) {
  const flurries = [];
  for (let i = 0; i < punchEvents.length; i++) {
    const windowEnd = punchEvents[i].ts + FLURRY_WINDOW_MS;
    const burst = punchEvents.filter((e) => e.ts >= punchEvents[i].ts && e.ts <= windowEnd);
    if (burst.length >= FLURRY_MIN_PUNCHES) {
      const q = avg(burst.map((e) => e.confidence ?? 0.5).map((c) => c * 100));
      if (q < FLURRY_MAX_QUALITY) {
        flurries.push({ startTs: punchEvents[i].ts, count: burst.length, avgQuality: Math.round(q) });
        // Skip ahead past this burst
        i += burst.length - 1;
      }
    }
  }
  return flurries;
}

function detectCalmPacing(punchEvents) {
  if (punchEvents.length < 4) return false;
  const gaps = [];
  for (let i = 1; i < punchEvents.length; i++) {
    gaps.push(punchEvents[i].ts - punchEvents[i - 1].ts);
  }
  return avg(gaps) >= CALM_MIN_GAP_MS && cv(gaps) < CALM_MAX_CV;
}

function detectOvercommitting(punchEvents) {
  const bad = punchEvents.filter((e) => (e.recoilMs ?? 0) > OVERCOMMIT_MS);
  const rate = punchEvents.length > 0 ? bad.length / punchEvents.length : 0;
  return { overcommitCount: bad.length, overcommitRate: Math.round(rate * 100) };
}

function detectPredictableRhythm(punchEvents) {
  if (punchEvents.length < 5) return false;
  const gaps = [];
  for (let i = 1; i < punchEvents.length; i++) {
    const g = punchEvents[i].ts - punchEvents[i - 1].ts;
    if (g < 3000) gaps.push(g); // ignore long pauses
  }
  return gaps.length >= 4 && cv(gaps) < RHYTHM_PRED_CV;
}

function detectComboRepetition(comboStats) {
  if (!comboStats?.sessionCombos?.length) return [];
  const counts = {};
  for (const c of comboStats.sessionCombos) {
    const key = (c.types ?? []).join("-");
    if (key) counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, n]) => n >= REPEAT_MIN)
    .sort((a, b) => b[1] - a[1])
    .map(([seq, n]) => ({ sequence: seq, count: n }));
}

// ── Main export ─────────────────────────────────────────────────────────────

export function computeRingIQ(punchEvents = [], comboStats = null) {
  if (punchEvents.length < 4) return null;

  const panicFlurries        = detectPanicFlurries(punchEvents);
  const calmPacing           = detectCalmPacing(punchEvents);
  const { overcommitCount, overcommitRate } = detectOvercommitting(punchEvents);
  const predictableRhythm    = detectPredictableRhythm(punchEvents);
  const repeatedCombos       = detectComboRepetition(comboStats);

  // ── IQ scoring ────────────────────────────────────────────────────────────
  // Start at 70, penalise/reward patterns

  let iqScore = 70;

  // Panic flurries — lose control
  iqScore -= panicFlurries.length * 8;

  // Calm pacing — positive decision-making
  if (calmPacing) iqScore += 10;

  // Overcommitting — negative
  iqScore -= Math.min(20, overcommitRate * 0.4);

  // Predictable rhythm — small penalty (easy to time)
  if (predictableRhythm) iqScore -= 8;

  // Combo repetition — small penalty (telegraphing patterns)
  iqScore -= Math.min(10, repeatedCombos.length * 4);

  iqScore = Math.round(Math.max(10, Math.min(100, iqScore)));

  const iqLabel =
    iqScore >= 80 ? "High Ring IQ"   :
    iqScore >= 60 ? "Developing IQ"  :
    iqScore >= 40 ? "Reactive"        : "Instinct Fighter";

  // ── Coaching cues ─────────────────────────────────────────────────────────
  const cues = [];

  if (panicFlurries.length > 0) {
    cues.push(`${panicFlurries.length} panic burst${panicFlurries.length > 1 ? "s" : ""} detected — slow down and reset after exchanges`);
  }
  if (predictableRhythm) {
    cues.push("Rhythm is very consistent — vary your timing to disguise attacks");
  }
  if (repeatedCombos.length > 0) {
    cues.push(`Combo "${repeatedCombos[0].sequence}" thrown ${repeatedCombos[0].count}× — vary your sequences`);
  }
  if (overcommitRate >= 20) {
    cues.push("Guard return is slow on some shots — stay compact and recover faster");
  }
  if (calmPacing && cues.length === 0) {
    cues.push("Calm pacing — you're controlling the rhythm well");
  }

  return {
    iqScore,
    iqLabel,
    panicFlurries,
    calmPacing,
    overcommitCount,
    overcommitRate,
    predictableRhythm,
    repeatedCombos,
    cues: cues.slice(0, 2),
  };
}
