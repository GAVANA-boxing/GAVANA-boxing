import { describe, it, expect } from "vitest";
import {
  toIso, mapSession, buildBiomechanics, normalizeAxes, fighterAxes, mapBenchmark, mapVideo, mapOrder,
  isActiveOrder, toDashboardError,
} from "@/lib/dashboard/mappers";

const sessionDoc = (over: Record<string, unknown> = {}) => ({
  userId: "u1", score: 7.4, durationSeconds: 60, hitCount: 30,
  createdAt: { seconds: 1_800_000_000 },
  poseMetrics: {
    punchCount: 28,
    punchBreakdown: { jab: { count: 14 }, cross: { count: 9 }, hook: { count: 5 } },
    velocityStats: { avgRecoilMs: 380, avgSnapVelocity: 0.09, snapRating: "FAST" },
    guardHeight: { status: "too_low" }, stanceWidth: { status: "good" }, punchExtension: { status: "good" },
    rotation: { status: "under_rotated" }, balance: { status: "good" },
    sessionConfidence: "medium",
  },
  ...over,
});

describe("mapSession", () => {
  it("maps real poseMetrics fields; technique = good checks / measured checks", () => {
    const s = mapSession("s1", sessionDoc());
    expect(s.punches).toBe(28);
    expect(s.byType).toEqual({ jab: 14, cross: 9, hook: 5, uppercut: 0 });
    expect(s.speed).toEqual({ avgReturnMs: 380, snapIndex: 0.09, rating: "FAST" });
    expect(s.technique).toEqual({ score: 60, checksPassed: 3, checksTotal: 5 });
    expect(s.guard.status).toBe("too_low");
    expect(s.confidence).toBe("medium");
    expect(s.createdAt).toBe(new Date(1_800_000_000_000).toISOString());
  });
  it("never invents values for a session without pose data", () => {
    const s = mapSession("s2", { score: 99, durationSeconds: 20, hitCount: 4 });
    expect(s.score).toBe(10);
    expect(s.punches).toBe(4);
    expect(s.speed.avgReturnMs).toBeNull();
    expect(s.technique.score).toBeNull();
    expect(s.confidence).toBe("none");
  });
});

describe("buildBiomechanics", () => {
  it("averages only measured values and returns the trend oldest → newest", () => {
    const newest = mapSession("a", sessionDoc({ score: 8, createdAt: { seconds: 2 } }));
    const oldest = mapSession("b", sessionDoc({ score: 6, createdAt: { seconds: 1 }, poseMetrics: undefined }));
    const bio = buildBiomechanics([newest, oldest]);
    expect(bio.trend.map((p) => p.score)).toEqual([6, 8]);
    expect(bio.avgReturnMs).toBe(380);   // the session without pose data doesn't count as 0
    expect(bio.techniquePct).toBe(60);
    expect(bio.balancedPct).toBe(100);
    expect(bio.guardGoodPct).toBe(0);
    expect(bio.latest?.id).toBe("a");
  });
  it("handles no sessions", () => {
    const bio = buildBiomechanics([]);
    expect(bio.sessionsInWindow).toBe(0);
    expect(bio.avgReturnMs).toBeNull();
    expect(bio.latest).toBeNull();
  });
});

describe("benchmark comparison", () => {
  it("normalises both sides on one scale", () => {
    const a = normalizeAxes({ avgReturnMs: 200, techniquePct: 80, guardGoodPct: 50, balancedPct: 90, punchesPerMin: 60,
      punchMix: { jab: 1, cross: 1, hook: 1, uppercut: 1 } });
    expect(a).toEqual({ speed: 100, technique: 80, guard: 50, balance: 90, volume: 50, variety: 100 });
    expect(normalizeAxes({ avgReturnMs: 900, techniquePct: null, guardGoodPct: null, balancedPct: null, punchesPerMin: null, punchMix: null }).speed).toBe(0);
  });
  it("refuses a benchmark without provenance (no invented pro numbers)", () => {
    const you = fighterAxes(buildBiomechanics([mapSession("s", sessionDoc())]), [mapSession("s", sessionDoc())]);
    expect(mapBenchmark("x", null, you)).toBeNull();
    expect(mapBenchmark("x", { label: { en: "Pros" }, axes: { speed: 90, technique: 90, guard: 90 } }, you)).toBeNull();
    const ok = mapBenchmark("coach", {
      label: { en: "GAVANA coach", mn: "GAVANA дасгалжуулагч" }, kind: "coach", athletes: 1, clips: 24,
      updatedAt: "2026-11-01T00:00:00Z", axes: { speed: 88, technique: 92, guard: 95, balance: 90, volume: 70, variety: 75 },
    }, you);
    expect(ok?.source.label.mn).toBe("GAVANA дасгалжуулагч");
    expect(ok?.axes).toHaveLength(6);
    expect(ok?.axes.find((a) => a.axis === "speed")?.you).toBe(64); // (700-380)/5
  });
});

describe("videos and orders", () => {
  it("only completed videos carry results; failed ones carry the error", () => {
    expect(mapVideo("v", { status: "processing", progressPct: 41.6, score: 9 })).toMatchObject({ status: "processing", progressPct: 42, score: null });
    expect(mapVideo("v", { status: "completed", score: 7.26, punches: 31, poseFramesPct: 93 })).toMatchObject({ score: 7.3, punches: 31 });
    expect(mapVideo("v", { status: "failed" })).toMatchObject({ error: "unknown", score: null });
    expect(mapVideo("v", { status: "weird" }).status).toBe("queued");
  });
  it("orders: MNT money, sane quantities, active status", () => {
    const o = mapOrder("o1", { status: "shipped", total: { amount: 189000.4 }, items: [{ productId: "g1", title: "Gloves", qty: 0, unitPrice: { amount: 189000 } }] });
    expect(o.total).toEqual({ amount: 189000, currency: "MNT" });
    expect(o.items[0].qty).toBe(1);
    expect(isActiveOrder(o)).toBe(true);
    expect(isActiveOrder(mapOrder("o2", { status: "delivered" }))).toBe(false);
  });
  it("timestamps and errors", () => {
    expect(toIso("nope")).toBe("");
    expect(toDashboardError({ code: "permission-denied", message: "x" })).toMatchObject({ code: "permission-denied", retryable: false });
    expect(toDashboardError({ code: "unavailable" }).retryable).toBe(true);
  });
});
