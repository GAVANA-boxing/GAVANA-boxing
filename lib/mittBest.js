// Personal best for the mitt drill, kept per difficulty level.
// Stored on users/{uid}.mittBest[level] (signed in) or localStorage (guest).
export const MIN_CALLS = 3; // ignore rounds ended almost at once

export function bestEntry(summary) {
  return {
    accuracy: Math.round(summary.accuracy * 1000) / 1000,
    hits: summary.hits,
    total: summary.total,
    avgReactionMs: summary.avgReactionMs ?? null,
    bestStreak: summary.bestStreak,
    at: Date.now(),
  };
}

/** Higher accuracy wins; on a tie, the faster average reaction. */
export function isNewBest(prev, summary) {
  if (!summary || summary.total < MIN_CALLS) return false;
  if (!prev || typeof prev.accuracy !== "number") return true;
  if (summary.accuracy !== prev.accuracy) return summary.accuracy > prev.accuracy;
  const a = summary.avgReactionMs, b = prev.avgReactionMs;
  return a != null && (b == null || a < b);
}

const KEY = "gavana_mitt_best";
export function readLocalBest() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
export function writeLocalBest(level, entry) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...readLocalBest(), [level]: entry })); } catch { /* ignore */ }
}
