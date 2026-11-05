import { withAuth } from "@/lib/withAuth";
import { firestoreGet, firestorePatch, firestoreCreate } from "@/lib/server/firestore";
import { computeChallengeProgression, computeMissionProgression } from "@/lib/domain/awardXp";
import { getCurrentSeasonId } from "@/lib/season";

// Server-authoritative progression. The client posts the raw session outcome;
// the server recomputes XP / streak / rank with the shared pure math and writes
// users.xp (+ challenge_results) via the service account, which bypasses rules.
// Combined with the rules that forbid the client from writing these fields, a
// user can no longer forge their own XP by writing the user doc directly.
//
// If the service account isn't configured yet (FIREBASE_SERVICE_ACCOUNT_BASE64
// unset), this returns 503 { code: "not_configured" } and the client falls back
// to its legacy direct write — so nothing breaks before that env + the rules
// are deployed.

const _rate = new Map();
function rateLimited(uid) {
  const now = Date.now();
  const e = _rate.get(uid) || { count: 0, reset: now + 60_000 };
  if (now > e.reset) { e.count = 0; e.reset = now + 60_000; }
  e.count++;
  _rate.set(uid, e);
  return e.count > 30;
}

function notConfigured(err) {
  return err instanceof Error && err.message === "service-account-unconfigured";
}

export const POST = withAuth(async (req, { uid }) => {
  if (rateLimited(uid)) return Response.json({ error: "Rate limited" }, { status: 429 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const { type, score, challengeId, locale = "en", dateKeys } = body || {};
  if (type !== "challenge" && type !== "mission") {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!dateKeys || typeof dateKeys.todayKey !== "string") {
    return Response.json({ error: "Missing dateKeys" }, { status: 400 });
  }

  try {
    const userData = (await firestoreGet(`users/${uid}`)) || {};

    if (type === "challenge") {
      const s = Number(score);
      if (!Number.isFinite(s) || s < 0 || s > 10) {
        return Response.json({ error: "Invalid score" }, { status: 400 });
      }
      if (!challengeId || typeof challengeId !== "string") {
        return Response.json({ error: "Missing challengeId" }, { status: 400 });
      }

      const { userUpdate, challengeResult, celebration } = computeChallengeProgression(
        userData,
        s,
        dateKeys,
      );

      await firestorePatch(`users/${uid}`, { ...userUpdate, updatedAt: new Date() });
      await firestoreCreate("challenge_results", {
        userId: uid,
        challengeId,
        ...challengeResult,
        seasonId: getCurrentSeasonId(),
        createdAt: new Date(),
        locale,
      });

      return Response.json({ ok: true, celebration, authoritative: userUpdate });
    }

    // type === "mission"
    const { alreadyCompleted, userUpdate, celebration } = computeMissionProgression(
      userData,
      dateKeys,
    );
    await firestorePatch(`users/${uid}`, { ...userUpdate, updatedAt: new Date() });
    return Response.json({ ok: true, alreadyCompleted, celebration, authoritative: userUpdate });
  } catch (err) {
    if (notConfigured(err)) {
      return Response.json({ error: "Scoring not configured", code: "not_configured" }, { status: 503 });
    }
    console.error("[score/session] error:", err);
    return Response.json({ error: "Scoring failed" }, { status: 500 });
  }
});
