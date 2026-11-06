import { describe, it, expect } from "vitest";
import { getAccountXp, getProgression } from "@/lib/domain/progression";

// Canonical XP = users.xp + training-session xpGained + daily streak × 20 —
// server-written sources only.
describe("getAccountXp", () => {
  it("sums the server-written sources", () => {
    const xp = getAccountXp({
      storedXp: 100,
      trainingSessions: [{ xpGained: 50 }, { xpGained: "30" }, {}], // 80
      streakDays: 3,                                                // 60
    });
    expect(xp).toBe(240);
  });

  it("ignores client-writable sources (AI reel feedback, likes)", () => {
    const loose = getAccountXp as (a: unknown) => number;
    expect(loose({ storedXp: 10, aiFeedbackDocs: [{ score: 10 }], likesReceived: 9999 })).toBe(10);
  });

  it("ignores negative xpGained", () => {
    expect(getAccountXp({ trainingSessions: [{ xpGained: -500 }, { xpGained: 20 }] })).toBe(20);
  });

  it("prefers a pre-summed trainingSessionXp", () => {
    expect(getAccountXp({ storedXp: 10, trainingSessionXp: 40, trainingSessions: [{ xpGained: 999 }] })).toBe(50);
  });

  it("clamps negative / garbage stored XP to 0", () => {
    expect(getAccountXp({ storedXp: -500 })).toBe(0);
    expect(getAccountXp({ storedXp: null })).toBe(0);
    expect(getAccountXp()).toBe(0);
  });
});

describe("getProgression", () => {
  it("derives the rank from the canonical XP", () => {
    const p = getProgression(510);
    expect(p.xp).toBe(510);
    expect(p.rank.key).toBe("rankAmateurBelt");
  });
  it("handles bad input", () => {
    expect(getProgression(undefined).xp).toBe(0);
  });
});
