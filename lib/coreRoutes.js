// Core-loop focus mode.
//
// GAVANA's wedge is one loop: Train → Score → AI feedback → Progress. While
// CORE_MODE is on, routes outside that loop are hidden from every navigation
// surface and proxy.js redirects them to /home, so a new user only ever sees
// the loop. Nothing is deleted — set NEXT_PUBLIC_CORE_MODE=false to restore
// the full app.

export const CORE_MODE = process.env.NEXT_PUBLIC_CORE_MODE !== "false";

// First path segment (after the locale) of routes that are OUT of the core loop.
export const NON_CORE_SEGMENTS = new Set([
  "feed",
  "reels",
  "explore",
  "discover",
  "events",
  "gyms",
  "sparring",
  "challenges",
  "leaderboard",
  "fighters",
  "creator",
  "programs",
  "upload",
  "story",
  "inbox",
  // "workout" (AI weekly plan builder) is part of the Coach tab now — not hidden.
  // Reel analysis — only reachable from the feed / reels, which core mode hides.
  "ai-analysis",
]);

const LOCALES = new Set(["mn", "en", "ko"]);

/** The route segment of a path: "/mn/feed/x" → "feed", "/feed" → "feed", "feed" → "feed". */
export function routeSegment(path) {
  const segs = String(path || "").split("?")[0].split("/").filter(Boolean);
  return LOCALES.has(segs[0]) ? segs[1] : segs[0];
}

/** True when a path belongs to the core loop (always true when CORE_MODE is off). */
export function showRoute(path) {
  if (!CORE_MODE) return true;
  const seg = routeSegment(path);
  return !seg || !NON_CORE_SEGMENTS.has(seg);
}

// Under /coach only the AI coach, its chat and the coach's team ("my students") are part of the
// core loop; the human-coach marketplace pages (profiles, apply, dashboard) are hidden.
const COACH_VISIBLE = new Set(["chat", "team"]);
const LOCALE_PATH = /^\/(mn|en|ko)\/([^/]+)(?:\/([^/]+))?/;

/**
 * Where proxy.js sends a request in core mode: the path to redirect to, or null to let it
 * through. Pure, so every visible route can be unit-tested against it (tests/navigation.test.js)
 * — a page that is linked from the UI but redirected here is unreachable in production.
 */
export function coreRedirect(pathname, coreMode = CORE_MODE) {
  if (!coreMode) return null;
  const m = String(pathname || "").match(LOCALE_PATH);
  if (!m) return null;
  const [, locale, segment, sub] = m;
  if (NON_CORE_SEGMENTS.has(segment)) return `/${locale}/home`;
  if (segment === "coach" && sub && !COACH_VISIBLE.has(sub)) return `/${locale}/coach`;
  return null;
}
