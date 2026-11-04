"use strict";

/**
 * GAVANA — scheduled retention push functions.
 *
 * Fills the single biggest retention gap: nothing currently pushes to a user
 * who has STOPPED opening the app. These scheduled functions run server-side
 * (no client needed) and re-engage lapsing fighters.
 *
 *   1. streakAtRisk — evening nudge to users with an active streak who have
 *      NOT trained yet today, so the streak loss-aversion fires BEFORE the
 *      streak dies (not after they already re-opened the app).
 *   2. winBack — gentle pull-back for users who lapsed 3–14 days, throttled
 *      so we never nag more than once every 3 days.
 *
 * Data model (already written by the app):
 *   users/{uid}.dailyStreak        number
 *   users/{uid}.lastTrainingDate   "YYYY-MM-DD" (user-local day key)
 *   users/{uid}.displayName        string
 *   users/{uid}.locale             "mn" | "en" | "ko"  (optional; defaults mn)
 *   users/{uid}.pushEnabled        boolean (optional; opt-out when === false)
 *   users/{uid}/fcmTokens/{id}.token   FCM web push token
 *
 * Fields THIS module writes (dedup/throttle bookkeeping):
 *   users/{uid}.lastStreakRiskKey  "YYYY-MM-DD"
 *   users/{uid}.lastWinBackKey     "YYYY-MM-DD"
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const logger = require("firebase-functions/logger");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

// Match the project's Firestore region (asia-northeast3 / Seoul).
const REGION = "asia-northeast3";
// Primary market timezone — schedules fire in local evening/morning.
const TZ = "Asia/Ulaanbaatar";
const ICON = "/icons/gavana-icon.svg";

// ── date helpers (timezone-aware, YYYY-MM-DD) ─────────────────────────────────
function dateKeyInTz(date, timeZone = TZ) {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

function keyDaysAgo(n, timeZone = TZ) {
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return dateKeyInTz(d, timeZone);
}

function daysBetweenKeys(a, b) {
  // a, b = "YYYY-MM-DD"; returns whole-day difference |a-b|
  const pa = Date.parse(a + "T00:00:00Z");
  const pb = Date.parse(b + "T00:00:00Z");
  if (Number.isNaN(pa) || Number.isNaN(pb)) return Infinity;
  return Math.round(Math.abs(pa - pb) / 86400000);
}

// ── localized copy ────────────────────────────────────────────────────────────
const COPY = {
  streakRisk: {
    mn: (n, name) => ({ title: `🔥 ${n} өдрийн streak эрсдэлд`, body: `${name ? name + ", " : ""}өнөөдөр бэлтгэж streak-ээ хадгалаарай.` }),
    en: (n, name) => ({ title: `🔥 ${n}-day streak at risk`,   body: `${name ? name + ", " : ""}train today to keep your streak alive.` }),
    ko: (n, name) => ({ title: `🔥 ${n}일 연속 기록 위험`,      body: `${name ? name + "님, " : ""}오늘 훈련하고 연속 기록을 지키세요.` }),
  },
  winBack: {
    mn: (name) => ({ title: "Таны тулаанч хүлээж байна 🥊", body: `${name ? name + ", " : ""}эргэж ирээд Fighter DNA-гаа хөгжүүлээрэй.` }),
    en: (name) => ({ title: "Your fighter is waiting 🥊",   body: `${name ? name + ", " : ""}come back and evolve your Fighter DNA.` }),
    ko: (name) => ({ title: "파이터가 기다리고 있어요 🥊",   body: `${name ? name + "님, " : ""}돌아와서 파이터 DNA를 발전시키세요.` }),
  },
};

function copyFor(group, locale) {
  const map = COPY[group];
  return map[locale] || map.mn;
}

// ── send to every valid token a user has; prune dead tokens ───────────────────
async function sendToUser(uid, { title, body, url }) {
  const tokSnap = await db.collection("users").doc(uid).collection("fcmTokens").get();
  const docs = tokSnap.docs;
  const tokens = docs.map((d) => d.get("token")).filter(Boolean);
  if (!tokens.length) return 0;

  const res = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: { url: url || "/", type: "retention" },
    webpush: {
      notification: { icon: ICON },
      fcmOptions: { link: url || "/" },
    },
  });

  // Clean up tokens that are permanently invalid.
  await Promise.all(res.responses.map((r, i) => {
    if (r.success) return null;
    const code = r.error && r.error.code ? r.error.code : "";
    if (code.includes("registration-token-not-registered") ||
        code.includes("invalid-registration-token") ||
        code.includes("invalid-argument")) {
      return docs[i].ref.delete().catch(() => {});
    }
    return null;
  }));

  return res.successCount;
}

function localeOf(u) {
  return u.locale || u.preferredLocale || "mn";
}

// ── 1) Streak at risk — daily 18:00 local ─────────────────────────────────────
exports.streakAtRisk = onSchedule(
  { schedule: "0 18 * * *", timeZone: TZ, region: REGION },
  async () => {
    const todayKey = dateKeyInTz(new Date());
    const snap = await db.collection("users").where("dailyStreak", ">=", 3).get();

    let users = 0, pushes = 0;
    for (const doc of snap.docs) {
      const u = doc.data();
      if (u.pushEnabled === false) continue;          // opted out
      if (u.lastTrainingDate === todayKey) continue;   // already trained today
      if (u.lastStreakRiskKey === todayKey) continue;  // already nudged today

      const locale = localeOf(u);
      const { title, body } = copyFor("streakRisk", locale)(u.dailyStreak, u.displayName);
      const n = await sendToUser(doc.id, { title, body, url: `/${locale}/train` });
      if (n > 0) {
        pushes += n;
        users += 1;
        await doc.ref.set({ lastStreakRiskKey: todayKey }, { merge: true });
      }
    }
    logger.info(`streakAtRisk: ${users} users, ${pushes} pushes (today=${todayKey})`);
  }
);

// ── 2) Win-back — daily 11:00 local, lapsed 3–14 days, throttled every 3 days ──
exports.winBack = onSchedule(
  { schedule: "0 11 * * *", timeZone: TZ, region: REGION },
  async () => {
    const todayKey = dateKeyInTz(new Date());
    const maxKey = keyDaysAgo(3);   // lapsed at least 3 days
    const minKey = keyDaysAgo(14);  // but not more than 14 (still winnable)

    // YYYY-MM-DD sorts lexicographically == chronologically, so a string range works.
    const snap = await db.collection("users")
      .where("lastTrainingDate", ">=", minKey)
      .where("lastTrainingDate", "<=", maxKey)
      .get();

    let users = 0, pushes = 0;
    for (const doc of snap.docs) {
      const u = doc.data();
      if (u.pushEnabled === false) continue;
      // throttle: never win-back more than once per 3 days
      if (u.lastWinBackKey && daysBetweenKeys(u.lastWinBackKey, todayKey) < 3) continue;

      const locale = localeOf(u);
      const { title, body } = copyFor("winBack", locale)(u.displayName);
      const n = await sendToUser(doc.id, { title, body, url: `/${locale}/train` });
      if (n > 0) {
        pushes += n;
        users += 1;
        await doc.ref.set({ lastWinBackKey: todayKey }, { merge: true });
      }
    }
    logger.info(`winBack: ${users} users, ${pushes} pushes (window ${minKey}..${maxKey})`);
  }
);
