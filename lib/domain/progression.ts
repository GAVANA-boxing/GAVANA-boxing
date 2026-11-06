import { getFighterRank, getNextRank, getRankProgress } from "@/lib/xp";

export interface AccountXpInput {
  /** The stored accumulator on the user doc (users.xp). */
  storedXp?: number | null;
  /** Training session docs — their xpGained is summed for the camera-performance component. */
  trainingSessions?: Array<{ xpGained?: unknown }>;
  /** A pre-summed training-session XP, if the caller already has the number. */
  trainingSessionXp?: number;
  /** users.dailyStreak (server-written). */
  streakDays?: number;
}

/** XP per day of the current daily streak. */
export const STREAK_XP_PER_DAY = 20;

/**
 * The ONE canonical account XP — every screen derives XP from here.
 *
 * Only server-written sources count, so a client can't inflate it:
 *   users.xp (missions / challenges, written by /api/score/session)
 *   + Σ training_sessions.xpGained (stamped by the server, once per session)
 *   + the daily streak (users.dailyStreak, server-written) × 20.
 * AI reel-feedback scores and likes used to count too; both were writable from
 * the client (and the reel "score" was an AI guess from the caption), so they
 * no longer add XP.
 */
export function getAccountXp({
  storedXp = 0,
  trainingSessions,
  trainingSessionXp,
  streakDays = 0,
}: AccountXpInput = {}): number {
  const stored = Math.max(0, Number(storedXp) || 0);
  const sessionXp =
    typeof trainingSessionXp === "number"
      ? Math.max(0, trainingSessionXp)
      : (trainingSessions || []).reduce((sum, s) => sum + Math.max(0, Number(s?.xpGained) || 0), 0);
  const streakXp = Math.max(0, Math.round(Number(streakDays) || 0)) * STREAK_XP_PER_DAY;
  return stored + sessionXp + streakXp;
}

/**
 * Belt + rank for a canonical XP value. Belts (5) and ranks (9) are just two
 * resolutions of the same axis — the point is they both read ONE xp now, so
 * they can never disagree. (Combat Level, in lib/combatProgress, already
 * consumes the same canonical xp.)
 */
export function getProgression(xpInput: number | null | undefined) {
  const xp = Math.max(0, Number(xpInput) || 0);
  return {
    xp,
    rank: getFighterRank(xp),
    nextRank: getNextRank(xp),
    rankProgressPct: getRankProgress(xp),
  };
}
