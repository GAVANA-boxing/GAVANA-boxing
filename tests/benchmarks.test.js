import { describe, it, expect } from "vitest";
import { BENCHMARKS, benchmarkBests } from "@/lib/benchmarks";
import { getDrillConfig } from "@/lib/drillConfig";

describe("benchmarks", () => {
  it("each benchmark is a real drill with the same length", () => {
    for (const b of BENCHMARKS) {
      expect(getDrillConfig(b.id).id).toBe(b.id);
      expect(getDrillConfig(b.id).durationSeconds).toBe(b.seconds);
    }
  });
  it("best score and punches per test, from own sessions only", () => {
    const sessions = [
      { drillId: "speed-test", score: 6.1, poseMetrics: { punchCount: 14 } },
      { drillId: "speed-test", score: 7.4, poseMetrics: { punchCount: 11 } },
      { drillId: "jab-minute", score: 5, hitCount: 30 },
      { drillId: "default", score: 9.9 },
    ];
    const b = benchmarkBests(sessions);
    expect(b["speed-test"]).toEqual({ attempts: 2, bestScore: 7.4, bestPunches: 14 });
    expect(b["jab-minute"]).toEqual({ attempts: 1, bestScore: 5, bestPunches: 30 });
    expect(b["combo-master"]).toBeNull();
  });
});
