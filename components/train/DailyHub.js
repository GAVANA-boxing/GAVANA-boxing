"use client";

// The Train start screen shows ONE card at most (owner feedback: too much text). Picked by
// priority — the most useful thing for today — instead of stacking every card:
//   1. come back (no round for 5+ days)  2. restart a lost streak  3. keep a streak at risk
//   4. beginner lesson  5. today's DNA focus  6. weak-area drill  7. DNA forming
// Mission / belt progress / weekly digest / DNA evolution live on Home and Progress.
import { isBeginnerUser, getCurrentBeginnerLesson, getBeginnerProgress } from "@/lib/beginnerPath";
import { getTodaysDNAMission } from "@/lib/dnaDailyMissions";

import DNAFreshnessWarning  from "./DNAFreshnessWarning";
import StreakRecoveryMission from "./StreakRecoveryMission";
import StreakRiskWarning     from "./StreakRiskWarning";
import DNASignalForming      from "./DNASignalForming";
import BeginnerPathCard       from "./BeginnerPathCard";
import DNADailyFocus          from "./DNADailyFocus";
import WeakDimensionDrill     from "./WeakDimensionDrill";
import { showRoute } from "@/lib/coreRoutes";

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
}) {
  const effectiveMissionDone = missionCompletedToday || missionJustCompleted;
  const isBeginner  = isBeginnerUser(totalSessionCount ?? 999);
  const nextLesson  = isBeginner ? getCurrentBeginnerLesson(totalSessionCount ?? 0) : null;
  const daysSince   = lastSessionSec ? Math.floor((Date.now() / 1000 - lastSessionSec) / 86400) : null;
  const showFreshness = daysSince != null && daysSince >= 5;
  const dnaMission  = userArchetype ? getTodaysDNAMission(userArchetype) : null;

  const candidates = [
    [showFreshness, () => <DNAFreshnessWarning daysSince={daysSince} locale={locale} />],
    [userStreak === 0 && totalSessionCount > 0 && !effectiveMissionDone,
      () => <StreakRecoveryMission locale={locale} wrappedHandleStart={wrappedHandleStart} />],
    [userStreak >= 3 && !effectiveMissionDone, () => <StreakRiskWarning locale={locale} userStreak={userStreak} />],
    [isBeginner && nextLesson && showRoute("/programs"), () => (
      <BeginnerPathCard
        locale={locale} t={t} nextLesson={nextLesson}
        beginnerProg={getBeginnerProgress(totalSessionCount ?? 0)} wrappedHandleStart={wrappedHandleStart}
      />
    )],
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
