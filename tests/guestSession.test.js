import { describe, it, expect } from "vitest";
import { parseGuestSession, slimPoseMetrics, GUEST_SESSION_TTL_MS } from "@/lib/guestSession";
import { buildTrainingSessionDoc } from "@/lib/trainingSessionDoc";

const NOW = 1_800_000_000_000;
const valid = (over = {}) => ({
  v: 1,
  savedAt: NOW - 60_000,
  locale: "mn",
  result: { score: 7.4, hitCount: 14, breakdown: { accuracy: 7 } },
  movementEvents: [{ type: "jab" }],
  ...over,
});

describe("parseGuestSession", () => {
  it("accepts a fresh, valid session (object or JSON string)", () => {
    expect(parseGuestSession(valid(), NOW)?.result.score).toBe(7.4);
    expect(parseGuestSession(JSON.stringify(valid()), NOW)?.result.hitCount).toBe(14);
  });
  it("rejects expired, future-dated and unknown-version payloads", () => {
    expect(parseGuestSession(valid({ savedAt: NOW - GUEST_SESSION_TTL_MS - 1 }), NOW)).toBeNull();
    expect(parseGuestSession(valid({ savedAt: NOW + 10 * 60_000 }), NOW)).toBeNull();
    expect(parseGuestSession(valid({ v: 2 }), NOW)).toBeNull();
  });
  it("rejects tampered or too-short sessions", () => {
    expect(parseGuestSession(valid({ result: { score: 42, hitCount: 20 } }), NOW)).toBeNull();
    expect(parseGuestSession(valid({ result: { score: -1, hitCount: 20 } }), NOW)).toBeNull();
    expect(parseGuestSession(valid({ result: { score: "x", hitCount: 20 } }), NOW)).toBeNull();
    expect(parseGuestSession(valid({ result: { score: 8, hitCount: 2 } }), NOW)).toBeNull();
  });
  it("survives garbage input", () => {
    expect(parseGuestSession("{not json", NOW)).toBeNull();
    expect(parseGuestSession(null, NOW)).toBeNull();
  });
  it("caps oversized movement event lists", () => {
    const s = parseGuestSession(valid({ movementEvents: Array.from({ length: 5000 }, () => ({ type: "jab" })) }), NOW);
    expect(s.movementEvents.length).toBe(400);
  });
});

describe("slimPoseMetrics", () => {
  it("drops heavy arrays and keeps up to 2 weaknesses", () => {
    const out = slimPoseMetrics({
      score: 7, motionHistory: [1, 2], punchEvents: [3],
      coaching: [{ type: "improve", message: "a" }, { type: "good", message: "b" }, { type: "improve", message: "c" }, { type: "improve", message: "d" }],
    });
    expect(out).toEqual({ score: 7, weaknesses: ["a", "c"] });
    expect(slimPoseMetrics(null)).toBeNull();
  });
});

describe("buildTrainingSessionDoc", () => {
  const base = { uid: "u1", result: { score: 7.4, hitCount: 14 }, locale: "en" };
  it("never includes xpGained (the server stamps it)", () => {
    const doc = buildTrainingSessionDoc({ ...base, result: { ...base.result, xpGained: 9999 } });
    expect("xpGained" in doc).toBe(false);
  });
  it("writes the core fields and records the drill actually used", () => {
    const doc = buildTrainingSessionDoc({ ...base, drillConfig: { id: "speed-test", durationSeconds: 20 }, source: "guest_claim" });
    expect(doc).toMatchObject({ userId: "u1", score: 7.4, hitCount: 14, type: "training", drillId: "speed-test", durationSeconds: 20, source: "guest_claim", attemptNumber: 1 });
  });
  it("prefers an explicit drillId and defaults sensibly", () => {
    expect(buildTrainingSessionDoc({ ...base, drillId: "shadowboxing" }).drillId).toBe("shadowboxing");
    expect(buildTrainingSessionDoc(base).drillId).toBe("default");
  });
});
