// Private profile fields (email, …) live in users_private/{uid}, readable only
// by the owner. The public users/{uid} doc is world-readable (profiles,
// leaderboards), so it must never hold an email address.

import { deleteField, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { PRIVATE_USER_FIELDS } from "@/lib/privateProfileFields";

/** Save the signed-in user's email to their private doc. */
export async function savePrivateEmail(uid, email) {
  if (!uid || !email) return;
  await setDoc(doc(db, "users_private", uid), { email, updatedAt: new Date().toISOString() }, { merge: true });
}

/**
 * Move any private fields still sitting on the public users doc (older
 * accounts) into users_private, then delete them from the public doc.
 * Safe to call repeatedly; does nothing when the public doc is already clean.
 */
export async function scrubPublicProfile(uid, profile) {
  if (!uid || !profile) return false;
  const leaked = PRIVATE_USER_FIELDS.filter((k) => profile[k] != null && profile[k] !== "");
  const present = PRIVATE_USER_FIELDS.filter((k) => k in profile);
  if (!present.length) return false;
  if (leaked.includes("email")) await savePrivateEmail(uid, profile.email);
  await updateDoc(doc(db, "users", uid), Object.fromEntries(present.map((k) => [k, deleteField()])));
  return true;
}
