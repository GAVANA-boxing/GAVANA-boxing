// First-party event beacon (POST /api/analytics). No Firestore here on purpose: lib/funnel
// runs on every page, and lib/analytics (reel stats) needs the Firestore SDK.

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

// ── Client error reporting (no third-party service) ──────────────────────────
// Uncaught errors / rejections and route error boundaries send a "client_error" event to our
// own analytics (analytics_events). Only "<where>:<first 50 chars of the message>" is kept
// (the server stores 64 chars of `meta`); at most 5 reports per page load, no duplicates.
const reported = new Set();

export function reportClientError(err, where = "window") {
  if (typeof window === "undefined" || reported.size >= 5) return;
  const message = String(err?.message || err || "unknown").replace(/\s+/g, " ").slice(0, 50);
  const key = `${where}:${message}`;
  if (reported.has(key)) return;
  reported.add(key);
  track("client_error", { meta: key.slice(0, 64) });
}
