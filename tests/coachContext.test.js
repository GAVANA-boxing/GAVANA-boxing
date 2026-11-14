import { describe, it, expect } from "vitest";
import { buildCoachContext, buildCoachSnapshot } from "@/lib/buildCoachContext";
import { profileXp } from "@/lib/profileXp";

const sessions = [7.2, 6.8, 6.1, 5.9].map((score, i) => ({ id: `s${i}`, type: "training", score, hitCount: 30, durationSeconds: 60, createdAt: { seconds: 1_800_000_000 - i * 86_400 } }));

describe("what the AI coach is told about the fighter", () => {
  const snapshot = buildCoachSnapshot({ sessions, profileData: { dailyStreak: 3 } });
  const ctx = buildCoachContext({ snapshot, profileData: {}, locale: "mn" });

  it("has the measured facts: rounds, average, best, streak", () => {
    expect(ctx).toContain("Rounds: 4");
    expect(ctx).toContain("Average score: 6.5/10");
    expect(ctx).toContain("Best score: 7.2/10");
    expect(ctx).toContain("Streak: 3 days");
  });

  it("has no invented per-skill scores (radar / weak / strong areas)", () => {
    expect(ctx).not.toMatch(/Radar|WEAK areas|Strong areas/);
    for (const skill of ["Power", "Footwork", "Accuracy", "Timing"]) expect(ctx).not.toMatch(new RegExp(`${skill} \\d`));
    expect(ctx).toContain("do not state per-skill scores");
  });

  it("no rounds → no context", () => {
    expect(buildCoachSnapshot({ sessions: [] })).toBeNull();
    expect(buildCoachContext({ snapshot: null })).toBeNull();
  });
});

describe("profileXp — which XP a profile shows", () => {
  it("own profile: XP from your own rounds", () => {
    expect(profileXp({ isOwnProfile: true, ownXp: 1234, publicXp: 50 })).toBe(1234);
  });
  it("someone else: the server-written publicXp", () => {
    expect(profileXp({ isOwnProfile: false, ownXp: 100, publicXp: 2340 })).toBe(2340);
    expect(profileXp({ isOwnProfile: false, ownXp: 100, publicXp: 0 })).toBe(0);
  });
  it("someone else without publicXp yet: the fallback, never NaN", () => {
    expect(profileXp({ isOwnProfile: false, ownXp: 100, publicXp: null })).toBe(100);
    expect(profileXp({ isOwnProfile: false, ownXp: 100, publicXp: undefined })).toBe(100);
    expect(profileXp({ isOwnProfile: false, ownXp: NaN, publicXp: "x" })).toBe(0);
  });
});
