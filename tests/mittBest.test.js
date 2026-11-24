import { describe, it, expect } from "vitest";
import { isNewBest, bestEntry } from "../lib/mittBest";

const s = (accuracy, avgReactionMs, total = 10) => ({ accuracy, avgReactionMs, total, hits: Math.round(accuracy * total), bestStreak: 3 });

describe("isNewBest", () => {
  it("first real round is a best", () => expect(isNewBest(null, s(0.5, 800))).toBe(true));
  it("ignores tiny rounds", () => expect(isNewBest(null, s(1, 300, 2))).toBe(false));
  it("higher accuracy wins", () => expect(isNewBest(bestEntry(s(0.6, 500)), s(0.7, 900))).toBe(true));
  it("lower accuracy loses", () => expect(isNewBest(bestEntry(s(0.7, 900)), s(0.6, 400))).toBe(false));
  it("tie goes to faster reaction", () => {
    expect(isNewBest(bestEntry(s(0.7, 600)), s(0.7, 500))).toBe(true);
    expect(isNewBest(bestEntry(s(0.7, 600)), s(0.7, 700))).toBe(false);
  });
});
