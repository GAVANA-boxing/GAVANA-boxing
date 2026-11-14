// The identity fields a brand-new users/{uid} document starts with — the same ones the login
// page writes at sign-up. Onboarding uses this when it finds no profile at all (a sign-up that
// was interrupted before the login page could write it), so the account is not left nameless.
//
// Only values that exist are included: merged over a document, this can add a name or a photo
// but never blank one. No server-only key (xp, subscription, …) and no email (that lives in
// users_private) — see firestore.rules.

/** @returns {Record<string, string | null>} */
export function missingProfileBase({ uid, email = "", displayName = "", photoURL = "", referredBy = null, now = new Date() } = {}) {
  const base = {
    username: String(email || uid || "").split("@")[0],
    bio: "",
    referredBy: referredBy || null,
    createdAt: now.toISOString(),
  };
  if (displayName) base.displayName = String(displayName);
  if (photoURL) { base.photoURL = String(photoURL); base.profileImageUrl = String(photoURL); }
  return base;
}
