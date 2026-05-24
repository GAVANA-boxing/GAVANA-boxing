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

// ─── Dashboard Achievement Badges ────────────────────────────────────────────

export const TIER_COLOR = {
  bronze: "#CD7F32",
  silver: "#A8A9AD",
  gold:   "#F5C451",
};

export const ACHIEVEMENT_BADGES = [
  // Sessions
  { id: "first_session",  icon: "🥊", name: "First Punch",       nameMn: "Эхний цохилт",   desc: "Complete 1 session",      descMn: "Эхний дадлага",        tier: "bronze", check: ({ sessionCount }) => sessionCount >= 1 },
  { id: "sessions_5",     icon: "💪", name: "Getting Started",    nameMn: "Эхлэл",           desc: "5 sessions complete",     descMn: "5 дадлага",            tier: "bronze", check: ({ sessionCount }) => sessionCount >= 5 },
  { id: "sessions_10",    icon: "🔥", name: "On Fire",            nameMn: "Дөлтэй",          desc: "10 sessions complete",    descMn: "10 дадлага",           tier: "silver", check: ({ sessionCount }) => sessionCount >= 10 },
  { id: "sessions_25",    icon: "⚡", name: "Grinder",            nameMn: "Тэвчээртэй",      desc: "25 sessions complete",    descMn: "25 дадлага",           tier: "silver", check: ({ sessionCount }) => sessionCount >= 25 },
  { id: "sessions_50",    icon: "🏆", name: "Veteran",            nameMn: "Ветеран",          desc: "50 sessions complete",    descMn: "50 дадлага",           tier: "gold",   check: ({ sessionCount }) => sessionCount >= 50 },
  // Score
  { id: "score_7",        icon: "⭐", name: "Sharp",              nameMn: "Хурц",             desc: "Score 7.0 or higher",     descMn: "7.0+ оноо авсан",      tier: "bronze", check: ({ bestScore }) => bestScore >= 7 },
  { id: "score_8",        icon: "🌟", name: "Elite",              nameMn: "Элит",             desc: "Score 8.0 or higher",     descMn: "8.0+ оноо авсан",      tier: "silver", check: ({ bestScore }) => bestScore >= 8 },
  { id: "score_9",        icon: "💎", name: "Champion",           nameMn: "Чемпион",          desc: "Score 9.0 or higher",     descMn: "9.0+ оноо авсан",      tier: "gold",   check: ({ bestScore }) => bestScore >= 9 },
  // Streak
  { id: "streak_3d",      icon: "🔥", name: "On a Roll",          nameMn: "Давхардаж байна", desc: "3-day streak",            descMn: "3 өдрийн streak",      tier: "bronze", check: ({ streakDays }) => streakDays >= 3 },
  { id: "streak_7d",      icon: "📅", name: "Dedicated",          nameMn: "Шамдсан",         desc: "7-day streak",            descMn: "7 өдрийн streak",      tier: "silver", check: ({ streakDays }) => streakDays >= 7 },
  { id: "streak_30d",     icon: "👑", name: "Unstoppable",        nameMn: "Зогшилтгүй",      desc: "30-day streak",           descMn: "30 өдрийн streak",     tier: "gold",   check: ({ streakDays }) => streakDays >= 30 },
  // Fighter mastery
  { id: "fighter_1",      icon: "📖", name: "Student",            nameMn: "Сурагч",           desc: "Study 1 fighter",         descMn: "1 тулаанч судалсан",   tier: "bronze", check: ({ studiedCount }) => studiedCount >= 1 },
  { id: "fighter_5",      icon: "🎓", name: "Scholar",            nameMn: "Эрдэмтэн",         desc: "Study 5 fighters",        descMn: "5 тулаанч судалсан",   tier: "silver", check: ({ studiedCount }) => studiedCount >= 5 },
  { id: "fighter_all",    icon: "🏛️", name: "Boxing Historian",   nameMn: "Боксын түүхч",    desc: "Study all fighters",      descMn: "Бүх тулаанч судалсан", tier: "gold",   check: ({ studiedCount, totalFighters }) => studiedCount >= totalFighters },
  // Radar
  { id: "radar_balanced", icon: "🎯", name: "All-Rounder",        nameMn: "Бүх талын",        desc: "5.0+ in all 6 radar areas", descMn: "6 area бүгдэд 5.0+", tier: "gold",   check: ({ radarStats }) => radarStats && Object.values(radarStats).every((v) => v >= 5.0) },
];

/**
 * Pure function — no Firestore. Returns array of earned badge IDs.
 */
export function computeEarnedBadges({ sessionCount = 0, bestScore = 0, streakDays = 0, studiedCount = 0, totalFighters = 10, radarStats = null }) {
  return ACHIEVEMENT_BADGES
    .filter((b) => b.check({ sessionCount, bestScore, streakDays, studiedCount, totalFighters, radarStats }))
    .map((b) => b.id);
}

