import { describe, it, expect } from "vitest";
import { computeChallengeProgression, computeMissionProgression, MISSION_XP } from "@/lib/domain/awardXp";

// Server-authoritative progression math — the cheat-proof XP ledger.
const keys = {
  todayKey: "2026-11-05",
  yesterdayKey: "2026-11-04",
  twoDaysAgoKey: "2026-11-03",
  monthKey: "2026-11",
};

describe("computeChallengeProgression", () => {
  it("starts a brand-new fighter at streak 1", () => {
    const { userUpdate, challengeResult } = computeChallengeProgression({}, 8, keys);
    expect(challengeResult.rank).toBe("A");
    expect(challengeResult.baseXP).toBe(360);
    expect(challengeResult.streakBonusXP).toBe(0);
    expect(userUpdate).toMatchObject({ xp: 360, challengeStreak: 1, totalChallengesCompleted: 1, lastChallengeDate: keys.todayKey });
  });

  it("extends the streak from yesterday and pays the day-3 bonus, flagging rank + belt ups", () => {
    const user = { xp: 100, challengeStreak: 2, lastChallengeDate: keys.yesterdayKey, totalChallengesCompleted: 4 };
    const { userUpdate, celebration } = computeChallengeProgression(user, 8, keys);
    expect(userUpdate.challengeStreak).toBe(3);
    expect(celebration.totalChallengeXP).toBe(410); // 360 + 50
    expect(userUpdate.xp).toBe(510);
    expect(userUpdate.totalChallengesCompleted).toBe(5);
    expect(celebration.rankUpKey).toBe("rankAmateurBelt");
    expect(celebration.beltUpKey).toBe("blueBelt");
  });

  it("does not re-pay a streak bonus on the same day", () => {
    const user = { xp: 0, challengeStreak: 3, lastChallengeDate: keys.todayKey };
    const { userUpdate, challengeResult } = computeChallengeProgression(user, 8, keys);
    expect(userUpdate.challengeStreak).toBe(3);
    expect(challengeResult.streakBonusXP).toBe(0);
  });

  it("resets the streak after a gap", () => {
    const user = { challengeStreak: 9, lastChallengeDate: "2026-10-01" };
    expect(computeChallengeProgression(user, 5, keys).userUpdate.challengeStreak).toBe(1);
  });

  it("no celebration when nothing changes tier", () => {
    const { celebration } = computeChallengeProgression({ xp: 600 }, 5, keys);
    expect(celebration.rankUpKey).toBeNull();
    expect(celebration.beltUpKey).toBeNull();
  });
});

describe("computeMissionProgression", () => {
  it("only bumps lastTrainingDate once the daily mission is already done", () => {
    const r = computeMissionProgression({ dailyMissionCompleted: keys.todayKey, xp: 999 }, keys);
    expect(r.alreadyCompleted).toBe(true);
    expect(r.userUpdate).toEqual({ lastTrainingDate: keys.todayKey });
    expect(r.celebration.missionJustCompleted).toBe(false);
  });

  it("continues a streak from yesterday and pays the day-3 bonus", () => {
    const r = computeMissionProgression({ lastTrainingDate: keys.yesterdayKey, dailyStreak: 2, xp: 0 }, keys);
    expect(r.userUpdate.dailyStreak).toBe(3);
    expect(r.celebration.streakBonus).toBe(100);
    expect(r.userUpdate.xp).toBe(MISSION_XP + 100);
    expect(r.userUpdate.bestDailyStreak).toBe(3);
  });

  it("keeps the best streak when the current one resets", () => {
    const r = computeMissionProgression({ lastTrainingDate: "2026-10-01", dailyStreak: 9, bestDailyStreak: 12 }, keys);
    expect(r.userUpdate.dailyStreak).toBe(1);
    expect(r.userUpdate.bestDailyStreak).toBe(12);
  });

  it("lets a Pro fighter spend a streak freeze on one missed day", () => {
    const r = computeMissionProgression(
      { subscriptionTier: "pro", lastTrainingDate: keys.twoDaysAgoKey, dailyStreak: 5, streakFreezeMonth: "2026-10" },
      keys,
    );
    expect(r.userUpdate.dailyStreak).toBe(6);
    expect(r.celebration.freezeUsed).toBe(true);
    expect(r.userUpdate.streakFreezes).toBe(1); // replenished to 2, spent 1
    expect(r.userUpdate.streakFreezeMonth).toBe(keys.monthKey);
  });

  it("gives free users no freeze", () => {
    const r = computeMissionProgression({ lastTrainingDate: keys.twoDaysAgoKey, dailyStreak: 5 }, keys);
    expect(r.userUpdate.dailyStreak).toBe(1);
    expect(r.celebration.freezeUsed).toBe(false);
    expect(r.userUpdate.streakFreezes).toBe(0);
  });

  it("does not refill freezes inside the same month", () => {
    const r = computeMissionProgression(
      { tier: "champion", lastTrainingDate: keys.twoDaysAgoKey, dailyStreak: 5, streakFreezes: 0, streakFreezeMonth: keys.monthKey },
      keys,
    );
    expect(r.userUpdate.dailyStreak).toBe(1);
    expect(r.celebration.freezeUsed).toBe(false);
  });
});
