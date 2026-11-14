"use client";

// The Train start screen shows ONE card at most (owner feedback: too much text). Picked by
// priority — the most useful thing for today — instead of stacking every card:
//   1. come back (no round for 5+ days)  2. restart a lost streak  3. keep a streak at risk
//   4. next Academy lesson (beginners)  5. today's DNA focus  6. weak-area drill  7. DNA forming
// Mission / belt progress / weekly digest / DNA evolution live on Home and Progress.
import { isBeginnerUser } from "@/lib/beginnerPath";
import { ACADEMY_LESSONS } from "@/lib/academyLessons";
import { academySummary } from "@/lib/academyProgress";
import { getTodaysDNAMission } from "@/lib/dnaDailyMissions";

import DNAFreshnessWarning  from "./DNAFreshnessWarning";
import StreakRecoveryMission from "./StreakRecoveryMission";
import StreakRiskWarning     from "./StreakRiskWarning";
import DNASignalForming      from "./DNASignalForming";
import AcademyNextCard        from "./AcademyNextCard";
import DNADailyFocus          from "./DNADailyFocus";
import WeakDimensionDrill     from "./WeakDimensionDrill";

export default function DailyHub({
  locale,
  t,
  router,
  totalSessionCount,
  userStreak,
  userArchetype,
  lastSessionSec,
  missionCompletedToday,
  missionJustCompleted,
  wrappedHandleStart,
  academyProgress = null,
}) {
  const effectiveMissionDone = missionCompletedToday || missionJustCompleted;
  const isBeginner  = isBeginnerUser(totalSessionCount ?? 999);
  // The beginner's next step is the real next Academy lesson (done lessons come from
  // users.academyProgress). It used to be a "lesson 3 of 6" counted from the number of rounds,
  // with a link to a hidden page.
  const academyNext = isBeginner ? academySummary(ACADEMY_LESSONS, academyProgress).next : null;
  const daysSince   = lastSessionSec ? Math.floor((Date.now() / 1000 - lastSessionSec) / 86400) : null;
  const showFreshness = daysSince != null && daysSince >= 5;
  const dnaMission  = userArchetype ? getTodaysDNAMission(userArchetype) : null;

  const candidates = [
    [showFreshness, () => <DNAFreshnessWarning daysSince={daysSince} locale={locale} />],
    [userStreak === 0 && totalSessionCount > 0 && !effectiveMissionDone,
      () => <StreakRecoveryMission locale={locale} wrappedHandleStart={wrappedHandleStart} />],
    [userStreak >= 3 && !effectiveMissionDone, () => <StreakRiskWarning locale={locale} userStreak={userStreak} />],
    [isBeginner && academyNext, () => <AcademyNextCard lessonProgress={academyProgress} locale={locale} router={router} />],
    [userArchetype && dnaMission, () => (
      <DNADailyFocus locale={locale} mission={dnaMission} userArchetype={userArchetype} wrappedHandleStart={wrappedHandleStart} />
    )],
    [userArchetype && !isBeginner, () => (
      <WeakDimensionDrill locale={locale} userArchetype={userArchetype} wrappedHandleStart={wrappedHandleStart} />
    )],
    [totalSessionCount >= 1 && totalSessionCount < 3 && !userArchetype,
      () => <DNASignalForming locale={locale} totalSessionCount={totalSessionCount} router={router} />],
  ];
  const pick = candidates.find(([show]) => show);
  if (!pick) return null;

  return (
    <div style={{ margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>
      {pick[1]()}
    </div>
  );
}
