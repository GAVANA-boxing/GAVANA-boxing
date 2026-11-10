// users/{uid}.publicXp — the account XP (lib/domain/progression getAccountXp: stored XP + every
// round's xpGained + streak), written by the server after each award so other people's screens
// (public profile rank) never need to read someone else's training_sessions. Those are private.
import { firestoreRunQuery, whereEq } from "@/lib/server/firestore";
import { getAccountXp } from "@/lib/domain/progression";

/** `userDoc` = users/{uid} as it is AFTER this award. null if it can't be computed (never throws). */
export async function computePublicXp(uid, userDoc) {
  try {
    const rows = await firestoreRunQuery({
      select: { fields: [{ fieldPath: "xpGained" }] },
      from: [{ collectionId: "training_sessions" }],
      where: whereEq("userId", uid),
    });
    return getAccountXp({
      storedXp: userDoc?.xp,
      trainingSessions: rows,
      streakDays: Number(userDoc?.dailyStreak) || 0,
      bestStreakDays: Number(userDoc?.bestDailyStreak) || 0,
    });
  } catch {
    return null;
  }
}
