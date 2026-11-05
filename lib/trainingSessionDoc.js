// Builds the training_sessions document for a finished session. Shared by the
// normal save (hooks/useTrainingActions) and the guest-session claim
// (lib/guestSession) so both write exactly the same shape.
//
// Pure: no Firestore, no clock. The caller adds createdAt. xpGained is never
// included — the server stamps the authoritative value (rules forbid clients
// from setting it, since getAccountXp sums it).

import { getSessionIdentity, buildMovementCounts, buildMovementMetrics } from "@/lib/combatMemory";
import { generateTechniqueReview } from "@/lib/techniqueReview";

export function buildTrainingSessionDoc({
  uid,
  result,
  reelId = null,
  attemptNumber = 1,
  locale = "en",
  drillId = null,
  drillConfig = null,
  tag = null,
  readiness = null,
  movementEvents = [],
  poseMetrics = null,
  source = "train_screen",
}) {
  const sessionIdentity = getSessionIdentity(result.score, movementEvents, poseMetrics);
  const movementCounts = buildMovementCounts(movementEvents);
  const movementMetrics = buildMovementMetrics(movementCounts);

  let techniqueReview = null;
  if (poseMetrics) {
    const rev = generateTechniqueReview({ poseMetrics, result, locale });
    if (!rev.lowData) {
      techniqueReview = {
        title: rev.title,
        priorityWeakness: rev.priorityWeakness,
        drill: rev.drill,
        coachTone: rev.coachTone,
        strengths: rev.strengths,
      };
    }
  }

  return {
    userId: uid,
    reelId,
    score: result.score,
    attemptNumber,
    rankProgress: result.rankProgress ?? null,
    breakdown: result.breakdown || null,
    hitCount: result.hitCount || 0,
    type: "training",
    locale,
    source,
    ...(tag ? { sessionTag: tag } : {}),
    ...(readiness?.energy ? { readiness } : {}),
    // Combat memory
    sessionIdentity,
    drillId: drillId || drillConfig?.id || "default",
    durationSeconds: drillConfig?.durationSeconds || 10,
    movementCounts,
    ...movementMetrics,
    // Pose metrics (null if MediaPipe unavailable)
    ...(poseMetrics ? { poseMetrics } : {}),
    ...(techniqueReview ? { techniqueReview } : {}),
  };
}
