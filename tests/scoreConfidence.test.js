import { describe, it, expect } from "vitest";
import { finalRoundScore, computeScoreConfidence } from "@/lib/scoreConfidence";

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
