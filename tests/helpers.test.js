import { describe, it, expect } from "vitest";
import { getChallengeRank, getLocalDateKey, getPreviousLocalDateKey } from "@/lib/utils";
import { extractFeedbackScore } from "@/lib/reelHelpers";
import { calculateTrainingScore, getChallengeStreakBonus } from "@/lib/trainHelpers";

describe("getChallengeRank", () => {
  it("maps score thresholds to S/A/B/C/D", () => {
    expect(getChallengeRank(9)).toBe("S");
    expect(getChallengeRank(8.99)).toBe("A");
    expect(getChallengeRank(7)).toBe("B");
    expect(getChallengeRank(6)).toBe("C");
    expect(getChallengeRank(5.9)).toBe("D");
    expect(getChallengeRank("x")).toBe("D");
  });
});

describe("local date keys", () => {
  it("formats YYYY-MM-DD in local time", () => {
    expect(getLocalDateKey(new Date(2026, 0, 7))).toBe("2026-01-07");
  });
  it("rolls back across month and leap-year boundaries", () => {
    expect(getPreviousLocalDateKey(new Date(2026, 2, 1))).toBe("2026-02-28");
    expect(getPreviousLocalDateKey(new Date(2028, 2, 1))).toBe("2028-02-29");
    expect(getPreviousLocalDateKey(new Date(2026, 0, 1))).toBe("2025-12-31");
  });
});

describe("extractFeedbackScore — AI feedback → XP", () => {
  it("reads a labelled English score", () => {
    expect(extractFeedbackScore("**Score:** 7.5/10 — nice jab")).toBe(7.5);
  });
  it("prefers the labelled Mongolian score over other x/10 numbers", () => {
    expect(extractFeedbackScore("Хурд 8/10, хамгаалалт 6/10. Нийт оноо: 7/10")).toBe(7);
  });
  it("prefers the labelled Korean score over other x/10 numbers", () => {
    expect(extractFeedbackScore("속도 8/10, 가드 6/10. 점수： 7/10")).toBe(7);
  });
  it("accepts a decimal comma", () => {
    expect(extractFeedbackScore("оноо 8,5/10")).toBe(8.5);
  });
  it("falls back to the first x/10 and clamps to 0..10", () => {
    expect(extractFeedbackScore("Great work 9/10")).toBe(9);
    expect(extractFeedbackScore("score: 15/10")).toBe(10);
  });
  it("returns undefined when there is no score", () => {
    expect(extractFeedbackScore("Keep your guard up")).toBeUndefined();
    expect(extractFeedbackScore(null)).toBeUndefined();
  });
});

describe("train helpers", () => {
  it("scores 0 for no punches and caps at 10", () => {
    expect(calculateTrainingScore(0, 30)).toBe(0);
    expect(calculateTrainingScore(1000, 30, null, 1)).toBe(10);
  });
  it("pays streak bonuses only on milestone days", () => {
    expect(getChallengeStreakBonus(3)).toBe(50);
    expect(getChallengeStreakBonus(7)).toBe(150);
    expect(getChallengeStreakBonus(14)).toBe(300);
    expect(getChallengeStreakBonus(4)).toBe(0);
  });
});

import { inferStanceFromShoulderZ, PunchPhaseDetector } from "@/lib/punchPhaseDetector";

describe("stance (jab/cross mapping)", () => {
  it("is the user's setting and survives a new session", () => {
    const d = new PunchPhaseDetector();
    expect(d.getStance()).toBe("orthodox");
    d.setStance("southpaw");
    d.reset();
    expect(d.getStance()).toBe("southpaw");
    d.setStance("garbage");
    expect(d.getStance()).toBe("orthodox");
  });
  it("hints stance from which shoulder is closer to the camera", () => {
    expect(inferStanceFromShoulderZ(Array(20).fill(-0.08))).toBe("orthodox");
    expect(inferStanceFromShoulderZ(Array(20).fill(0.08))).toBe("southpaw");
    expect(inferStanceFromShoulderZ(Array(20).fill(0.01))).toBe("unknown");
    expect(inferStanceFromShoulderZ(Array(5).fill(-0.08))).toBe("unknown"); // too few samples
  });
  it("uses the median, so a few rotated frames (punches) don't flip the hint", () => {
    const samples = [...Array(16).fill(-0.07), ...Array(6).fill(0.2)];
    expect(inferStanceFromShoulderZ(samples)).toBe("orthodox");
  });
});
