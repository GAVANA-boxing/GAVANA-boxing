import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

// Upsert a reel_stats field with an atomic increment
export async function trackReelEvent(reelId, field, delta = 1) {
  if (!reelId) return;
  try {
    await setDoc(
      doc(db, "reel_stats", reelId),
      { reelId, [field]: increment(delta), updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch {
    // analytics is non-critical
  }
}

// Track a view — increments views + totalWatchSeconds
export async function trackReelView(reelId, watchSeconds = 0) {
  if (!reelId) return;
  try {
    await setDoc(
      doc(db, "reel_stats", reelId),
      {
        reelId,
        views: increment(1),
        totalWatchSeconds: increment(Math.round(watchSeconds)),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // non-critical
  }
}

// Write a challenge_attempts doc and bump reel_stats.challengeAttempts
export async function writeChallengeAttempt(data) {
  if (!data?.userId || !data?.reelId) return;
  try {
    await addDoc(collection(db, "challenge_attempts"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    await trackReelEvent(data.reelId, "challengeAttempts", 1);
  } catch {
    // non-critical
  }
}

// Upsert user_training_profile
export async function updateUserTrainingProfile(userId, updates) {
  if (!userId) return;
  try {
    await setDoc(
      doc(db, "user_training_profile", userId),
      { userId, ...updates, lastActiveAt: serverTimestamp() },
      { merge: true }
    );
  } catch {
    // non-critical
  }
}

// Default profile applied for users with no training history — favours accessible content
const BEGINNER_DEFAULT_PROFILE = {
  preferredDifficulty: "beginner",
  preferredCategories: ["boxing", "fitness"],
};

// Weighted feed score for a single reel.
// alreadySeen: push already-watched reels to the bottom.
// isFeaturedCreator: boost reels from platform-featured creators.
export function computeFeedScore(reel, stats, userProfile, alreadySeen = false, isFeaturedCreator = false) {
  const s = stats || {};
  const score =
    (Number(s.views) || 0) * 0.05 +
    (Number(s.likes) || 0) * 0.3 +
    (Number(s.comments) || 0) * 0.5 +
    (Number(s.shares) || 0) * 0.8 +
    (Number(s.saves) || 0) * 0.5 +
    (Number(s.challengeClicks) || 0) * 0.7 +
    (Number(s.challengeAttempts) || 0) * 1.0 +
    (Number(s.avgWatchSeconds) || 0) * 0.4;

  // Freshness: linear boost for reels under 72 h
  const ts = reel.createdAt?.toMillis?.() || (reel.createdAt ? new Date(reel.createdAt).getTime() : 0);
  const ageHours = ts ? (Date.now() - ts) / 3_600_000 : 999;
  const freshness = Math.max(0, 72 - ageHours) * 1.2;

  let total = score + freshness;

  // Personalization — fall back to beginner defaults for new users with no history
  const profile = userProfile || BEGINNER_DEFAULT_PROFILE;
  if (profile.preferredCategories?.includes(reel.category)) total *= 1.3;
  if (profile.preferredDifficulty === reel.difficulty) total *= 1.2;
  if (profile.preferredDifficulty === "beginner" && reel.difficulty === "pro") total *= 0.6;

  // Anti-repetition: strongly de-rank already-watched reels so fresh content surfaces
  if (alreadySeen) total *= 0.35;

  // Featured creator boost: surface hand-picked creators more prominently
  if (isFeaturedCreator) total *= 1.5;

  return total;
}

// ---------------------------------------------------------------------------
// Lightweight event tracking — fires-and-forgets to /api/analytics, never throws
// ---------------------------------------------------------------------------
const ENDPOINT = "/api/analytics";

export function track(event, props = {}) {
  if (typeof window === "undefined") return;
  try {
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        props: {
          ...props,
          url: window.location.pathname,
          ts: Date.now(),
        },
      }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* silent */ }
}

// Pre-defined event constants to avoid typos
export const EVENTS = {
  // Training
  SESSION_STARTED:     "session_started",
  SESSION_COMPLETED:   "session_completed",
  SCORE_ACHIEVED:      "score_achieved",

  // DNA
  DNA_UNLOCKED:        "dna_unlocked",
  DNA_VIEWED:          "dna_viewed",
  DNA_SHARED:          "dna_shared",
  DNA_COMPARED:        "dna_compared",

  // Retention
  STREAK_EXTENDED:     "streak_extended",
  STREAK_BROKEN:       "streak_broken",
  MISSION_COMPLETED:   "mission_completed",

  // Social
  CHALLENGE_SENT:      "challenge_sent",
  CHALLENGE_ACCEPTED:  "challenge_accepted",
  REEL_SHARED:         "reel_shared",

  // Monetization
  UPGRADE_VIEWED:      "upgrade_viewed",
  UPGRADE_CLICKED:     "upgrade_clicked",
  SUBSCRIBED:          "subscribed",

  // Onboarding
  ONBOARDING_STARTED:  "onboarding_started",
  ONBOARDING_COMPLETED:"onboarding_completed",

  // Errors
  CLIENT_ERROR:        "client_error",
};

export function trackError(err, context = {}) {
  if (typeof window === "undefined") return;
  try {
    const message = err?.message || String(err);
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "client_error",
        props: {
          message: message.slice(0, 300),
          stack: err?.stack?.slice(0, 500) || "",
          ...context,
          url: window.location.pathname,
          ts: Date.now(),
        },
      }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* never throw */ }
}
