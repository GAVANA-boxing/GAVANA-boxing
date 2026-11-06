import { describe, it, expect } from "vitest";
import { progressStats, scoredSessions, sessionTime, shortDate } from "@/lib/progressStats";

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
