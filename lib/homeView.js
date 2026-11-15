// What the Home screen shows, computed from real data only (tests/homeView.test.js):
// rank + XP left to the next rank, this week's trained days, average / best score and the recent
// change. Pure. Nothing here is estimated: a value that is not known is null and the screen
// draws nothing for it.
import { getFighterRank, getNextRank, getRankProgress } from "@/lib/xp";
import { progressStats, scoredSessions, sessionTime } from "@/lib/progressStats";
import { getLocalDateKey } from "@/lib/utils";

/** Monday-first week of `now`: [{ trained, past, today }] ×7 and how many days were trained. */
export function weekDays(sessions = [], now = new Date()) {
  const todayIndex = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - todayIndex);
  const keys = new Set(
    (sessions || [])
      .filter((s) => s && (s.type == null || s.type === "training"))
      .map((s) => { const ms = sessionTime(s.createdAt); return ms ? getLocalDateKey(new Date(ms)) : null; })
      .filter(Boolean),
  );
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { trained: keys.has(getLocalDateKey(d)), past: i < todayIndex, today: i === todayIndex };
  });
  return { days, todayIndex, trainedCount: days.filter((d) => d.trained).length };
}

export function homeView({ xp = 0, sessions = [], now = new Date() } = {}) {
  const points = Math.max(0, Number(xp) || 0);
  const rank = getFighterRank(points);
  const next = getNextRank(points);
  const stats = progressStats(sessions, { now: now.getTime() });
  return {
    xp: points,
    rankKey: rank.key,
    rankColor: rank.color,
    nextRankKey: next ? next.key : null,
    xpToNext: next ? Math.max(0, next.minXP - points) : null,
    rankPct: getRankProgress(points),
    week: weekDays(sessions, now),
    rounds: scoredSessions(sessions).length,
    avg: stats.avg,     // all scored rounds, 0..10 (null with none)
    best: stats.best,
    trend: stats.trend, // last 5 rounds vs the 5 before (null until there are 6)
  };
}
