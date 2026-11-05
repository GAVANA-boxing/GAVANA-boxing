import { describe, it, expect } from "vitest";
import {
  calculateUserXP, calculateChallengeXP, calculateSessionXP,
  getFighterRank, getNextRank, getRankProgress, SESSION_CHALLENGE_XP_CAP,
} from "@/lib/xp";
import { getBelt, getNextBelt } from "@/lib/belts";

const day = (d) => new Date(`2026-11-${String(d).padStart(2, "0")}T10:00:00Z`).getTime();

describe("calculateUserXP", () => {
  it("is 0 with no history", () => {
    expect(calculateUserXP()).toBe(0);
    expect(calculateUserXP({ aiFeedbackDocs: [] })).toBe(0);
  });

  it("awards score² × 10 per feedback", () => {
    expect(calculateUserXP({ aiFeedbackDocs: [{ score: 7, createdAt: day(1) }] })).toBe(490);
  });

  it("caps XP at 1000 per day", () => {
    const docs = [{ score: 10, createdAt: day(1) }, { score: 10, createdAt: day(1) + 1000 }];
    expect(calculateUserXP({ aiFeedbackDocs: docs })).toBe(1000);
  });

  it("adds the large improvement bonus when score rises by ≥ 1", () => {
    const docs = [{ score: 5, createdAt: day(1) }, { score: 6, createdAt: day(2) }];
    // 250 + (360 + 400)
    expect(calculateUserXP({ aiFeedbackDocs: docs })).toBe(1010);
  });

  it("ignores non-numeric scores and adds streak + likes", () => {
    const docs = [{ score: "abc", createdAt: day(1) }, { score: 3, createdAt: day(1) }];
    expect(calculateUserXP({ aiFeedbackDocs: docs, streakDays: 3, likesReceived: 10 })).toBe(90 + 60 + 20);
  });

  it("accepts Firestore-like Timestamp objects", () => {
    const ts = { toMillis: () => day(1) };
    expect(calculateUserXP({ aiFeedbackDocs: [{ score: 2, createdAt: ts }] })).toBe(40);
  });
});

describe("calculateChallengeXP", () => {
  it("is score × 35 plus a rank bonus", () => {
    expect(calculateChallengeXP(8, "A")).toBe(360);
    expect(calculateChallengeXP(6, "c")).toBe(225);
  });
  it("awards S more than A (old inversion stays fixed)", () => {
    expect(calculateChallengeXP(9, "S")).toBeGreaterThan(calculateChallengeXP(9, "A"));
  });
  it("never exceeds the per-session cap", () => {
    expect(calculateChallengeXP(10, "S")).toBe(SESSION_CHALLENGE_XP_CAP);
    expect(calculateChallengeXP(1000, "S")).toBe(SESSION_CHALLENGE_XP_CAP);
  });
  it("treats garbage input as 0 base", () => {
    expect(calculateChallengeXP("nope", "Z")).toBe(0);
  });
});

describe("calculateSessionXP", () => {
  it("flags capped sessions", () => {
    const r = calculateSessionXP(10, 8, 10);
    expect(r.total).toBe(1000);
    expect(r.capped).toBe(true);
  });
});

describe("ranks and belts", () => {
  it("resolves ranks at their thresholds", () => {
    expect(getFighterRank(0).key).toBe("rankRookieGloves");
    expect(getFighterRank(499).key).toBe("rankRookieGloves");
    expect(getFighterRank(500).key).toBe("rankAmateurBelt");
    expect(getFighterRank(40000).key).toBe("rankGavanaChamp");
  });
  it("has no next rank at the top and full progress", () => {
    expect(getNextRank(40000)).toBeNull();
    expect(getRankProgress(40000)).toBe(100);
  });
  it("computes progress within a tier", () => {
    expect(getRankProgress(1000)).toBe(50); // 500 → 1500
  });
  it("resolves belts", () => {
    expect(getBelt(0).key).toBe("whiteBelt");
    expect(getBelt(500).key).toBe("blueBelt");
    expect(getBelt(10000).key).toBe("blackBelt");
    expect(getNextBelt(10000)).toBeNull();
    expect(getBelt("garbage").key).toBe("whiteBelt");
  });
});
