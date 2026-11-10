// Coach team ("my students") — the pure parts, shared by the API routes and the screens.
// Tested in tests/coachTeam.test.js.
//
// Model (Firestore, written only by the server — /api/coach/team, /api/coach/membership):
//   coach_teams/{coachUid}            { coachUid, name, code, roundsPerDay, drill, createdAt, updatedAt }
//   coach_members/{coachUid}_{uid}    { coachUid, studentUid, studentName, joinedAt }
// A student joins with the coach's code (that is the consent); a coach then sees, per student:
// rounds today / this week, the last score and "first rounds → latest rounds". Nothing else
// (no pose data, no video, no messages).
import { BENCHMARKS } from "@/lib/benchmarks";
import { progressGlance } from "@/lib/progressStats";

// No 0/O/1/I/L — easy to read out loud and type.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;
export const MAX_ROUNDS_PER_DAY = 10;
export const DEFAULT_ROUNDS_PER_DAY = 3;
export const MAX_TEAM_SIZE = 100;
export const TEAM_DRILLS = BENCHMARKS.map((b) => b.id);

/** A new invite code. `randomInt(n)` → integer in [0, n) (crypto in the API, injectable in tests). */
export function makeTeamCode(randomInt) {
  let s = "";
  for (let i = 0; i < CODE_LENGTH; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return s;
}

/** What a person typed → the code to look up (upper case, no spaces / dashes), or null. */
export function normalizeCode(input) {
  const s = String(input || "").toUpperCase().replace(/[\s-]/g, "");
  if (s.length !== CODE_LENGTH) return null;
  for (const ch of s) if (!CODE_ALPHABET.includes(ch)) return null;
  return s;
}

export function clampRounds(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return DEFAULT_ROUNDS_PER_DAY;
  return Math.max(1, Math.min(MAX_ROUNDS_PER_DAY, v));
}

export function cleanDrill(d) {
  return TEAM_DRILLS.includes(d) ? d : null;
}

export function cleanTeamName(name) {
  const s = String(name || "").replace(/\s+/g, " ").trim().slice(0, 40);
  return s || null;
}

/** Firestore Timestamp | {seconds} | ISO string | ms → ms (0 if unknown). */
export function toMs(ts) {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (typeof ts === "string") { const t = Date.parse(ts); return Number.isNaN(t) ? 0 : t; }
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  return 0;
}

/** Start of "today" in the viewer's time zone. `tzOffsetMin` = Date#getTimezoneOffset() (UB: -480). */
export function dayStartMs(nowMs, tzOffsetMin = 0) {
  const local = nowMs - tzOffsetMin * 60_000;
  return local - (((local % 86_400_000) + 86_400_000) % 86_400_000) + tzOffsetMin * 60_000;
}

/** One student's line on the coach screen, from their training_sessions docs (any order). */
export function summarizeStudent(sessions = [], { now = Date.now(), tzOffsetMin = 0, roundsPerDay = DEFAULT_ROUNDS_PER_DAY } = {}) {
  const rounds = (sessions || [])
    .filter((s) => s && (s.type == null || s.type === "training"))
    .map((s) => ({ ...s, createdAt: toMs(s.createdAt) }))
    .filter((s) => s.createdAt > 0)
    .sort((a, b) => b.createdAt - a.createdAt);
  const today0 = dayStartMs(now, tzOffsetMin);
  const today = rounds.filter((s) => s.createdAt >= today0).length;
  const week = rounds.filter((s) => s.createdAt >= now - 7 * 86_400_000).length;
  const last = rounds[0] || null;
  const g = progressGlance(rounds, { now });
  const goal = clampRounds(roundsPerDay);
  return {
    today,
    goal,
    doneToday: today >= goal,
    week,
    lastAt: last ? last.createdAt : null,
    lastScore: last && Number.isFinite(Number(last.score)) ? Math.round(Number(last.score) * 10) / 10 : null,
    glance: g.ready ? { start: g.start, now: g.now, delta: g.delta } : null,
    rounds: rounds.length,
  };
}

/** Who needs a nudge first: not done today, then least active this week, then name. */
export function sortStudents(list) {
  return [...list].sort((a, b) =>
    (a.summary.doneToday === b.summary.doneToday ? 0 : a.summary.doneToday ? 1 : -1)
    || (a.summary.week - b.summary.week)
    || String(a.name).localeCompare(String(b.name)));
}

/** "өнөөдөр" / "1 өдрийн өмнө" … for a last-active timestamp. */
export function daysAgo(lastAt, now = Date.now(), tzOffsetMin = 0) {
  if (!lastAt) return null;
  const d = Math.round((dayStartMs(now, tzOffsetMin) - dayStartMs(lastAt, tzOffsetMin)) / 86_400_000);
  return Math.max(0, d);
}
