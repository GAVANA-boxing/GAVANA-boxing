import { describe, it, expect, vi, beforeEach } from "vitest";

const rows = { value: [] };
const calls = [];
vi.mock("@/lib/server/firestore", () => ({
  whereEq: (field, value) => ({ field, value }),
  firestoreRunQuery: async (q) => { calls.push(q); if (rows.value === "boom") throw new Error("x"); return rows.value; },
}));

describe("computePublicXp — the rank other people see", () => {
  beforeEach(() => { calls.length = 0; });

  it("is the same account XP the owner sees (stored + every round's xpGained + streak)", async () => {
    const { computePublicXp } = await import("@/lib/server/publicXp");
    const { getAccountXp } = await import("@/lib/domain/progression");
    rows.value = [{ xpGained: 40 }, { xpGained: 25 }, {}];
    const user = { xp: 300, dailyStreak: 3, bestDailyStreak: 5 };
    const xp = await computePublicXp("u1", user);
    expect(xp).toBe(getAccountXp({ storedXp: 300, trainingSessions: rows.value, streakDays: 3, bestStreakDays: 5 }));
    expect(calls[0].where).toEqual({ field: "userId", value: "u1" });
    expect(calls[0].select.fields).toEqual([{ fieldPath: "xpGained" }]); // only the XP field is read
  });

  it("never throws — a failed query leaves publicXp out (null)", async () => {
    const { computePublicXp } = await import("@/lib/server/publicXp");
    rows.value = "boom";
    await expect(computePublicXp("u1", { xp: 10 })).resolves.toBeNull();
  });
});
