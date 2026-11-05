import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encodeValue, encodeFields, decodeFields } from "@/lib/server/firestore";
import { signAdminSession, verifyAdminSession } from "@/lib/adminSession";
import { showRoute, routeSegment, NON_CORE_SEGMENTS } from "@/lib/coreRoutes";
import { FUNNEL_STEPS, FUNNEL_EVENT_NAMES } from "@/lib/funnelSteps";

describe("Firestore REST codec", () => {
  it("encodes numbers as integer vs double", () => {
    expect(encodeValue(5)).toEqual({ integerValue: "5" });
    expect(encodeValue(1.5)).toEqual({ doubleValue: 1.5 });
  });
  it("encodes dates as timestamps and null as nullValue", () => {
    const d = new Date("2026-11-05T00:00:00.000Z");
    expect(encodeValue(d)).toEqual({ timestampValue: "2026-11-05T00:00:00.000Z" });
    expect(encodeValue(null)).toEqual({ nullValue: null });
  });
  it("round-trips nested maps and arrays", () => {
    const data = { xp: 510, name: "Bat", pro: false, tags: ["jab", 2], dna: { key: "counter", lvl: 1.5 } };
    expect(decodeFields(encodeFields(data))).toEqual(data);
  });
});

describe("admin session tokens", () => {
  const prev = process.env.ADMIN_SESSION_SECRET;
  beforeEach(() => { process.env.ADMIN_SESSION_SECRET = "test-secret-0123456789"; });
  afterEach(() => { process.env.ADMIN_SESSION_SECRET = prev; });

  it("verifies a token it signed", async () => {
    const t = await signAdminSession("uid123");
    expect(await verifyAdminSession(t)).toBe("uid123");
  });
  it("rejects a forged uid", async () => {
    const t = await signAdminSession("uid123");
    const [, exp, sig] = t.split(".");
    expect(await verifyAdminSession(`attacker.${exp}.${sig}`)).toBeNull();
  });
  it("rejects an expired token", async () => {
    const t = await signAdminSession("uid123", -10);
    expect(await verifyAdminSession(t)).toBeNull();
  });
  it("rejects everything when the secret is missing", async () => {
    const t = await signAdminSession("uid123");
    delete process.env.ADMIN_SESSION_SECRET;
    expect(await verifyAdminSession(t)).toBeNull();
    await expect(signAdminSession("x")).rejects.toThrow();
  });
  it("rejects malformed tokens", async () => {
    expect(await verifyAdminSession("")).toBeNull();
    expect(await verifyAdminSession("a.b")).toBeNull();
  });
});

describe("core-loop routes", () => {
  it("extracts the route segment", () => {
    expect(routeSegment("/mn/feed/abc?x=1")).toBe("feed");
    expect(routeSegment("train")).toBe("train");
    expect(routeSegment("/en")).toBeUndefined();
  });
  it("hides non-core routes and keeps the loop", () => {
    for (const p of ["/mn/feed", "/gyms", "challenges", "/ko/reels?id=1"]) expect(showRoute(p)).toBe(false);
    for (const p of ["/mn/train", "/home", "/en/profile/x", "/rank", "/mn", "/fighter-profile"]) expect(showRoute(p)).toBe(true);
  });
  it("never hides the core loop itself", () => {
    for (const core of ["home", "train", "coach", "rank", "history", "profile", "fighter-profile", "login", "onboarding", "admin"]) {
      expect(NON_CORE_SEGMENTS.has(core)).toBe(false);
    }
  });
});

describe("funnel steps", () => {
  it("has unique event names and ends at the WOW + save", () => {
    expect(new Set(FUNNEL_EVENT_NAMES).size).toBe(FUNNEL_EVENT_NAMES.length);
    expect(FUNNEL_STEPS.map((s) => s.key)).toContain("result_viewed");
  });
  it("labels every step in MN, EN and KO", () => {
    for (const s of FUNNEL_STEPS) {
      expect(s.mn && s.en && s.ko).toBeTruthy();
    }
  });
});
