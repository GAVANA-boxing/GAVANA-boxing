import { deriveRadarStats } from "@/lib/dashboardHelpers";
import { getFighterRank } from "@/lib/xp";
import { computeMovementProfile } from "@/lib/combatMemory";
import { deriveCombatIdentity } from "@/lib/combatIdentity";

function avg(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

// Returns { radarStats, weakAreas, strongAreas, identity, scores, trend } for UI display
export function buildCoachSnapshot({ sessions = [], profileData = {} }) {
  const scores = sessions.map((s) => Number(s.score)).filter(Number.isFinite);
  if (!scores.length) return null;

  const streakDays = Number(profileData?.dailyStreak || profileData?.streakCount) || 0;
  const radarStats = deriveRadarStats(scores, sessions, streakDays);

  const radarEntries = Object.entries(radarStats);
  const weakAreas  = radarEntries.filter(([, v]) => v < 5.0).sort((a, b) => a[1] - b[1]);
  const strongAreas = radarEntries.filter(([, v]) => v >= 7.0).sort((a, b) => b[1] - a[1]);

  const last3 = scores.slice(0, 3);
  const prev3 = scores.slice(3, 6);
  const trendDelta = prev3.length ? avg(last3) - avg(prev3) : 0;
  const trend = trendDelta >= 0.4 ? "improving" : trendDelta <= -0.4 ? "declining" : "stable";

  let identity = null;
  try {
    const profile = computeMovementProfile(sessions);
    if (profile) identity = deriveCombatIdentity(profile, sessions);
  } catch { /* ignore */ }

  return {
    identity,
    radarStats,
    weakAreas,
    strongAreas,
    scores,
    trend,
    trendDelta,
    totalSessions: sessions.length,
    avgScore: avg(scores),
    bestScore: Math.max(...scores),
    streakDays,
  };
}

// Returns a string to inject into the AI system prompt
export function buildCoachContext({ snapshot, profileData = {}, locale = "en", accountXp = null }) {
  if (!snapshot) return null;

  const {
    identity,
    totalSessions, avgScore, bestScore, streakDays, trend, trendDelta,
  } = snapshot;

  // The canonical account XP (lib/domain/progression) when the caller has it; stored XP otherwise.
  const xp = Number(accountXp ?? profileData?.xp) || 0;

  const lines = [
    "── FIGHTER PROFILE (real training data — reference this to personalize every response) ──",
  ];

  if (identity) {
    lines.push(`Combat Identity: ${identity.primary} (${Math.round(identity.confidence * 100)}% signal confidence)`);
    if (identity.secondary?.length) {
      lines.push(`Movement traits: ${identity.secondary.slice(0, 3).join(", ")}`);
    }
  }

  // Only measured facts go to the model. The per-skill "radar" (Power, Footwork, Accuracy, …) is
  // arithmetic on the average score, not a measurement — it is not sent, so the coach can't
  // quote invented numbers back to the fighter.
  const num = (v) => (Number.isFinite(v) ? v.toFixed(1) : "?");
  lines.push(
    `Rounds: ${totalSessions} | Average score: ${num(avgScore)}/10 | Best score: ${num(bestScore)}/10` +
    (streakDays ? ` | Streak: ${streakDays} days` : ""),
  );

  const trendLabel = trend === "improving" ? "improving 📈" : trend === "declining" ? "declining 📉" : "stable";
  const deltaStr = Math.abs(trendDelta) >= 0.1 ? ` (${trendDelta >= 0 ? "+" : ""}${trendDelta.toFixed(1)} vs prev sessions)` : "";
  lines.push(`Score trend: ${trendLabel}${deltaStr}`);

  if (xp) lines.push(`XP: ${xp.toLocaleString()} (rank: ${getFighterRank(xp).key.replace(/^rank/, "")})`);

  lines.push("──");
  lines.push(
    "Use the data above to give specific, personalized advice. Reference only the numbers listed above; " +
    "do not state per-skill scores (power, speed, footwork, accuracy, …) — they are not measured. " +
    "Never claim to see live video, real-time pose analysis, or biomechanics data — you only have what is listed above."
  );

  return lines.join("\n");
}
