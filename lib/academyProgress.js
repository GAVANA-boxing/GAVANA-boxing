// Boxing Academy progress — pure rules (tests/academyProgress.test.js).
//
// A lesson is a guided Train round. What can honestly be recorded depends on the lesson:
//   • punch lessons (jab, cross, hook, double jab, body shot): the round score reflects the
//     punching the lesson teaches, so a lesson is done at ACADEMY_PASS_SCORE or better;
//   • defence / footwork lessons: the round score does not measure slipping, rolling or exits,
//     so a lesson is done when a valid round was completed with it — never "passed" by a score.
// A round the result screen calls "not enough data" records nothing.

export const ACADEMY_PASS_SCORE = 6.5;
export const ACADEMY_MIN_PUNCHES = 5;

/** Lessons whose skill the round score really reflects. */
export const SCORED_LESSONS = new Set(["jab-mechanics", "cross-mechanics", "hook-mechanics", "double-jab", "body-shot"]);

export function isScoredLesson(lessonId) {
  return SCORED_LESSONS.has(lessonId);
}

/** What one round means for a lesson. → { valid, done, scored } */
export function lessonRoundResult(lessonId, { score, punches } = {}) {
  const s = Number(score);
  const valid = Number.isFinite(s) && s > 0 && (Number(punches) || 0) >= ACADEMY_MIN_PUNCHES;
  const scored = isScoredLesson(lessonId);
  return { valid, scored, done: valid && (!scored || s >= ACADEMY_PASS_SCORE) };
}

/**
 * The stored entry for a lesson after a round, or null when the round records nothing.
 * `completed` never goes back to false; bestScore only grows.
 */
export function nextLessonEntry(prev, lessonId, { score, punches, dateKey } = {}) {
  const r = lessonRoundResult(lessonId, { score, punches });
  if (!r.valid) return null;
  const p = prev && typeof prev === "object" ? prev : {};
  return {
    attempted: true,
    completed: Boolean(p.completed) || r.done,
    bestScore: Math.max(Number(p.bestScore) || 0, Number(score) || 0),
    lastTrained: dateKey || p.lastTrained || null,
  };
}

/** → { total, done, next, nextIndex } — `next` is the first lesson not done yet (null when all are). */
export function academySummary(lessons, lessonProgress) {
  const list = Array.isArray(lessons) ? lessons : [];
  const lp = lessonProgress && typeof lessonProgress === "object" ? lessonProgress : {};
  const done = list.filter((l) => lp[l.id]?.completed).length;
  const nextIndex = list.findIndex((l) => !lp[l.id]?.completed);
  return { total: list.length, done, next: nextIndex >= 0 ? list[nextIndex] : null, nextIndex };
}
