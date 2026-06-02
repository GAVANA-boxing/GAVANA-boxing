// Beginner boxing path — 6 foundational lessons in order
// status is derived, not stored — computed from session count + completed lesson IDs

export const BEGINNER_PATH = [
  {
    id: "guard-basics",
    lessonId: "guard-recovery",   // links to ACADEMY_LESSONS
    titleKey: "beginnerGuardTitle",
    descKey: "beginnerGuardDesc",
    skill: "defense",
    estimatedMinutes: 5,
  },
  {
    id: "stance-basics",
    lessonId: null,               // no dedicated academy lesson yet
    titleKey: "beginnerStanceTitle",
    descKey: "beginnerStanceDesc",
    skill: "footwork",
    estimatedMinutes: 5,
  },
  {
    id: "jab-mechanics",
    lessonId: "jab-mechanics",
    titleKey: "beginnerJabTitle",
    descKey: "beginnerJabDesc",
    skill: "technique",
    estimatedMinutes: 7,
  },
  {
    id: "cross-mechanics",
    lessonId: "cross-mechanics",
    titleKey: "beginnerCrossTitle",
    descKey: "beginnerCrossDesc",
    skill: "technique",
    estimatedMinutes: 7,
  },
  {
    id: "footwork-basics",
    lessonId: "footwork-angle-exit",
    titleKey: "beginnerFootworkTitle",
    descKey: "beginnerFootworkDesc",
    skill: "footwork",
    estimatedMinutes: 6,
  },
  {
    id: "defense-basics",
    lessonId: "slip-defense",
    titleKey: "beginnerDefenseTitle",
    descKey: "beginnerDefenseDesc",
    skill: "defense",
    estimatedMinutes: 6,
  },
];

// Determine current lesson: first lesson without a completed sessionCount checkpoint
export function getBeginnerPathStatus(totalSessionCount) {
  // Unlock one lesson per 2 sessions (roughly), starting from session 0
  const unlockedCount = Math.min(BEGINNER_PATH.length, Math.floor(totalSessionCount / 2) + 1);
  return BEGINNER_PATH.map((lesson, i) => {
    if (i < unlockedCount - 1) return { ...lesson, status: "completed" };
    if (i === unlockedCount - 1) return { ...lesson, status: "current" };
    return { ...lesson, status: "locked" };
  });
}

export function getCurrentBeginnerLesson(totalSessionCount) {
  const path = getBeginnerPathStatus(totalSessionCount);
  return path.find((l) => l.status === "current") || null;
}

export function isBeginnerUser(totalSessionCount) {
  return totalSessionCount < 5;
}

export function getBeginnerProgress(totalSessionCount) {
  const completed = Math.min(BEGINNER_PATH.length, Math.floor(totalSessionCount / 2));
  return { completed, total: BEGINNER_PATH.length };
}
