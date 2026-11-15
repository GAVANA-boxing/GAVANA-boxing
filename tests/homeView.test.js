import { describe, it, expect } from "vitest";
import { homeView, weekDays } from "@/lib/homeView";
import { RANK_TIERS } from "@/lib/xp";

// Thursday 2026-11-12, 15:00 local.
const NOW = new Date(2026, 10, 12, 15, 0, 0);
const at = (y, m, d, h = 12) => ({ seconds: Math.floor(new Date(y, m, d, h).getTime() / 1000) });
const round = (createdAt, score = 7) => ({ type: "training", score, createdAt });

describe("weekDays — Monday-first, from real rounds", () => {
  it("marks the days trained, which are past, and today", () => {
    const w = weekDays([round(at(2026, 10, 9)), round(at(2026, 10, 10)), round(at(2026, 10, 12, 9))], NOW);
    expect(w.todayIndex).toBe(3);
    expect(w.days.map((d) => d.trained)).toEqual([true, true, false, true, false, false, false]);
    expect(w.days.map((d) => d.past)).toEqual([true, true, true, false, false, false, false]);
    expect(w.days[3].today).toBe(true);
    expect(w.trainedCount).toBe(3);
  });
  it("ignores last week, non-training docs and rounds without a time", () => {
    const w = weekDays([round(at(2026, 10, 8)), { type: "challenge", createdAt: at(2026, 10, 11) }, { type: "training", score: 5 }], NOW);
    expect(w.trainedCount).toBe(0);
  });
  it("two rounds on one day count as one day", () => {
    expect(weekDays([round(at(2026, 10, 12, 8)), round(at(2026, 10, 12, 20))], NOW).trainedCount).toBe(1);
  });
  it("Sunday is the last day of the week, not the first", () => {
    const sunday = new Date(2026, 10, 15, 10);
    const w = weekDays([round(at(2026, 10, 15, 9))], sunday);
    expect(w.todayIndex).toBe(6);
    expect(w.days[6]).toEqual({ trained: true, past: false, today: true });
  });
});

describe("homeView", () => {
  it("rank, XP left to the next rank and the bar", () => {
    const second = RANK_TIERS[1], third = RANK_TIERS[2];
    const xp = second.minXP + Math.round((third.minXP - second.minXP) / 4);
    const v = homeView({ xp, sessions: [], now: NOW });
    expect(v.rankKey).toBe(second.key);
    expect(v.nextRankKey).toBe(third.key);
    expect(v.xpToNext).toBe(third.minXP - xp);
    expect(v.rankPct).toBe(25);
  });
  it("top rank: no next rank, nothing left", () => {
    const v = homeView({ xp: RANK_TIERS[RANK_TIERS.length - 1].minXP + 5, sessions: [], now: NOW });
    expect(v.nextRankKey).toBeNull();
    expect(v.xpToNext).toBeNull();
    expect(v.rankPct).toBe(100);
  });
  it("no rounds: scores are null (the screen draws nothing), never 0", () => {
    const v = homeView({ xp: 0, sessions: [], now: NOW });
    expect(v).toMatchObject({ rounds: 0, avg: null, best: null, trend: null });
    expect(v.week.trainedCount).toBe(0);
  });
  it("average and best from scored rounds; the change needs six rounds", () => {
    const five = [6, 7, 8, 6, 8].map((s, i) => round(at(2026, 10, 12 - i), s));
    const v5 = homeView({ sessions: five, now: NOW });
    expect(v5).toMatchObject({ rounds: 5, avg: 7, best: 8, trend: null });
    const ten = [8, 8, 8, 8, 8, 6, 6, 6, 6, 6].map((s, i) => round(at(2026, 10, 12 - i), s));
    expect(homeView({ sessions: ten, now: NOW }).trend).toBe(2);
  });
  it("bad input does not throw", () => {
    expect(homeView({ xp: "x", sessions: null, now: NOW })).toMatchObject({ xp: 0, rounds: 0 });
    expect(homeView().rankKey).toBe(RANK_TIERS[0].key);
  });
});
