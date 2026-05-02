export const RANK_TIERS = [
  { key: "rankBeginner", minXP: 0,    color: "#9CA3AF", gradient: "linear-gradient(90deg,#4B5563,#9CA3AF)", icon: "circle",    glowColor: null,                    pulse: false },
  { key: "rankAmateur",  minXP: 500,  color: "#CD7F32", gradient: "linear-gradient(90deg,#78350F,#CD7F32)", icon: "shield",    glowColor: "rgba(205,127,50,0.55)", pulse: false },
  { key: "rankFighter",  minXP: 1500, color: "#D4AF37", gradient: "linear-gradient(90deg,#92400E,#D4AF37)", icon: "star5",     glowColor: "rgba(212,175,55,0.65)", pulse: false },
  { key: "rankPro",      minXP: 3000, color: "#67E8F9", gradient: "linear-gradient(90deg,#0891B2,#67E8F9)", icon: "diamond",   glowColor: "rgba(103,232,249,0.75)", pulse: true  },
  { key: "rankChampion", minXP: 6000, color: "#FB923C", gradient: "linear-gradient(90deg,#EA580C,#FB923C)", icon: "crown",     glowColor: "rgba(251,146,60,0.85)", pulse: true  },
];

const DAILY_XP_CAP = 1000;
const IMPROVEMENT_BONUS_SMALL = 200;
const IMPROVEMENT_BONUS_LARGE = 400;

function getTsMs(createdAt) {
  if (!createdAt) return 0;
  if (typeof createdAt.toMillis === "function") return createdAt.toMillis();
  if (typeof createdAt.toDate === "function") return createdAt.toDate().getTime();
  return Number(createdAt) || 0;
}

/**
 * Full XP calculation from ai_feedback documents.
 * aiFeedbackDocs: array of { score, createdAt }
 */
export function calculateUserXP({ aiFeedbackDocs = [], streakDays = 0, likesReceived = 0 } = {}) {
  // Sort ascending by timestamp
  const sorted = aiFeedbackDocs
    .map((doc) => ({ score: Number(doc.score), ts: getTsMs(doc.createdAt) }))
    .filter((d) => Number.isFinite(d.score))
    .sort((a, b) => a.ts - b.ts);

  // Group by calendar day
  const byDay = {};
  for (const entry of sorted) {
    const day = entry.ts ? new Date(entry.ts).toISOString().slice(0, 10) : "day_0";
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(entry);
  }

  let totalAiXP = 0;
  let prevScore = null;

  for (const day of Object.keys(byDay).sort()) {
    let dayXP = 0;
    for (const entry of byDay[day]) {
      const base = Math.round(entry.score * entry.score * 10);
      let improvement = 0;
      if (prevScore !== null) {
        const delta = entry.score - prevScore;
        if (delta >= 1.0) improvement = IMPROVEMENT_BONUS_LARGE;
        else if (delta >= 0.5) improvement = IMPROVEMENT_BONUS_SMALL;
      }
      dayXP += base + improvement;
      prevScore = entry.score;
    }
    totalAiXP += Math.min(dayXP, DAILY_XP_CAP);
  }

  const streakXP = Math.round(streakDays) * 20;
  const likesXP = Math.round(likesReceived) * 2;

  return Math.round(totalAiXP + streakXP + likesXP);
}

/**
 * XP breakdown for a single session (for UI display after feedback).
 * Returns { base, improvement, streakBonus, total, capped }
 */
export function calculateSessionXP(currentScore, previousScore, streakDays = 0) {
  const base = Math.round(currentScore * currentScore * 10);
  let improvement = 0;
  if (previousScore !== null && previousScore !== undefined) {
    const delta = currentScore - previousScore;
    if (delta >= 1.0) improvement = IMPROVEMENT_BONUS_LARGE;
    else if (delta >= 0.5) improvement = IMPROVEMENT_BONUS_SMALL;
  }
  const streakBonus = Math.round(streakDays) * 20;
  const raw = base + improvement + streakBonus;
  const capped = raw > DAILY_XP_CAP;
  return {
    base,
    improvement,
    streakBonus,
    total: Math.min(raw, DAILY_XP_CAP),
    capped,
  };
}

export function calculateChallengeXP(score, rank) {
  const numericScore = Number(score);
  const base = Number.isFinite(numericScore) ? Math.round(numericScore * 50) : 0;
  const bonusByRank = {
    A: 100,
    B: 50,
    C: 20,
  };

  return base + (bonusByRank[String(rank || "").toUpperCase()] || 0);
}

export function getFighterRank(xp) {
  let rank = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (xp >= tier.minXP) rank = tier;
  }
  return rank;
}

export function getNextRank(xp) {
  for (const tier of RANK_TIERS) {
    if (xp < tier.minXP) return tier;
  }
  return null;
}

export function getRankProgress(xp) {
  const current = getFighterRank(xp);
  const next = getNextRank(xp);
  if (!next) return 100;
  const range = next.minXP - current.minXP;
  const done = xp - current.minXP;
  return Math.min(100, Math.round((done / range) * 100));
}
