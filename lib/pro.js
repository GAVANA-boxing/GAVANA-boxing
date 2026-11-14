// GAVANA Pro — the one place that defines the plan, its price and its perks.
//
// Rules:
// - Every perk listed here is enforced in code (see `where`). Don't list a perk that isn't.
// - The core loop (rounds, score, AI debrief after a round, progress, 3D replay) stays free.
// - Prices are charged in Mongolian tögrög (MNT). The Stripe prices behind
//   STRIPE_PRICE_PRO / STRIPE_PRICE_PRO_YEARLY must be created with exactly these amounts.

export const PRO_PRICES = {
  monthly: { amount: 9900, currency: "MNT", interval: "month" },
  yearly: { amount: 79000, currency: "MNT", interval: "year" }, // ≈ 6,600₮ / month, 33% off
};

/** Free users' AI coach chat messages per day (server-enforced in /api/chat). */
export const AI_CHAT_FREE_DAILY = 10;

/** Streak saves per month (server-enforced in lib/domain/awardXp.js). */
export const PRO_STREAK_SAVES = 2;

export const PRO_PERKS = [
  {
    key: "coach",
    icon: "💬",
    title: { mn: "AI коуч — хязгааргүй", ko: "AI 코치 — 무제한", en: "AI coach — unlimited" },
    body: {
      mn: `Үнэгүй хувилбарт өдөрт ${AI_CHAT_FREE_DAILY} мессеж.`,
      ko: `무료는 하루 ${AI_CHAT_FREE_DAILY}개 메시지.`,
      en: `Free: ${AI_CHAT_FREE_DAILY} messages a day.`,
    },
    where: "app/api/chat/route.js",
  },
  {
    key: "streak",
    icon: "🛡️",
    title: { mn: "Дараалал хамгаалах", ko: "연속 기록 보호", en: "Streak saves" },
    body: {
      mn: `Сард ${PRO_STREAK_SAVES} удаа нэг өдөр алгасахад дараалал тасрахгүй.`,
      ko: `한 달에 ${PRO_STREAK_SAVES}번, 하루를 쉬어도 연속 기록이 유지돼요.`,
      en: `Miss a day up to ${PRO_STREAK_SAVES} times a month without losing your streak.`,
    },
    where: "lib/domain/awardXp.js",
  },
  {
    key: "report",
    icon: "🧬",
    title: { mn: "Fighter DNA тайлан татах", ko: "Fighter DNA 리포트 다운로드", en: "Fighter DNA report download" },
    body: {
      mn: "Бүх хэмжилт, ахицаа файлаар татаж аваад дасгалжуулагчдаа үзүүл.",
      ko: "모든 측정값과 성장을 파일로 받아 코치에게 보여 주세요.",
      en: "Download all your measurements and progress as a file to show your coach.",
    },
    where: "app/api/dna-report/route.js",
  },
];

export const FREE_INCLUDES = {
  mn: ["Хязгааргүй раунд, оноо", "Раунд бүрийн дараах AI дүгнэлт", "Ахиц, түүх, цол", "3D дахин үзүүлэлт"],
  ko: ["무제한 라운드와 점수", "라운드 후 AI 디브리프", "성장, 기록, 랭크", "3D 리플레이"],
  en: ["Unlimited rounds and scores", "AI debrief after every round", "Progress, history and rank", "3D replay"],
};

const PRO_TIERS = new Set(["pro", "champion"]);
// Stripe subscription statuses that still give access. past_due / unpaid / canceled don't.
const ACTIVE_STATUSES = new Set(["active", "trialing"]);

/**
 * Is this user Pro right now? `subscription` is the Stripe status the webhook writes; docs
 * from before it existed (only `subscriptionTier`) still count while the tier is set.
 */
export function isProUser(userData) {
  if (!userData) return false;
  // Only subscriptionTier counts: it is written by the Stripe webhook and blocked for clients in
  // firestore.rules. The legacy `tier` field was client-writable, so it must never grant Pro.
  const tier = userData.subscriptionTier || null;
  if (!PRO_TIERS.has(tier)) return false;
  const status = userData.subscription;
  return !status || ACTIVE_STATUSES.has(status);
}

/** "9,900₮" — tögrög, grouped with commas (the usual way prices are written in Mongolia). */
export function formatMnt(amount) {
  return `${Math.round(Number(amount) || 0).toLocaleString("en-US")}₮`;
}
