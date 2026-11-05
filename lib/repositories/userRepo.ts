import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore/collections";

/**
 * The fields the app reads off a user document. Kept partial + indexed because
 * the real doc carries many more; this types the hot paths (and documents the
 * canonical field names — note `dailyStreak`, not the phantom `streakCount`).
 */
export interface UserProfile {
  uid: string;
  displayName?: string;
  username?: string;
  email?: string;
  photoURL?: string;
  profileImageUrl?: string;
  bio?: string;
  role?: string;
  xp?: number;
  dailyStreak?: number;
  bestDailyStreak?: number;
  lastTrainingDate?: string;
  streakFreezes?: number;
  subscriptionTier?: string;
  fighterDNA?: Record<string, unknown> | null;
  combatProgress?: Record<string, unknown> | null;
  wins?: number;
  losses?: number;
  locale?: string;
  onboardingComplete?: boolean;
  [key: string]: unknown;
}

/** One-shot read of a user's profile. Returns null if it doesn't exist. */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  return snap.exists() ? ({ uid, ...snap.data() } as UserProfile) : null;
}

/** Realtime subscription to a user's profile. Returns the unsubscribe fn. */
export function watchUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
  onError?: (err: unknown) => void,
): () => void {
  return onSnapshot(
    doc(db, COLLECTIONS.users, uid),
    (snap) => onChange(snap.exists() ? ({ uid, ...snap.data() } as UserProfile) : null),
    (err) => onError?.(err),
  );
}

/** Merge-update a user's profile. Never pass billing/admin fields from the client. */
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.users, uid), data, { merge: true });
}
