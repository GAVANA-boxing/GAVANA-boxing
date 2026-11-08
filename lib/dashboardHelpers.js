import { GOLD, RED, PURPLE } from "@/lib/tokens";
export { WEIGHT_CLASSES } from "@/lib/onboardingConstants";

export function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

export function formatWidgetDate(ts) {
  const ms = getTs(ts);
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatWidgetScore(s) {
  const n = Number(s);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(1);
}


export const RADAR_KEYS = ["Speed", "Timing", "Guard", "Footwork", "Power", "Accuracy"];
export const RADAR_ANGLES = [270, 330, 30, 90, 150, 210];

export const INSIGHT_COLOR = {
  positive: "#4ade80",
  warning: "#FB923C",
  neutral: GOLD,
};

export const DNA_ATTRS = [
  { key: "Pressure", color: RED, fn: (s) => (s.Speed + s.Power) / 2 },
  { key: "Technical", color: GOLD, fn: (s) => (s.Timing + s.Accuracy) / 2 },
  { key: "Counter", color: "#3B82F6", fn: (s) => (s.Timing + s.Guard) / 2 },
  { key: "Footwork", color: "#34D399", fn: (s) => s.Footwork },
  { key: "Defense", color: PURPLE, fn: (s) => s.Guard },
];

export function radPolar(deg, r, cx, cy) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Speed and Guard come from the camera's own measurements (poseMetrics) when a session has
// them; the other axes are score-based estimates. Sessions store `hitCount` and
// `breakdown.accuracy` (older docs: `hits` / `accuracy`). The streak no longer feeds
// "Footwork" — showing up isn't footwork. `streakDays` is kept for call-site compatibility.
const SNAP_SCORE = { FAST: 8.5, MODERATE: 6, SLOW: 3.5 };
const GUARD_SCORE = { good: 8.5, too_high: 6, too_low: 3.5 };

export function deriveRadarStats(scores, sessions, _streakDays) {
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  if (!scores.length) {
    return { Speed: 4.5, Timing: 4.5, Guard: 4.5, Footwork: 4.5, Power: 4.5, Accuracy: 4.5 };
  }
  const list = Array.isArray(sessions) ? sessions : [];
  const hitsOf = (s) => Number(s.hitCount ?? s.hits);
  const accOf = (s) => { const v = Number(s.breakdown?.accuracy ?? s.accuracy); return v > 10 ? v / 10 : v; }; // 0–10 (old docs: %)
  const avgScore = avg(scores);
  const maxScore = Math.max(...scores);
  const hitSessions = list.filter((s) => Number.isFinite(hitsOf(s)) && hitsOf(s) > 0);
  const accSessions = list.filter((s) => Number.isFinite(accOf(s)));
  const snaps = list.map((s) => SNAP_SCORE[s.poseMetrics?.velocityStats?.snapRating]).filter(Number.isFinite);
  const guards = list.map((s) => GUARD_SCORE[s.poseMetrics?.guardHeight?.status]).filter(Number.isFinite);
  const avgHits = avg(hitSessions.map(hitsOf));
  const avgAcc = avg(accSessions.map(accOf));
  const recentAvg = avg(scores.slice(0, Math.min(3, scores.length)));
  const olderAvg = avg(scores.slice(-Math.min(3, scores.length)));
  const trend = Math.max(-2, Math.min(2, recentAvg - olderAvg));

  const speed = snaps.length >= 2
    ? avg(snaps)
    : hitSessions.length >= 2
      ? Math.min(10, avgHits / 2)
      : Math.max(1, Math.min(10, avgScore * 0.95 + 0.3));
  const timing = Math.max(1, Math.min(10, avgScore + trend));
  const guard = guards.length >= 2
    ? avg(guards)
    : Math.max(1, Math.min(10, avgScore * 0.82));
  const footwork = Math.max(1, Math.min(10, avgScore * 0.85 + 0.5));
  const power = hitSessions.length >= 2
    ? Math.min(10, avgHits / 1.8)
    : Math.max(1, Math.min(10, maxScore * 0.92 + 0.4));
  const accuracy = accSessions.length >= 2
    ? Math.max(1, Math.min(10, avgAcc))
    : Math.max(1, Math.min(10, avgScore * 0.88));

  return { Speed: speed, Timing: timing, Guard: guard, Footwork: footwork, Power: power, Accuracy: accuracy };
}

export function computeFighterScore(scores, xp, streakDays) {
  if (!scores.length) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const best = Math.max(...scores);
  const base = best * 6 + avg * 4;
  const streakBonus = Math.min(5, streakDays * 0.3);
  const xpBonus = Math.min(5, Math.sqrt(xp / 1000));
  return Math.min(100, Math.round(base + streakBonus + xpBonus));
}

export function getInsight(locale, recentScores, dailyStreak) {
  if (!recentScores || recentScores.length < 3) {
    if (locale === "mn") return { text: "Эхний 3 session-ээ бүртгээд trend харна 🎯", type: "neutral" };
    if (locale === "ko") return { text: "첫 3세션을 기록하면 추세를 확인할 수 있어요 🎯", type: "neutral" };
    return { text: "Complete 3 sessions to see your progress trend 🎯", type: "neutral" };
  }
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const last3 = recentScores.slice(0, 3);
  const prev3 = recentScores.slice(3, 6);
  const delta = prev3.length ? avg(last3) - avg(prev3) : 0;

  if (delta >= 0.4) {
    if (locale === "mn") return { text: "Tempo өсөж байна 🔥 Хурдаа хэвээр хадгал.", type: "positive" };
    if (locale === "ko") return { text: "템포가 오르고 있어요 🔥 이 흐름을 유지하세요.", type: "positive" };
    return { text: "Score is climbing 🔥 Keep the pressure on.", type: "positive" };
  }
  if (delta <= -0.4) {
    if (locale === "mn") return { text: "Guard болон техникд анхаар ⚠️ Хурдаа нэмэх шаардлагагүй — нарийвчлал чухал.", type: "warning" };
    if (locale === "ko") return { text: "가드와 기술에 집중하세요 ⚠️ 정확도가 핵심입니다.", type: "warning" };
    return { text: "Guard needs attention ⚠️ Focus on accuracy over speed.", type: "warning" };
  }
  if (dailyStreak >= 3) {
    if (locale === "mn") return { text: "Consistency бол чамайг хаана хүргэж байгааг мэдэхгүй 💪 Тасалтгүй дасгал хий.", type: "positive" };
    if (locale === "ko") return { text: "꾸준함이 무기예요 💪 훈련을 이어가세요.", type: "positive" };
    return { text: "Consistency is your weapon 💪 Keep the streak alive.", type: "positive" };
  }
  if (locale === "mn") return { text: "Жигд явж байна. Intensity нэмж score ахиулаарай.", type: "neutral" };
  if (locale === "ko") return { text: "꾸준하네요. 강도를 높여 점수를 올려보세요.", type: "neutral" };
  return { text: "Steady rhythm. Push intensity to break through.", type: "neutral" };
}
