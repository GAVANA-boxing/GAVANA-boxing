// lib/combatIdentity.js
// Combat Identity Engine — pure functions, no Firestore, no UI.
//
// Modular integration layers (swap for MediaPipe/MoveNet when ready):
//   deriveSignals()          ← normalised 0-1 layer; replace with pose-model output
//   IDENTITY_CANDIDATES[]    ← extend with new identities
//   TRAIT_RULES[]            ← extend with biomechanical traits
//
// Input: computeMovementProfile() output from lib/combatMemory.js
// Output: { primary, primaryId, confidence, secondary, signals }

// ── Helpers ───────────────────────────────────────────────────────────────────
function clamp01(v) {
  return Math.min(1, Math.max(0, Number(v) || 0));
}

function weighted(pairs) {
  return clamp01(pairs.reduce((sum, [v, w]) => sum + v * w, 0));
}

// ── Signal layer ──────────────────────────────────────────────────────────────
// Converts raw movement profile + sessions into normalised 0-1 signals.
// Replace or augment this function with pose-model confidence values.
export function deriveSignals(profile, sessions = []) {
  if (!profile) return null;

  const n = sessions.length;
  const avgScore = n
    ? sessions.reduce((a, s) => a + (s.score || 0), 0) / n
    : 0;
  const consistencyRate = n
    ? sessions.filter((s) => (s.score || 0) >= 5).length / n
    : 0;

  return {
    pressure:         clamp01(profile.pressure / 3),
    lateral:          clamp01(profile.lateral / 3),
    headMovement:     clamp01(profile.headMovement / 3),
    guardStability:   clamp01(1 - profile.guardUnstable / 3),
    balanceStability: clamp01(1 - profile.balanceShift / 3),
    overextension:    clamp01(profile.overextension / 2),
    avgScore:         clamp01(avgScore / 10),
    consistency:      clamp01(consistencyRate),
    sessionCount:     profile.sessionCount || 0,
  };
}

// ── Identity candidates ───────────────────────────────────────────────────────
const IDENTITY_CANDIDATES = [
  {
    id: "PRESSURE_INITIATOR",
    label: "Pressure Initiator",
    score: (s) => weighted([
      [s.pressure,       0.45],
      [s.avgScore,       0.25],
      [s.guardStability, 0.15],
      [s.consistency,    0.15],
    ]),
  },
  {
    id: "MOBILE_OUTBOXER",
    label: "Mobile Outboxer",
    score: (s) => weighted([
      [s.lateral,           0.45],
      [s.headMovement,      0.20],
      [s.balanceStability,  0.20],
      [s.avgScore,          0.15],
    ]),
  },
  {
    id: "DEFENSIVE_TECHNICIAN",
    label: "Defensive Technician",
    score: (s) => weighted([
      [s.guardStability,    0.35],
      [s.balanceStability,  0.25],
      [s.avgScore,          0.25],
      [s.consistency,       0.15],
    ]),
  },
  {
    id: "REACTIVE_COUNTER",
    label: "Reactive Counter",
    score: (s) => weighted([
      [s.headMovement,   0.40],
      [s.avgScore,       0.25],
      [s.lateral,        0.20],
      [s.guardStability, 0.15],
    ]),
  },
  {
    id: "RHYTHM_BREAKER",
    label: "Rhythm Breaker",
    score: (s) => {
      const blend = clamp01((s.pressure + s.lateral) / 2);
      return weighted([
        [blend,            0.50],
        [s.headMovement,   0.20],
        [s.guardStability, 0.15],
        [s.avgScore,       0.15],
      ]);
    },
  },
  {
    id: "BALANCED_OPERATOR",
    label: "Balanced Operator",
    score: (s) => {
      const traits = [s.pressure, s.lateral, s.headMovement, s.guardStability, s.balanceStability];
      const mean = traits.reduce((a, v) => a + v, 0) / traits.length;
      const variance = traits.reduce((a, v) => a + (v - mean) ** 2, 0) / traits.length;
      const uniformity = clamp01(1 - variance * 4);
      return weighted([
        [uniformity,    0.40],
        [s.avgScore,    0.35],
        [s.consistency, 0.25],
      ]);
    },
  },
];

// ── Secondary trait rules ─────────────────────────────────────────────────────
const TRAIT_RULES = [
  { label: "Strong forward pressure",      test: (s) => s.pressure >= 0.55 },
  { label: "Effective lateral movement",   test: (s) => s.lateral >= 0.55 },
  { label: "Active head movement",         test: (s) => s.headMovement >= 0.55 },
  { label: "Solid guard discipline",       test: (s) => s.guardStability >= 0.75 },
  { label: "Stable under pressure",        test: (s) => s.balanceStability >= 0.75 },
  { label: "High session consistency",     test: (s) => s.consistency >= 0.70 },
  { label: "Strong scoring output",        test: (s) => s.avgScore >= 0.65 },
  { label: "Overextension tendency",       test: (s) => s.overextension >= 0.45 },
  { label: "Guard consistency needs work", test: (s) => s.guardStability < 0.35 },
  { label: "Balance needs attention",      test: (s) => s.balanceStability < 0.35 },
];

// ── Confidence computation ────────────────────────────────────────────────────
// Measures how clearly the top identity separates from the next best.
// Returns [0.30, 0.95] — avoids misleading extremes.
function computeConfidence(sortedScores) {
  const gap = sortedScores[0] - (sortedScores[1] || 0);
  const raw = clamp01(gap / 0.30);
  return Number((0.30 + raw * 0.65).toFixed(2));
}

// ── Main derivation ───────────────────────────────────────────────────────────
// profile: output of computeMovementProfile() from lib/combatMemory.js
// sessions: raw session array (for score/consistency signals)
export function deriveCombatIdentity(profile, sessions = []) {
  const signals = deriveSignals(profile, sessions);
  if (!signals) return null;

  const scored = IDENTITY_CANDIDATES
    .map((c) => ({ id: c.id, label: c.label, _score: c.score(signals) }))
    .sort((a, b) => b._score - a._score);

  const top = scored[0];
  const confidence = computeConfidence(scored.map((c) => c._score));
  const secondary = TRAIT_RULES
    .filter((r) => r.test(signals))
    .map((r) => r.label)
    .slice(0, 3);

  return {
    primary:    top.label,
    primaryId:  top.id,
    confidence,
    secondary,
    signals,
  };
}

// ── Ranked candidates ─────────────────────────────────────────────────────────
// Returns all identities sorted by score — useful for debug display.
export function rankIdentityCandidates(profile, sessions = []) {
  const signals = deriveSignals(profile, sessions);
  if (!signals) return [];
  return IDENTITY_CANDIDATES
    .map((c) => ({ id: c.id, label: c.label, score: Number(c.score(signals).toFixed(3)) }))
    .sort((a, b) => b.score - a.score);
}
