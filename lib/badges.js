import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export const BADGES = {
  first_challenge: { id: "first_challenge", icon: "🥊", i18nKey: "firstChallengeBadge" },
  streak_3: { id: "streak_3", icon: "🔥", i18nKey: "threeDayStreakBadge" },
  streak_7: { id: "streak_7", icon: "⚡", i18nKey: "sevenDayStreakBadge" },
  jab_master: { id: "jab_master", icon: "🎯", i18nKey: "jabMasterBadge" },
  speed_king: { id: "speed_king", icon: "💨", i18nKey: "speedKingBadge" },
  creator_starter: { id: "creator_starter", icon: "🎬", i18nKey: "creatorStarterBadge" },
};

async function awardBadge(userId, badgeId) {
  const docId = `${userId}_${badgeId}`;
  const ref = doc(db, "user_badges", docId);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) return false;
    await setDoc(ref, { userId, badgeId, earnedAt: serverTimestamp() });
    return true;
  } catch {
    return false;
  }
}

// context: { totalAttempts, dailyStreak, category, accuracy, speed, hasUploaded }
export async function checkAndAwardBadges(userId, context = {}) {
  if (!userId) return [];
  const awarded = [];

  try {
    if (context.totalAttempts === 1) {
      if (await awardBadge(userId, "first_challenge")) awarded.push(BADGES.first_challenge);
    }
    if ((context.dailyStreak || 0) >= 7) {
      if (await awardBadge(userId, "streak_7")) awarded.push(BADGES.streak_7);
    } else if ((context.dailyStreak || 0) >= 3) {
      if (await awardBadge(userId, "streak_3")) awarded.push(BADGES.streak_3);
    }
    if (context.category === "boxing" && (context.accuracy || 0) >= 8) {
      if (await awardBadge(userId, "jab_master")) awarded.push(BADGES.jab_master);
    }
    if ((context.speed || 0) >= 8) {
      if (await awardBadge(userId, "speed_king")) awarded.push(BADGES.speed_king);
    }
    if (context.hasUploaded) {
      if (await awardBadge(userId, "creator_starter")) awarded.push(BADGES.creator_starter);
    }
  } catch {
    // non-critical
  }

  return awarded;
}
