import { describe, it, expect } from "vitest";
import { missingProfileBase } from "@/lib/baseProfile";

const NOW = new Date("2026-11-14T08:00:00.000Z");
// firestore.rules serverOnlyUserKeys + email: a client create with any of these is refused.
const FORBIDDEN = ["email", "isAdmin", "isCoach", "coachVerified", "coachFeatured", "subscription", "subscriptionTier", "tier", "xp", "rank", "dailyStreak", "bestDailyStreak", "dailyMissionCompleted", "lastTrainingDate", "streakFreezes", "publicXp", "stats"];

describe("missingProfileBase — a profile that onboarding has to create", () => {
  it("Google account: name, photo and a username from the email", () => {
    expect(missingProfileBase({ uid: "u1", email: "bat@example.com", displayName: "Bat", photoURL: "https://p/x.jpg", now: NOW })).toEqual({
      username: "bat", bio: "", referredBy: null, createdAt: "2026-11-14T08:00:00.000Z",
      displayName: "Bat", photoURL: "https://p/x.jpg", profileImageUrl: "https://p/x.jpg",
    });
  });
  it("never carries an empty name or photo (a merge must not blank a real one)", () => {
    const base = missingProfileBase({ uid: "u1", email: "bat@example.com", now: NOW });
    expect("displayName" in base).toBe(false);
    expect("photoURL" in base).toBe(false);
    expect("profileImageUrl" in base).toBe(false);
  });
  it("no email → username from the uid; referral is kept", () => {
    expect(missingProfileBase({ uid: "abc123", referredBy: "coach9", now: NOW })).toMatchObject({ username: "abc123", referredBy: "coach9" });
  });
  it("holds nothing the rules refuse on create", () => {
    const base = missingProfileBase({ uid: "u1", email: "bat@example.com", displayName: "Bat", photoURL: "x", referredBy: "r", now: NOW });
    for (const k of FORBIDDEN) expect(k in base).toBe(false);
  });
});
