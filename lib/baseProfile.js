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

/**
 * What to add to a stored profile that has no identity: null when it already has a username
 * (a normal profile — leave it alone), otherwise only the base fields the document does not
 * have yet, so nothing that is stored is ever overwritten. `current` is null for a missing doc.
 */
export function missingIdentityFields(current, base) {
  const cur = current && typeof current === "object" ? current : {};
  if (cur.username) return null;
  const add = Object.fromEntries(Object.entries(base || {}).filter(([k]) => cur[k] === undefined));
  return Object.keys(add).length ? add : null;
}

