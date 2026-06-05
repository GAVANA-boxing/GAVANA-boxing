// Determine how trustworthy a session's AI score is
// Used in TrainResultModal to decide whether to show the score or tips

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

export const CONFIDENCE_TIPS = [
  { key: "confidenceTipStepBack",    icon: "↔️" },
  { key: "confidenceTipFullBody",    icon: "🧍" },
  { key: "confidenceTipLighting",    icon: "💡" },
  { key: "confidenceTipPunchToward", icon: "🥊" },
];
