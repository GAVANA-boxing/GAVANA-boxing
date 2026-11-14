import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseGuestSession, slimPoseMetrics, stashGuestSession, readGuestSession, GUEST_SESSION_TTL_MS } from "@/lib/guestSession";
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

// The real write path (what the Train page calls), not a hand-made payload: a round the result
// screen calls "not enough data" must never reach localStorage, whatever the motion counter says.
describe("stashGuestSession — the write itself is gated", () => {
  let store;
  beforeEach(() => {
    store = new Map();
    const localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: (k) => { store.delete(k); },
    };
    vi.stubGlobal("window", { localStorage });
    vi.stubGlobal("localStorage", localStorage);
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  const round = (over = {}) => ({ result: { score: 7.2, hitCount: 9, breakdown: null }, movementEvents: [], locale: "mn", ...over });

  it("camera counted 4, motion counter 9 → nothing is stored and nothing can be claimed", () => {
    expect(stashGuestSession(round({ poseMetrics: { punchCount: 4 } }))).toBe(false);
    expect(store.size).toBe(0);
    expect(readGuestSession()).toBeNull();
  });
  it("a timer-only round (no punches at all) is not stored", () => {
    expect(stashGuestSession(round({ result: { score: 0, hitCount: 0 } }))).toBe(false);
    expect(store.size).toBe(0);
  });
  it("camera counted 7 while the motion counter saw 2 → stored with the camera's count and claimable", () => {
    expect(stashGuestSession(round({ result: { score: 7.2, hitCount: 2 }, poseMetrics: { punchCount: 7, motionHistory: [1, 2] } }))).toBe(true);
    const s = readGuestSession();
    expect(s.result.hitCount).toBe(7);
    expect(s.result.score).toBe(7.2);
    expect(s.poseMetrics).toEqual({ punchCount: 7 });
  });
  it("no pose data, motion counter 8 → stored (the result screen scores it, capped)", () => {
    expect(stashGuestSession(round({ result: { score: 7.5, hitCount: 8 } }))).toBe(true);
    expect(readGuestSession().result.hitCount).toBe(8);
  });
  it("a later too-short round does not erase an earlier valid one", () => {
    expect(stashGuestSession(round({ poseMetrics: { punchCount: 12 } }))).toBe(true);
    expect(stashGuestSession(round({ poseMetrics: { punchCount: 2 } }))).toBe(false);
    expect(readGuestSession().result.hitCount).toBe(12);
  });
});
