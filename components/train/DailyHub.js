"use client";

import { isBeginnerUser, getCurrentBeginnerLesson, getBeginnerProgress } from "@/lib/beginnerPath";
import { getTodaysDNAMission } from "@/lib/dnaDailyMissions";
import { getFeaturedPackage, getPackageFighter } from "@/lib/experimentPackages";
import { getFighterRank, getNextRank, getRankProgress } from "@/lib/xp";

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
import { showRoute } from "@/lib/coreRoutes";

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
  // The same rank ladder as /progress (one XP, one ladder).
  const rank     = getFighterRank(currentXP);
  const belt     = { ...rank, gradient: `linear-gradient(90deg, ${rank.color}, #F5C451)` };
  const beltPct  = Math.round(getRankProgress(currentXP));
  const nextBelt = getNextRank(currentXP);

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

      {/* Academy, fighter studies and experiments are hidden in core mode. */}
      {isBeginner && nextLesson && showRoute("/programs") && (
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

      {featuredPkg && featuredFighter && showRoute("/fighters") && (
        <FeaturedExperiment
          locale={locale}
          pkg={featuredPkg}
          fighter={featuredFighter}
          router={router}
        />
      )}

      {currentExperiment && showRoute("/fighters") && (
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
