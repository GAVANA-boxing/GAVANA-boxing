import { describe, it, expect } from "vitest";
import { progressGlance, progressStats, scoredSessions, sessionTime, shortDate } from "@/lib/progressStats";

const DAY = 86400000;
const NOW = Date.UTC(2026, 10, 6);
const s = (score, daysAgo, extra = {}) => ({ type: "training", score, createdAt: { seconds: (NOW - daysAgo * DAY) / 1000 }, ...extra });

describe("progressStats", () => {
  it("handles no sessions", () => {
    const p = progressStats([], { now: NOW });
    expect(p).toMatchObject({ count: 0, best: null, avg: null, trend: null, series: [], punches: 0, thisWeek: 0 });
  });

  it("counts only scored training sessions, newest first", () => {
    const list = scoredSessions([s(6, 3), { type: "reel", score: 9 }, s(7, 1), { type: "training", score: null }]);
    expect(list.map((x) => x.score)).toEqual([7, 6]);
  });

  it("best, average, this week and the chart series (oldest → newest)", () => {
    const p = progressStats([s(6, 10), s(8, 2), s(7, 1)], { now: NOW });
    expect(p.count).toBe(3);
    expect(p.best).toBe(8);
    expect(p.avg).toBe(7);
    expect(p.thisWeek).toBe(2);
    expect(p.series).toEqual([6, 8, 7]);
    expect(p.trend).toBeNull(); // needs 6+ sessions
  });

  it("trend = last 5 average minus the 5 before", () => {
    const old = [5, 5, 5, 5, 5].map((v, i) => s(v, 20 + i));
    const fresh = [7, 7, 7, 7, 7].map((v, i) => s(v, i));
    expect(progressStats([...old, ...fresh], { now: NOW }).trend).toBe(2);
  });

  it("sums punches and the jab / cross / hook mix", () => {
    const p = progressStats([
      s(7, 1, { poseMetrics: { punchCount: 20, punchBreakdown: { jab: { count: 10 }, cross: { count: 8 }, hook: { count: 2 } } } }),
      s(6, 2, { poseMetrics: { punchCount: 5, punchBreakdown: { jab: { count: 5 } } } }),
    ], { now: NOW });
    expect(p.punches).toBe(25);
    expect(p.mix).toEqual({ jab: 15, cross: 8, hook: 2 });
  });

  it("reads Firestore timestamps in all their shapes", () => {
    expect(sessionTime({ toMillis: () => 5 })).toBe(5);
    expect(sessionTime({ seconds: 2 })).toBe(2000);
    expect(sessionTime(null)).toBe(0);
  });
});

describe("shortDate", () => {
  it("formats the same everywhere (no reliance on browser locale data)", () => {
    const ts = { seconds: new Date(2026, 10, 5, 12).getTime() / 1000 };
    expect(shortDate(ts, "mn")).toBe("11-р сарын 5");
    expect(shortDate(ts, "ko")).toBe("11월 5일");
    expect(shortDate(ts, "en")).toBe("Nov 5");
    expect(shortDate(null, "mn")).toBe("—");
  });
});


describe("progressGlance — first rounds vs latest rounds", () => {
  const day = 86_400_000;
  const mk = (scores, punches) => scores.map((score, i) => ({
    id: `s${i}`, type: "training", score,
    createdAt: { seconds: (1_800_000_000_000 + i * day) / 1000 }, // i = 0 is the oldest
    poseMetrics: punches ? { punchCount: punches[i] } : undefined,
  }));

  it("not ready under 4 rounds (no comparison from 1 vs 1)", () => {
    const g = progressGlance(mk([5, 6, 7]));
    expect(g).toMatchObject({ ready: false, count: 3, need: 4 });
    expect(g.delta).toBeUndefined();
  });

  it("2 vs 2 at 4 rounds, 5 vs 5 from 10 rounds, windows never overlap", () => {
    expect(progressGlance(mk([5, 5, 7, 7]))).toMatchObject({ ready: true, k: 2, start: 5, now: 7, delta: 2 });
    const ten = progressGlance(mk([5, 5, 5, 5, 5, 7, 7, 7, 7, 7]));
    expect(ten).toMatchObject({ k: 5, start: 5, now: 7, delta: 2 });
    const odd = progressGlance(mk([4, 5, 6, 7, 8]));      // k = 2: first [4,5], latest [7,8]
    expect(odd).toMatchObject({ k: 2, start: 4.5, now: 7.5, delta: 3 });
  });

  it("punches per round only when every round in both windows has a count", () => {
    expect(progressGlance(mk([5, 5, 7, 7], [20, 30, 40, 50]))).toMatchObject({ punchesStart: 25, punchesNow: 45 });
    expect(progressGlance(mk([5, 5, 7, 7], [20, 0, 40, 50])).punchesStart).toBeNull();
  });

  it("a drop is shown as a drop", () => {
    expect(progressGlance(mk([8, 8, 6, 6])).delta).toBe(-2);
  });
});
