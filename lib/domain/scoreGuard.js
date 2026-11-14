// Anti-cheat for /api/score/session. Pure functions (tested in tests/scoreGuard.test.js).
//
// The punch score is computed on the phone (MediaPipe runs on-device), so the
// server can't re-score a round. What it CAN do is make cheating pointless:
//   - date keys come from the server clock, not the client;
//   - XP is read from the saved session doc (not the request), awarded once
//     per session, only for a fresh session with real punches in it;
//   - daily caps bound what any account can earn per day;
//   - a challenge pays out once per challenge per day.

import { calculateChallengeXP } from "@/lib/xp";
import { getChallengeRank } from "@/lib/utils";

const DAY = 86_400_000;

/** XP-earning camera sessions per day. */
export const MAX_XP_SESSIONS_PER_DAY = 10;
/** Paid-out challenges per day. */
export const MAX_CHALLENGE_AWARDS_PER_DAY = 5;
/**
 * Physical limits of a real round. A client can still lie about its numbers (MediaPipe runs on
 * the phone), but not beyond what a human can do — so a forged "500 punches in 20 s" earns
 * nothing. Generous on purpose: elite fighters peak around 4–5 punches/s in a flurry and
 * average far less over a round.
 */
export const MAX_PUNCHES_PER_SECOND = 6;
export const ROUND_SECONDS_MIN = 5;
export const ROUND_SECONDS_MAX = 900;

/** A session must be claimed within this long of being saved. */
export const SESSION_CLAIM_WINDOW_MS = 30 * 60_000;
/** Punches a round needs before it can earn XP or complete the daily mission. */
export const MIN_PUNCHES_FOR_XP = 3;

const KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function keyOf(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * The client sends its LOCAL date (so streaks follow the user's own midnight).
 * Accept it only if it is a real date within one day of the server's UTC date
 * (time zones span UTC−12…UTC+14), and derive the other keys from it here
 * rather than trusting them. Returns null when invalid.
 */
export function resolveDateKeys(todayKey, nowMs = Date.now()) {
  const m = KEY_RE.exec(String(todayKey || ""));
  if (!m) return null;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (keyOf(ms) !== todayKey) return null; // e.g. 2026-02-31
  const serverDay = Date.UTC(new Date(nowMs).getUTCFullYear(), new Date(nowMs).getUTCMonth(), new Date(nowMs).getUTCDate());
  if (Math.abs(ms - serverDay) > DAY) return null;
  return {
    todayKey,
    yesterdayKey: keyOf(ms - DAY),
    twoDaysAgoKey: keyOf(ms - 2 * DAY),
    monthKey: todayKey.slice(0, 7),
  };
}

function toMs(ts) {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (typeof ts === "string") return Date.parse(ts) || 0;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  return 0;
}

/** Punches the saved session shows evidence of (pose punch count, else hits). */
export function sessionPunches(session) {
  return Math.max(Number(session?.poseMetrics?.punchCount) || 0, Number(session?.hitCount) || 0);
}

/**
 * Is this saved session a real, fresh round owned by `uid`?
 * → { ok: true, score } or { ok: false, reason }
 */
export function checkSession(session, uid, nowMs = Date.now()) {
  if (!session) return { ok: false, reason: "missing" };
  if (session.userId !== uid) return { ok: false, reason: "not_owner" };
  if (session.type && session.type !== "training") return { ok: false, reason: "not_training" };
  const score = Number(session.score);
  if (!Number.isFinite(score) || score < 0 || score > 10) return { ok: false, reason: "bad_score" };
  const created = toMs(session.createdAt);
  if (!created || nowMs - created > SESSION_CLAIM_WINDOW_MS || created - nowMs > 5 * 60_000) return { ok: false, reason: "stale" };
  if (sessionPunches(session) < MIN_PUNCHES_FOR_XP) return { ok: false, reason: "no_punches" };
  const seconds = Number(session.durationSeconds);
  if (session.durationSeconds != null && (!Number.isFinite(seconds) || seconds < ROUND_SECONDS_MIN || seconds > ROUND_SECONDS_MAX)) {
    return { ok: false, reason: "implausible_duration" };
  }
  const limitSeconds = Number.isFinite(seconds) ? seconds : ROUND_SECONDS_MAX;
  if (sessionPunches(session) > limitSeconds * MAX_PUNCHES_PER_SECOND) return { ok: false, reason: "implausible_punches" };
  return { ok: true, score };
}

/** Today's count for a per-day counter stored as { <day field>, <count field> } on the user doc. */
function countToday(userData, dayField, countField, todayKey) {
  return userData?.[dayField] === todayKey ? Number(userData?.[countField]) || 0 : 0;
}

/**
 * The XP to show for this call. A repeated call for a round that was already awarded (lost
 * response, retry) grants nothing new, but the result screen must still show what the round
 * earned — the value stamped on the session.
 */
export function sessionXpToReport(decision, session) {
  if (decision?.reason === "already_awarded") return Math.max(0, Number(session?.xpGained) || 0);
  return Math.max(0, Number(decision?.xp) || 0);
}

/**
 * XP for one saved camera session.
 * → { xp, reason, sessionUpdate, userUpdate }
 *   sessionUpdate: what to stamp on the session doc (null = leave it alone)
 *   userUpdate:    the daily-counter fields for the user doc (null = none)
 */
export function sessionXpDecision({ session, uid, userData = {}, todayKey, nowMs = Date.now() }) {
  if (session && session.xpGained != null) return { xp: 0, reason: "already_awarded", sessionUpdate: null, userUpdate: null };
  const check = checkSession(session, uid, nowMs);
  if (!check.ok) {
    // Stamp 0 on the caller's own doc so it can't be retried later.
    const own = session && session.userId === uid;
    return { xp: 0, reason: check.reason, sessionUpdate: own ? { xpGained: 0 } : null, userUpdate: null };
  }
  const used = countToday(userData, "sessionXpDay", "sessionXpCount", todayKey);
  if (used >= MAX_XP_SESSIONS_PER_DAY) return { xp: 0, reason: "daily_cap", sessionUpdate: { xpGained: 0 }, userUpdate: null };
  const xp = calculateChallengeXP(check.score, getChallengeRank(check.score));
  return {
    xp,
    reason: "ok",
    sessionUpdate: { xpGained: xp },
    userUpdate: { sessionXpDay: todayKey, sessionXpCount: used + 1 },
  };
}

/** May this user be paid for another challenge today? → { ok, userUpdate } */
export function challengeAwardDecision(userData = {}, todayKey) {
  const used = countToday(userData, "challengeAwardDay", "challengeAwardCount", todayKey);
  if (used >= MAX_CHALLENGE_AWARDS_PER_DAY) return { ok: false, userUpdate: null };
  return { ok: true, userUpdate: { challengeAwardDay: todayKey, challengeAwardCount: used + 1 } };
}

/** Deterministic challenge_results id: one payout per user × challenge × day. */
export function challengeResultId(uid, challengeId, todayKey) {
  return `${uid}_${String(challengeId).replace(/[^\w-]/g, "").slice(0, 80)}_${todayKey}`;
}
