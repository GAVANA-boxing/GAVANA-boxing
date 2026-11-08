// Determine how trustworthy a session's AI score is
// Used by the Train page (final score) and TrainResultModal (whether to show the score or tips)

/**
 * @param {number} punchCount
 * @param {"high"|"medium"|"low"|null} sessionConf  — from poseMetrics.sessionConfidence
 * @param {"full_body"|"upper_body_hips"|"upper_body_only"|"too_close"|"unknown"|null} cameraQuality
 * @returns {"high"|"medium"|"low"|"none"}
 */
export function computeScoreConfidence(punchCount, sessionConf, cameraQuality) {
  if (punchCount < 5) return "none";
  if (cameraQuality === "unknown") return "none";

  if (cameraQuality === "too_close" || sessionConf === "low") return "low";
  if (cameraQuality === "upper_body_only" || sessionConf === "medium") return "medium";

  return "high";
}

/** Highest score a round can get at each confidence: a poorly-seen round can't claim a top score. */
export const SCORE_CAP = { low: 7.5, medium: 8.5 };

/**
 * The ONE score of a round — what the result screen shows, what is saved and what XP is
 * computed from. Raw score capped by confidence ("none"/"high" are not capped).
 */
export function finalRoundScore(rawScore, { punchCount = 0, sessionConfidence = null, cameraQuality = null } = {}) {
  const score = Number(rawScore);
  if (!Number.isFinite(score)) return { score: 0, confidence: "none" };
  const confidence = computeScoreConfidence(punchCount, sessionConfidence, cameraQuality);
  const cap = SCORE_CAP[confidence] ?? 10;
  return { score: Math.min(score, cap), confidence };
}

export const CONFIDENCE_TIPS = [
  { key: "confidenceTipStepBack",    icon: "↔️" },
  { key: "confidenceTipFullBody",    icon: "🧍" },
  { key: "confidenceTipLighting",    icon: "💡" },
  { key: "confidenceTipPunchToward", icon: "🥊" },
];
