import { GOLD, RED, PURPLE } from "@/lib/tokens";

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

export const WEIGHT_CLASSES = [
  "Mini Flyweight (49kg)", "Light Flyweight (49kg)", "Flyweight (52kg)",
  "Super Flyweight (55kg)", "Bantamweight (56kg)", "Super Bantamweight (59kg)",
  "Featherweight (59kg)", "Super Featherweight (63kg)", "Lightweight (61kg)",
  "Super Lightweight (64kg)", "Welterweight (67kg)", "Super Welterweight (70kg)",
  "Middleweight (75kg)", "Super Middleweight (79kg)", "Light Heavyweight (81kg)",
  "Cruiserweight (91kg)", "Heavyweight (91+kg)",
];

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
  { key: "Counter", color: "#60A5FA", fn: (s) => (s.Timing + s.Guard) / 2 },
  { key: "Footwork", color: "#34D399", fn: (s) => s.Footwork },
  { key: "Defense", color: PURPLE, fn: (s) => s.Guard },
];

export function radPolar(deg, r, cx, cy) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function deriveRadarStats(scores, sessions, streakDays) {
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  if (!scores.length) {
    return { Speed: 4.5, Timing: 4.5, Guard: 4.5, Footwork: 4.5, Power: 4.5, Accuracy: 4.5 };
  }
  const avgScore = avg(scores);
  const maxScore = Math.max(...scores);
  const hitSessions = sessions.filter((s) => s.hits != null && Number(s.hits) > 0);
  const accSessions = sessions.filter((s) => s.accuracy != null);
  const avgHits = avg(hitSessions.map((s) => Number(s.hits)));
  const avgAcc = avg(accSessions.map((s) => Number(s.accuracy)));
  const recentAvg = avg(scores.slice(0, Math.min(3, scores.length)));
  const olderAvg = avg(scores.slice(-Math.min(3, scores.length)));
  const trend = Math.max(-2, Math.min(2, recentAvg - olderAvg));

  const speed = hitSessions.length >= 2
    ? Math.min(10, avgHits / 2)
    : Math.max(1, Math.min(10, avgScore * 0.95 + 0.3));
  const timing = Math.max(1, Math.min(10, avgScore + trend));
  const guard = accSessions.length >= 2
    ? Math.max(1, Math.min(10, avgAcc / 10))
    : Math.max(1, Math.min(10, avgScore * 0.82));
  const footwork = Math.max(1, Math.min(10, 2 + Math.min(streakDays, 10) * 0.5 + avgScore * 0.3));
  const power = hitSessions.length >= 2
    ? Math.min(10, avgHits / 1.8)
    : Math.max(1, Math.min(10, maxScore * 0.92 + 0.4));
  const accuracy = accSessions.length >= 2
    ? Math.max(1, Math.min(10, avgAcc / 10))
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
