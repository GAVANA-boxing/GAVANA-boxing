"use client";

// Lightweight referral attribution for GAVANA viral share cards.
// A shared Fighter DNA card carries ?ref=<uid>; when a new device lands with
// it we remember who referred them and stamp it on the new user doc at signup.

const REF_KEY = "gavana_ref";
const REF_RE = /^[A-Za-z0-9_-]{6,48}$/;

/** Read ?ref= from the current URL and remember it (call once on app load). */
export function captureRefFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && REF_RE.test(ref)) {
      localStorage.setItem(REF_KEY, ref);
    }
  } catch { /* ignore */ }
}

/** The remembered referrer uid, or null. */
export function getStoredRef() {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(REF_KEY) || null; } catch { return null; }
}

/** Clear the stored ref (after it's been attributed at signup). */
export function clearStoredRef() {
  try { localStorage.removeItem(REF_KEY); } catch { /* ignore */ }
}

/** Build a shareable referral URL pointing back at the app. */
export function buildReferralUrl(uid, locale = "en") {
  const origin = (typeof window !== "undefined" && window.location && window.location.origin)
    ? window.location.origin
    : "https://gavana.app";
  return `${origin}/${locale}?ref=${encodeURIComponent(uid)}`;
}
