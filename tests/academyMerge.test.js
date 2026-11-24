import { describe, it, expect } from "vitest";
import { mergeLessonProgress } from "../lib/academyMerge";

describe("mergeLessonProgress", () => {
  it("keeps guest lessons when the account has none", () => {
    const g = { l1: { attempted: true, completed: true, bestScore: 7, lastTrained: "2026-11-24" } };
    expect(mergeLessonProgress({}, g)).toEqual(g);
  });
  it("takes the best of both", () => {
    const acc = { l1: { attempted: true, completed: false, bestScore: 4, lastTrained: "2026-11-01" } };
    const g = { l1: { attempted: true, completed: true, bestScore: 7, lastTrained: "2026-11-24" }, l2: { attempted: true, bestScore: 3 } };
    const m = mergeLessonProgress(acc, g);
    expect(m.l1).toEqual({ attempted: true, completed: true, bestScore: 7, lastTrained: "2026-11-24" });
    expect(m.l2.attempted).toBe(true);
  });
  it("handles undefined", () => {
    expect(mergeLessonProgress(undefined, undefined)).toEqual({});
  });
});
