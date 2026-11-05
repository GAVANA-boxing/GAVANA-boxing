// Guest → account session hand-off.
//
// A guest can train before signing up (Duolingo-style), but their result used
// to live only in React state and vanished at sign-up. Now the train page
// stashes the finished guest session in localStorage, and once the user has an
// account (GuestSessionClaimer, root layout) it is saved as their first real
// session — training_sessions doc + server-authoritative XP/streak — exactly
// like a normal save.

const KEY = "gavana_pending_guest_session";
export const GUEST_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const GUEST_SESSION_MIN_PUNCHES = 5;
const MAX_EVENTS = 400;

/** Pure: validate a stored payload. Returns the session or null (expired / malformed). */
export function parseGuestSession(raw, now = Date.now()) {
  let s;
  try { s = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return null; }
  if (!s || typeof s !== "object" || s.v !== 1) return null;
  if (!Number.isFinite(s.savedAt) || now - s.savedAt > GUEST_SESSION_TTL_MS || s.savedAt > now + 60_000) return null;
  const r = s.result;
  if (!r || !Number.isFinite(Number(r.score))) return null;
  const score = Number(r.score);
  if (score < 0 || score > 10) return null;
  if ((Number(r.hitCount) || 0) < GUEST_SESSION_MIN_PUNCHES) return null;
  return {
    ...s,
    result: { ...r, score },
    movementEvents: Array.isArray(s.movementEvents) ? s.movementEvents.slice(0, MAX_EVENTS) : [],
  };
}

/** Pure: strip the heavy arrays the normal save also strips. */
export function slimPoseMetrics(poseMetrics) {
  if (!poseMetrics) return null;
  const { motionHistory: _mh, punchEvents: _pe, coaching, ...rest } = poseMetrics;
  const weaknesses = (coaching || []).filter((c) => c.type === "improve").map((c) => c.message).slice(0, 2);
  if (weaknesses.length) rest.weaknesses = weaknesses;
  return rest;
}

export function stashGuestSession({ result, movementEvents = [], poseMetrics = null, drillId = null, drillConfig = null, reelId = null, locale = "en" }) {
  if (typeof window === "undefined" || !result) return;
  const base = {
    v: 1,
    savedAt: Date.now(),
    locale,
    reelId,
    drillId,
    drillConfig: drillConfig ? { id: drillConfig.id, durationSeconds: drillConfig.durationSeconds } : null,
    result: {
      score: result.score,
      hitCount: result.hitCount || 0,
      breakdown: result.breakdown || null,
      rankProgress: result.rankProgress ?? null,
    },
    movementEvents: (movementEvents || []).slice(0, MAX_EVENTS),
  };
  const pm = slimPoseMetrics(poseMetrics);
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...base, poseMetrics: pm }));
  } catch {
    // Quota exceeded → keep the essentials without the pose summary.
    try { localStorage.setItem(KEY, JSON.stringify({ ...base, poseMetrics: null, movementEvents: [] })); } catch { /* give up */ }
  }
}

export function readGuestSession() {
  if (typeof window === "undefined") return null;
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch { return null; }
  if (!raw) return null;
  const s = parseGuestSession(raw);
  if (!s) clearGuestSession(); // expired or malformed — drop it
  return s;
}

export function clearGuestSession() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/**
 * Save the pending guest session to `user`'s account. Removes it first so two
 * tabs can't double-claim; restores it if the write fails so it can retry.
 * Returns { claimed, celebration } or { claimed: false }.
 */
export async function claimGuestSession(user) {
  const s = readGuestSession();
  if (!s || !user?.uid) return { claimed: false };
  clearGuestSession();
  try {
    const [{ db }, { addDoc, collection, serverTimestamp }, { buildTrainingSessionDoc }, { buildDateKeys, commitSessionProgression }] =
      await Promise.all([
        import("@/lib/firebase"),
        import("firebase/firestore"),
        import("@/lib/trainingSessionDoc"),
        import("@/lib/scoreClient"),
      ]);
    const ref = await addDoc(collection(db, "training_sessions"), {
      ...buildTrainingSessionDoc({
        uid: user.uid,
        result: s.result,
        reelId: s.reelId,
        attemptNumber: 1,
        locale: s.locale,
        drillId: s.drillId,
        drillConfig: s.drillConfig,
        movementEvents: s.movementEvents,
        poseMetrics: s.poseMetrics || null,
        source: "guest_claim",
      }),
      createdAt: serverTimestamp(),
    });
    // Server-authoritative daily mission XP/streak + the session's xpGained.
    const srv = await commitSessionProgression(user, {
      type: "mission",
      locale: s.locale,
      dateKeys: buildDateKeys(),
      trainingSessionId: ref.id,
      score: s.result.score,
    });
    return { claimed: true, score: s.result.score, celebration: srv?.ok ? srv.celebration : null };
  } catch {
    // Put it back so the next visit retries.
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
    return { claimed: false };
  }
}
