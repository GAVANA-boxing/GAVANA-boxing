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
  "workout",
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
