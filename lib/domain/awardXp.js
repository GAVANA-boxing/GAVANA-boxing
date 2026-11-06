// Pure progression math — the single source of truth for how a session turns
// into XP / streak / rank changes. Extracted verbatim from the logic that used
// to live inline in hooks/useTrainingActions.js so the SERVER (the authoritative
// writer) and the client fallback compute identical results.
//
// These functions are pure: given the user's current doc + the session input +
// the caller's local date keys, they return the field updates to persist plus
// the celebration data for the UI. They never touch Firestore or the clock
// (date keys are passed in so the user's LOCAL day boundary is respected even
// when the server runs the math in UTC).

import { calculateChallengeXP, getFighterRank } from "@/lib/xp";
import { getChallengeRank } from "@/lib/utils";
import { getChallengeComparisonPercent, getChallengeStreakBonus } from "@/lib/trainHelpers";

export const MISSION_XP = 50;

/**
 * Challenge result → user-doc progression update + the challenge_results fields
 * + celebration flags. Mirrors the old handleSaveChallengeResult transaction.
 *
 * @param userData current users/{uid} doc (plain object)
 * @param score    the session score (0–10)
 * @param dateKeys { todayKey, yesterdayKey } in the user's local time
 */
export function computeChallengeProgression(userData, score, dateKeys) {
  const { todayKey, yesterdayKey } = dateKeys;
  const rank = getChallengeRank(score);
  const comparisonPercent = getChallengeComparisonPercent(score);
  const baseXP = calculateChallengeXP(score, rank);

  const lastChallengeDate = String(userData.lastChallengeDate || "");
  const currentStreak = Number(userData.challengeStreak) || 0;
  const isSameDay = lastChallengeDate === todayKey;
  const nextStreak = isSameDay
    ? currentStreak
    : lastChallengeDate === yesterdayKey
      ? currentStreak + 1
      : 1;
  const streakBonusXP = isSameDay ? 0 : getChallengeStreakBonus(nextStreak);
  const totalChallengeXP = baseXP + streakBonusXP;

  const prevXp = Number(userData.xp) || 0;
  const nextXP = Math.round(prevXp + totalChallengeXP);
  const nextCompleted = Math.round((Number(userData.totalChallengesCompleted) || 0) + 1);

  const prevRank = getFighterRank(prevXp);
  const nextRank = getFighterRank(nextXP);

  return {
    userUpdate: {
      xp: nextXP,
      rank: nextRank.key,
      rankName: nextRank.key.replace(/^rank/, ""),
      totalChallengesCompleted: nextCompleted,
      challengeStreak: nextStreak,
      lastChallengeDate: todayKey,
    },
    challengeResult: {
      score,
      rank,
      comparisonPercent,
      xpGained: totalChallengeXP,
      baseXP,
      streakBonusXP,
      challengeStreak: nextStreak,
    },
    celebration: {
      totalChallengeXP,
      nextStreak,
      rankUpKey: prevRank.key !== nextRank.key ? nextRank.key : null,
    },
  };
}

/**
 * Daily-mission (training) completion → user-doc progression update + flags.
 * Mirrors the old handleSave mission block, including the Pro streak-freeze.
 *
 * @param userData current users/{uid} doc
 * @param dateKeys { todayKey, yesterdayKey, twoDaysAgoKey, monthKey } local time
 */
export function computeMissionProgression(userData, dateKeys) {
  const { todayKey, yesterdayKey, twoDaysAgoKey, monthKey } = dateKeys;

  if (userData.dailyMissionCompleted === todayKey) {
    // Already done today — only bump lastTrainingDate.
    return {
      alreadyCompleted: true,
      userUpdate: { lastTrainingDate: todayKey },
      celebration: { missionJustCompleted: false },
    };
  }

  const lastDate = String(userData.lastTrainingDate || "");
  const currentStreak = Number(userData.dailyStreak) || 0;

  // Pro perk: 2 streak freezes/month; missing exactly one day consumes a freeze.
  const tier = userData.subscriptionTier || userData.tier || null;
  const isPro = tier === "pro" || tier === "champion";
  let freezes = Number(userData.streakFreezes);
  if (userData.streakFreezeMonth !== monthKey || !Number.isFinite(freezes)) {
    freezes = isPro ? 2 : 0;
  }

  let newStreak;
  let freezeUsed = false;
  let freezesLeft = freezes;
  if (lastDate === yesterdayKey) {
    newStreak = currentStreak + 1;
  } else if (isPro && freezes > 0 && currentStreak > 0 && lastDate === twoDaysAgoKey) {
    newStreak = currentStreak + 1;
    freezeUsed = true;
    freezesLeft = freezes - 1;
  } else {
    newStreak = 1;
  }

  const streakBonus = newStreak === 3 ? 100 : newStreak === 7 ? 250 : 0;
  const totalBonus = MISSION_XP + streakBonus;
  const currentStoredXP = Number(userData.xp) || 0;
  const newBest = Math.max(newStreak, Number(userData.bestDailyStreak) || 0);
  const newXP = currentStoredXP + totalBonus;

  const prevRank = getFighterRank(currentStoredXP);
  const newRank = getFighterRank(newXP);

  return {
    alreadyCompleted: false,
    userUpdate: {
      dailyMissionCompleted: todayKey,
      lastTrainingDate: todayKey,
      dailyStreak: newStreak,
      bestDailyStreak: newBest,
      streakFreezes: freezesLeft,
      streakFreezeMonth: monthKey,
      xp: newXP,
    },
    celebration: {
      missionJustCompleted: true,
      streakBonus,
      newStreak,
      freezeUsed,
      rankUpKey: prevRank.key !== newRank.key ? newRank.key : null,
    },
  };
}
