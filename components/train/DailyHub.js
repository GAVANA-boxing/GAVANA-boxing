"use client";

import { isBeginnerUser, getCurrentBeginnerLesson, getBeginnerProgress } from "@/lib/beginnerPath";
import { getTodaysDNAMission } from "@/lib/dnaDailyMissions";
import { getFeaturedPackage, getPackageFighter } from "@/lib/experimentPackages";
import { getBelt, getBeltProgress, getNextBelt } from "@/lib/belts";

import DNAFreshnessWarning  from "./DNAFreshnessWarning";
import StreakRecoveryMission from "./StreakRecoveryMission";
import StreakRiskWarning     from "./StreakRiskWarning";
import DNASignalForming      from "./DNASignalForming";
import WeeklyDNADigest       from "./WeeklyDNADigest";
import MissionStreakBeltCard  from "./MissionStreakBeltCard";
import BeginnerPathCard       from "./BeginnerPathCard";
import DNADailyFocus          from "./DNADailyFocus";
import DNAEvolutionProgress   from "./DNAEvolutionProgress";
import WeakDimensionDrill     from "./WeakDimensionDrill";
import FeaturedExperiment     from "./FeaturedExperiment";
import ExperimentModeWidget   from "./ExperimentModeWidget";

export default function DailyHub({
  locale,
  t,
  router,
  totalSessionCount,
  currentXP,
  userStreak,
  bestDailyStreak,
  userArchetype,
  weeklySessionCount,
  weeklyBestScore,
  lastSessionSec,
  missionCompletedToday,
  missionJustCompleted,
  currentExperiment,
  experimentSessionCount,
  wrappedHandleStart,
}) {
  const effectiveMissionDone = missionCompletedToday || missionJustCompleted;
  const isBeginner  = isBeginnerUser(totalSessionCount ?? 999);
  const nextLesson  = isBeginner ? getCurrentBeginnerLesson(totalSessionCount ?? 0) : null;
  const beginnerProg = isBeginner ? getBeginnerProgress(totalSessionCount ?? 0) : null;
  const belt     = getBelt(currentXP);
  const beltPct  = getBeltProgress(currentXP);
  const nextBelt = getNextBelt(currentXP);

  // Freshness
  const daysSince     = lastSessionSec ? Math.floor((Date.now() / 1000 - lastSessionSec) / 86400) : null;
  const showFreshness = daysSince != null && daysSince >= 5;

  // Weekly digest
  const showDigest = weeklySessionCount >= 1 && weeklyBestScore != null;

  // DNA mission
  const dnaMission = userArchetype ? getTodaysDNAMission(userArchetype) : null;

  // Featured experiment
  const featuredPkg     = !currentExperiment && userArchetype ? getFeaturedPackage() : null;
  const featuredFighter = featuredPkg ? getPackageFighter(featuredPkg) : null;

  return (
    <div style={{ margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>

      {showFreshness && (
        <DNAFreshnessWarning daysSince={daysSince} locale={locale} />
      )}

      {!showFreshness && userStreak === 0 && totalSessionCount > 0 && !effectiveMissionDone && (
        <StreakRecoveryMission locale={locale} wrappedHandleStart={wrappedHandleStart} />
      )}

      {!showFreshness && userStreak >= 3 && !effectiveMissionDone && (
        <StreakRiskWarning locale={locale} userStreak={userStreak} />
      )}

      {totalSessionCount >= 1 && totalSessionCount < 3 && !userArchetype && (
        <DNASignalForming locale={locale} totalSessionCount={totalSessionCount} router={router} />
      )}

      {!showFreshness && showDigest && (
        <WeeklyDNADigest
          locale={locale}
          weeklySessionCount={weeklySessionCount}
          weeklyBestScore={weeklyBestScore}
          userArchetype={userArchetype}
        />
      )}

      <MissionStreakBeltCard
        locale={locale}
        t={t}
        effectiveMissionDone={effectiveMissionDone}
        userStreak={userStreak}
        bestDailyStreak={bestDailyStreak}
        belt={belt}
        beltPct={beltPct}
        nextBelt={nextBelt}
      />

      {isBeginner && nextLesson && (
        <BeginnerPathCard
          locale={locale}
          t={t}
          nextLesson={nextLesson}
          beginnerProg={beginnerProg}
          wrappedHandleStart={wrappedHandleStart}
        />
      )}

      {userArchetype && dnaMission && (
        <DNADailyFocus
          locale={locale}
          mission={dnaMission}
          userArchetype={userArchetype}
          wrappedHandleStart={wrappedHandleStart}
        />
      )}

      {userArchetype && weeklySessionCount >= 1 && (
        <DNAEvolutionProgress
          locale={locale}
          userArchetype={userArchetype}
          totalSessionCount={totalSessionCount}
          router={router}
        />
      )}

      {userArchetype && !isBeginner && (
        <WeakDimensionDrill
          locale={locale}
          userArchetype={userArchetype}
          wrappedHandleStart={wrappedHandleStart}
        />
      )}

      {featuredPkg && featuredFighter && (
        <FeaturedExperiment
          locale={locale}
          pkg={featuredPkg}
          fighter={featuredFighter}
          router={router}
        />
      )}

      {currentExperiment && (
        <ExperimentModeWidget
          locale={locale}
          t={t}
          currentExperiment={currentExperiment}
          experimentSessionCount={experimentSessionCount}
          router={router}
        />
      )}

    </div>
  );
}
