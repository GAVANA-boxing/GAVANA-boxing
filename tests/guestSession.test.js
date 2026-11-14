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
  it("drops the heavy arrays and the English coaching strings", () => {
    const out = slimPoseMetrics({
      score: 7, motionHistory: [1, 2, 3], punchEvents: [{ t: 1 }],
      coaching: [{ type: "improve", message: "a" }, { type: "good", message: "b" }, { type: "improve", message: "c" }],
    });
    expect(out).toEqual({ score: 7 });
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

describe("guest round gate uses the count the result screen shows", () => {
  const NOW2 = 1_800_000_000_000;
  const base = (over) => ({ v: 1, savedAt: NOW2 - 1000, locale: "mn", result: { score: 7, hitCount: 2 }, movementEvents: [], ...over });
  it("a round the camera counted (7 punches) is kept even if the motion counter saw 2", () => {
    expect(parseGuestSession(base({ poseMetrics: { punchCount: 7 } }), NOW2)).not.toBeNull();
  });
  it("still refuses a round with fewer than 5 punches by both counts", () => {
    expect(parseGuestSession(base({ poseMetrics: { punchCount: 3 } }), NOW2)).toBeNull();
    expect(parseGuestSession(base({}), NOW2)).toBeNull();
  });
  it("refuses a round the result screen called 'not enough data' (camera 4, motion counter 9)", () => {
    expect(parseGuestSession(base({ result: { score: 7, hitCount: 9 }, poseMetrics: { punchCount: 4 } }), NOW2)).toBeNull();
  });
});
