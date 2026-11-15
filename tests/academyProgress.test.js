import { describe, it, expect } from "vitest";
import { lessonRoundResult, nextLessonEntry, academySummary, isScoredLesson, ACADEMY_PASS_SCORE } from "@/lib/academyProgress";
import { ACADEMY_LESSONS } from "@/lib/academyLessons";

describe("what one round means for a lesson", () => {
  it("a punch lesson is done at the pass score, not below it", () => {
    expect(lessonRoundResult("jab-mechanics", { score: ACADEMY_PASS_SCORE, punches: 12 })).toEqual({ valid: true, scored: true, done: true });
    expect(lessonRoundResult("jab-mechanics", { score: 6.4, punches: 12 }).done).toBe(false);
  });
  it("a defence / footwork lesson is done by completing a valid round — the score does not measure it", () => {
    expect(lessonRoundResult("slip-defense", { score: 3.1, punches: 9 })).toEqual({ valid: true, scored: false, done: true });
    expect(isScoredLesson("shoulder-roll")).toBe(false);
  });
  it("a round the result screen calls 'not enough data' is never valid", () => {
    expect(lessonRoundResult("slip-defense", { score: 8, punches: 4 }).valid).toBe(false);
    expect(lessonRoundResult("jab-mechanics", { score: 0, punches: 20 }).valid).toBe(false);
    expect(lessonRoundResult("jab-mechanics", {}).valid).toBe(false);
    expect(lessonRoundResult("jab-mechanics", { score: "x", punches: 20 }).done).toBe(false);
  });
});

describe("nextLessonEntry", () => {
  it("records nothing for an invalid round", () => {
    expect(nextLessonEntry(undefined, "jab-mechanics", { score: 9, punches: 2, dateKey: "2026-11-14" })).toBeNull();
  });
  it("first valid round: attempted, best score, local date", () => {
    expect(nextLessonEntry(undefined, "jab-mechanics", { score: 5.2, punches: 10, dateKey: "2026-11-14" }))
      .toEqual({ attempted: true, completed: false, bestScore: 5.2, lastTrained: "2026-11-14" });
  });
  it("completed never goes back, best score only grows", () => {
    const prev = { attempted: true, completed: true, bestScore: 7.8, lastTrained: "2026-11-10" };
    expect(nextLessonEntry(prev, "jab-mechanics", { score: 4, punches: 10, dateKey: "2026-11-14" }))
      .toEqual({ attempted: true, completed: true, bestScore: 7.8, lastTrained: "2026-11-14" });
  });
  it("junk in storage does not break it", () => {
    expect(nextLessonEntry("oops", "hook-mechanics", { score: 7, punches: 8, dateKey: "d" })).toMatchObject({ completed: true, bestScore: 7 });
  });
});

describe("academySummary", () => {
  it("counts done lessons and finds the first one not done", () => {
    const first = ACADEMY_LESSONS[0], second = ACADEMY_LESSONS[1];
    expect(academySummary(ACADEMY_LESSONS, {})).toMatchObject({ total: 10, done: 0, next: first, nextIndex: 0 });
    expect(academySummary(ACADEMY_LESSONS, { [first.id]: { completed: true } })).toMatchObject({ done: 1, next: second, nextIndex: 1 });
  });
  it("all done → no next", () => {
    const all = Object.fromEntries(ACADEMY_LESSONS.map((l) => [l.id, { completed: true }]));
    expect(academySummary(ACADEMY_LESSONS, all)).toMatchObject({ done: 10, next: null, nextIndex: -1 });
  });
  it("survives missing input", () => {
    expect(academySummary(null, null)).toEqual({ total: 0, done: 0, next: null, nextIndex: -1 });
  });
});

describe("lesson order", () => {
  it("goes from beginner to advanced (a beginner lesson never comes after a harder one)", () => {
    const rank = { beginner: 0, intermediate: 1, advanced: 2 };
    const levels = ACADEMY_LESSONS.map((l) => rank[l.difficulty]);
    expect(levels.every((n) => Number.isInteger(n))).toBe(true);
    for (let i = 1; i < levels.length; i++) expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
    expect(ACADEMY_LESSONS[0].id).toBe("jab-mechanics");
    expect(new Set(ACADEMY_LESSONS.map((l) => l.id)).size).toBe(10);
  });
});
