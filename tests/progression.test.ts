import { describe, it, expect } from "vitest";
import { getAccountXp, getProgression } from "@/lib/domain/progression";

// Canonical XP = users.xp + training-session xpGained + AI-feedback performance.
describe("getAccountXp", () => {
  it("sums all three sources", () => {
    const xp = getAccountXp({
      storedXp: 100,
      aiFeedbackDocs: [{ score: 7, createdAt: Date.UTC(2026, 10, 1) }], // 490
      trainingSessions: [{ xpGained: 50 }, { xpGained: "30" }, {}],     // 80
    });
    expect(xp).toBe(670);
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
  it("derives belt and rank from the same XP", () => {
    const p = getProgression(510);
    expect(p.xp).toBe(510);
    expect(p.belt.key).toBe("blueBelt");
    expect(p.rank.key).toBe("rankAmateurBelt");
  });
  it("handles bad input", () => {
    expect(getProgression(undefined).xp).toBe(0);
  });
});
