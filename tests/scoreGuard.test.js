import { describe, it, expect } from "vitest";
import {
  resolveDateKeys, checkSession, sessionXpDecision, challengeAwardDecision, challengeResultId,
  MAX_XP_SESSIONS_PER_DAY, MAX_CHALLENGE_AWARDS_PER_DAY, SESSION_CLAIM_WINDOW_MS,
} from "@/lib/domain/scoreGuard";

const NOW = Date.UTC(2026, 10, 6, 12, 0, 0);
const fresh = (over = {}) => ({
  userId: "u1", type: "training", score: 8,
  createdAt: new Date(NOW - 60_000).toISOString(),
  poseMetrics: { punchCount: 24 },
  ...over,
});

describe("resolveDateKeys", () => {
  it("accepts the server day ±1 and derives the rest itself", () => {
    expect(resolveDateKeys("2026-11-06", NOW)).toEqual({ todayKey: "2026-11-06", yesterdayKey: "2026-11-05", twoDaysAgoKey: "2026-11-04", monthKey: "2026-11" });
    expect(resolveDateKeys("2026-11-07", NOW)?.todayKey).toBe("2026-11-07"); // UTC+14
    expect(resolveDateKeys("2026-11-05", NOW)?.todayKey).toBe("2026-11-05"); // UTC−12
  });
  it("rejects far dates and garbage (no farming missions by changing the date)", () => {
    expect(resolveDateKeys("2026-11-09", NOW)).toBeNull();
    expect(resolveDateKeys("2025-01-01", NOW)).toBeNull();
    expect(resolveDateKeys("2026-02-31", Date.UTC(2026, 1, 28))).toBeNull();
    expect(resolveDateKeys("x", NOW)).toBeNull();
    expect(resolveDateKeys(undefined, NOW)).toBeNull();
  });
  it("handles month boundaries", () => {
    expect(resolveDateKeys("2026-12-01", Date.UTC(2026, 11, 1))?.yesterdayKey).toBe("2026-11-30");
  });
});

describe("checkSession", () => {
  it("accepts a fresh owned round with punches", () => {
    expect(checkSession(fresh(), "u1", NOW)).toEqual({ ok: true, score: 8 });
  });
  it("rejects someone else's, stale, empty or out-of-range sessions", () => {
    expect(checkSession(fresh(), "u2", NOW).reason).toBe("not_owner");
    expect(checkSession(fresh({ createdAt: new Date(NOW - SESSION_CLAIM_WINDOW_MS - 1000).toISOString() }), "u1", NOW).reason).toBe("stale");
    expect(checkSession(fresh({ poseMetrics: { punchCount: 0 }, hitCount: 0 }), "u1", NOW).reason).toBe("no_punches");
    expect(checkSession(fresh({ score: 11 }), "u1", NOW).reason).toBe("bad_score");
    expect(checkSession(null, "u1", NOW).reason).toBe("missing");
  });
});

describe("sessionXpDecision", () => {
  const base = { uid: "u1", todayKey: "2026-11-06", nowMs: NOW };
  it("awards XP from the SAVED score and counts it toward today's cap", () => {
    const d = sessionXpDecision({ ...base, session: fresh({ score: 8 }) });
    expect(d.xp).toBeGreaterThan(0);
    expect(d.sessionUpdate).toEqual({ xpGained: d.xp });
    expect(d.userUpdate).toEqual({ sessionXpDay: "2026-11-06", sessionXpCount: 1 });
  });
  it("never awards the same session twice", () => {
    expect(sessionXpDecision({ ...base, session: fresh({ xpGained: 300 }) })).toMatchObject({ xp: 0, reason: "already_awarded", sessionUpdate: null });
  });
  it("stops at the daily cap, and the counter resets on a new day", () => {
    const userData = { sessionXpDay: "2026-11-06", sessionXpCount: MAX_XP_SESSIONS_PER_DAY };
    expect(sessionXpDecision({ ...base, session: fresh(), userData })).toMatchObject({ xp: 0, reason: "daily_cap", sessionUpdate: { xpGained: 0 } });
    const yesterday = { sessionXpDay: "2026-11-05", sessionXpCount: MAX_XP_SESSIONS_PER_DAY };
    expect(sessionXpDecision({ ...base, session: fresh(), userData: yesterday }).reason).toBe("ok");
  });
  it("stamps 0 on a rejected own session so it can't be retried", () => {
    expect(sessionXpDecision({ ...base, session: fresh({ poseMetrics: { punchCount: 1 } }) })).toMatchObject({ xp: 0, reason: "no_punches", sessionUpdate: { xpGained: 0 } });
    expect(sessionXpDecision({ ...base, session: fresh({ userId: "u2" }) }).sessionUpdate).toBeNull();
  });
});

describe("challenge payouts", () => {
  it("caps payouts per day", () => {
    expect(challengeAwardDecision({}, "2026-11-06")).toEqual({ ok: true, userUpdate: { challengeAwardDay: "2026-11-06", challengeAwardCount: 1 } });
    expect(challengeAwardDecision({ challengeAwardDay: "2026-11-06", challengeAwardCount: MAX_CHALLENGE_AWARDS_PER_DAY }, "2026-11-06").ok).toBe(false);
  });
  it("one result id per user × challenge × day", () => {
    expect(challengeResultId("u1", "c/../x", "2026-11-06")).toBe("u1_cx_2026-11-06");
  });
});
