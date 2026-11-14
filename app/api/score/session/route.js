import { withAuth } from "@/lib/withAuth";
import { firestoreGet, firestorePatch, firestoreCreateWithId } from "@/lib/server/firestore";
import { computeChallengeProgression, computeMissionProgression } from "@/lib/domain/awardXp";
import { checkSession, challengeAwardDecision, challengeResultId, resolveDateKeys, sessionXpDecision, sessionXpToReport } from "@/lib/domain/scoreGuard";
import { getCurrentSeasonId } from "@/lib/season";
import { CORE_MODE } from "@/lib/coreRoutes";
import { computePublicXp } from "@/lib/server/publicXp";

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
//
// Anti-cheat (lib/domain/scoreGuard.js): server-checked dates, XP read from the
// saved session (fresh, owned, with real punches), once per session, daily
// caps, one challenge payout per challenge per day.

const _rate = new Map();
function rateLimited(uid) {
  const now = Date.now();
  const e = _rate.get(uid) || { count: 0, reset: now + 60_000 };
  if (now > e.reset) { e.count = 0; e.reset = now + 60_000; }
  e.count++;
  _rate.set(uid, e);
  return e.count > 30;
}

// "Not configured" only when the service account is really not set. The same error is thrown
// when it IS set but the token request failed once (cold start, network) — that is a transient
// failure (500): the client retries it and keeps the round's XP pending. Answering 503 there
// made the client give up on the round's XP for good.
function notConfigured(err) {
  return err instanceof Error && err.message === "service-account-unconfigured" && !process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
}

export const POST = withAuth(async (req, { uid }) => {
  if (rateLimited(uid)) return Response.json({ error: "Rate limited" }, { status: 429 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const { type, score, challengeId, trainingSessionId, locale = "en", dateKeys: clientKeys } = body || {};
  if (type !== "challenge" && type !== "mission") {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }
  // The client's local date, checked against the server clock; the other keys
  // are derived here (never trusted from the request).
  const dateKeys = resolveDateKeys(clientKeys?.todayKey);
  if (!dateKeys) {
    return Response.json({ error: "Bad date" }, { status: 400 });
  }

  try {
    const userData = (await firestoreGet(`users/${uid}`)) || {};

    if (type === "challenge") {
      // Challenges are outside the core loop (hidden while CORE_MODE is on), so
      // there is no legitimate caller — don't pay out for a client-sent score.
      if (CORE_MODE) {
        return Response.json({ error: "Challenges are off", code: "challenges_disabled" }, { status: 403 });
      }
      const s = Number(score);
      if (!Number.isFinite(s) || s < 0 || s > 10) {
        return Response.json({ error: "Invalid score" }, { status: 400 });
      }
      if (!challengeId || typeof challengeId !== "string") {
        return Response.json({ error: "Missing challengeId" }, { status: 400 });
      }
      const cap = challengeAwardDecision(userData, dateKeys.todayKey);
      if (!cap.ok) {
        return Response.json({ error: "Daily challenge limit", code: "daily_cap" }, { status: 429 });
      }

      const { userUpdate, challengeResult, celebration } = computeChallengeProgression(userData, s, dateKeys);

      // One payout per user × challenge × day: the result doc's id is
      // deterministic and the create fails if it already exists.
      const created = await firestoreCreateWithId("challenge_results", challengeResultId(uid, challengeId, dateKeys.todayKey), {
        userId: uid,
        challengeId,
        ...challengeResult,
        seasonId: getCurrentSeasonId(),
        createdAt: new Date(),
        locale,
      });
      if (!created) {
        return Response.json({ ok: true, alreadyAwarded: true, celebration: null });
      }
      const challengeUser = { ...userData, ...userUpdate, ...cap.userUpdate };
      const challengePublicXp = await computePublicXp(uid, challengeUser);
      await firestorePatch(`users/${uid}`, {
        ...userUpdate, ...cap.userUpdate,
        ...(challengePublicXp != null ? { publicXp: challengePublicXp } : {}),
        updatedAt: new Date(),
      });

      return Response.json({ ok: true, celebration, authoritative: userUpdate });
    }

    // type === "mission": needs a real, fresh round saved by this user.
    const session = trainingSessionId && typeof trainingSessionId === "string"
      ? await firestoreGet(`training_sessions/${trainingSessionId}`)
      : null;
    const check = checkSession(session, uid);
    if (!check.ok) {
      return Response.json({ ok: true, alreadyCompleted: false, celebration: { missionJustCompleted: false }, trainingXpGained: 0, rejected: check.reason });
    }

    const { alreadyCompleted, userUpdate, celebration } = computeMissionProgression(userData, dateKeys);

    // The session's xpGained (what getAccountXp sums) — computed from the SAVED
    // session's score, once per session, within the daily cap.
    const decision = sessionXpDecision({ session, uid, userData, todayKey: dateKeys.todayKey });
    if (decision.sessionUpdate) await firestorePatch(`training_sessions/${trainingSessionId}`, decision.sessionUpdate);

    // Public rank for other people's screens (training_sessions are owner-only): the full account
    // XP after this round, computed here (session xpGained already patched above).
    const missionUser = { ...userData, ...userUpdate, ...(decision.userUpdate || {}) };
    const publicXp = await computePublicXp(uid, missionUser);
    await firestorePatch(`users/${uid}`, {
      ...userUpdate, ...(decision.userUpdate || {}),
      ...(publicXp != null ? { publicXp } : {}),
      updatedAt: new Date(),
    });

    // A repeated call for the same round (lost response, retry) awards nothing new — report the
    // XP already stamped on it, so the result screen still shows what the round earned.
    const trainingXpGained = sessionXpToReport(decision, session);
    return Response.json({ ok: true, alreadyCompleted, celebration, trainingXpGained, xpReason: decision.reason, authoritative: userUpdate });
  } catch (err) {
    if (notConfigured(err)) {
      return Response.json({ error: "Scoring not configured", code: "not_configured" }, { status: 503 });
    }
    console.error("[score/session] error:", err);
    return Response.json({ error: "Scoring failed" }, { status: 500 });
  }
});
