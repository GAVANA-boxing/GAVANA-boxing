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

// Weighted feed score for a single reel
export function computeFeedScore(reel, stats, userProfile) {
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

  // Freshness: reels under 72h get a linear boost
  const ts = reel.createdAt?.toMillis?.() || (reel.createdAt ? new Date(reel.createdAt).getTime() : 0);
  const ageHours = ts ? (Date.now() - ts) / 3_600_000 : 999;
  const freshness = Math.max(0, 72 - ageHours) * 1.2;

  let total = score + freshness;

  // Personalization
  if (userProfile) {
    if (userProfile.preferredCategories?.includes(reel.category)) total *= 1.3;
    if (userProfile.preferredDifficulty === reel.difficulty) total *= 1.2;
    if (userProfile.preferredDifficulty === "beginner" && reel.difficulty === "pro") total *= 0.6;
  }

  return total;
}
