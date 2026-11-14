import { describe, it, expect } from "vitest";
import { finalRoundScore, computeScoreConfidence, roundPunchCount } from "@/lib/scoreConfidence";

describe("finalRoundScore — one score per round", () => {
  it("caps by confidence", () => {
    expect(finalRoundScore(9.4, { punchCount: 20, sessionConfidence: "low", cameraQuality: "full_body" })).toEqual({ score: 7.5, confidence: "low" });
    expect(finalRoundScore(9.4, { punchCount: 20, sessionConfidence: "medium", cameraQuality: "full_body" }).score).toBe(8.5);
    expect(finalRoundScore(9.4, { punchCount: 20, sessionConfidence: "high", cameraQuality: "full_body" }).score).toBe(9.4);
  });
  it("is idempotent and safe on bad input", () => {
    const once = finalRoundScore(9.4, { punchCount: 20, sessionConfidence: "low" }).score;
    expect(finalRoundScore(once, { punchCount: 20, sessionConfidence: "low" }).score).toBe(once);
    expect(finalRoundScore(NaN).score).toBe(0);
  });
  it("matches computeScoreConfidence", () => {
    expect(finalRoundScore(5, { punchCount: 2 }).confidence).toBe(computeScoreConfidence(2, null, null));
  });
});

describe("no pose data is never a confident score", () => {
  it("5+ punches counted by the motion counter alone → low, capped at 7.5", () => {
    expect(computeScoreConfidence(8, null, null)).toBe("low");
    expect(finalRoundScore(10, { punchCount: 8 })).toEqual({ score: 7.5, confidence: "low" });
  });
  it("still 'none' under 5 punches, and pose data keeps its own level", () => {
    expect(computeScoreConfidence(4, null, null)).toBe("none");
    expect(computeScoreConfidence(8, "high", "full_body")).toBe("high");
    expect(computeScoreConfidence(8, "high", null)).toBe("high");
  });
});

describe("roundPunchCount — one punch count per round", () => {
  it("uses the camera count whenever there is a pose summary, even when it is lower", () => {
    expect(roundPunchCount({ punchCount: 4 }, 9)).toBe(4);
    expect(roundPunchCount({ punchCount: 0 }, 9)).toBe(0);
    expect(roundPunchCount({ punchCount: 12 }, 2)).toBe(12);
  });
  it("falls back to the motion counter only without a pose summary", () => {
    expect(roundPunchCount(null, 7)).toBe(7);
    expect(roundPunchCount({}, 7)).toBe(7);
    expect(roundPunchCount(null, undefined)).toBe(0);
  });
});
