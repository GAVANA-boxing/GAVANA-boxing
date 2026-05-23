// targetMovements: explicit drill target; falls back to time-based estimate
export function calculateTrainingScore(hits, sessionSeconds, targetMovements = null) {
  const target = targetMovements ?? Math.max(1, Math.round(sessionSeconds * 1.5));
  const ratio = Math.min(1, hits / target);
  return Number((ratio * 10).toFixed(1));
}

export function computeScoreBreakdown(score, hitCount, sessionSeconds, targetMovements = null) {
  const target = targetMovements ?? Math.max(1, sessionSeconds * 2);
  const hitRate = hitCount / target;
  const hitsPerSec = hitCount / Math.max(1, sessionSeconds);
  const accuracy = Number(Math.min(10, hitRate * 12).toFixed(1));
  const speed = Number(Math.min(10, hitsPerSec * 5).toFixed(1));
  const power = Number(Math.min(10, score * 1.05).toFixed(1));
  const consistency = Number(Math.min(10, Math.max(0, score - (10 - score) * 0.15)).toFixed(1));
  return { accuracy, speed, power, consistency };
}

export function getChallengeComparisonPercent(score) {
  return Math.min(99, Math.max(42, Math.round(score * 10 + 3)));
}

export function getChallengeStreakBonus(streak) {
  if (streak === 14) return 300;
  if (streak === 7) return 150;
  if (streak === 3) return 50;
  return 0;
}
