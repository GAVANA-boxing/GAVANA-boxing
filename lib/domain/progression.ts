import { calculateUserXP, getFighterRank, getNextRank, getRankProgress } from "@/lib/xp";
import { getBelt, getNextBelt, getBeltProgress } from "@/lib/belts";

export interface AccountXpInput {
  /** The stored accumulator on the user doc (users.xp). */
  storedXp?: number | null;
  /** AI feedback docs ({ score, createdAt }) for the reel-performance component. */
  aiFeedbackDocs?: Array<{ score: unknown; createdAt?: unknown }>;
  /** Training session docs — their xpGained is summed for the camera-performance component. */
  trainingSessions?: Array<{ xpGained?: unknown }>;
  /** A pre-summed training-session XP, if the caller already has the number. */
  trainingSessionXp?: number;
  streakDays?: number;
  likesReceived?: number;
}

/**
 * The ONE canonical account XP. Before this, XP was computed several different
 * ways across the app, so a fighter's XP/belt/rank disagreed between screens.
 * Every surface must derive its XP from here. It sums the three real sources:
 *   stored accumulator (users.xp) + camera-session performance (xpGained)
 *   + reel-feedback performance (from AI feedback scores).
 */
export function getAccountXp({
  storedXp = 0,
  aiFeedbackDocs = [],
  trainingSessions,
  trainingSessionXp,
  streakDays = 0,
  likesReceived = 0,
}: AccountXpInput = {}): number {
  const stored = Math.max(0, Number(storedXp) || 0);
  // calculateUserXP is untyped JS (its param infers as never[]); call loosely.
  const reelPerformance: number = (calculateUserXP as (a: unknown) => number)({
    aiFeedbackDocs,
    streakDays,
    likesReceived,
  });
  const sessionXp =
    typeof trainingSessionXp === "number"
      ? Math.max(0, trainingSessionXp)
      : (trainingSessions || []).reduce((sum, s) => sum + (Number(s?.xpGained) || 0), 0);
  return stored + reelPerformance + sessionXp;
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
    belt: getBelt(xp),
    nextBelt: getNextBelt(xp),
    beltProgressPct: getBeltProgress(xp),
    rank: getFighterRank(xp),
    nextRank: getNextRank(xp),
    rankProgressPct: getRankProgress(xp),
  };
}
