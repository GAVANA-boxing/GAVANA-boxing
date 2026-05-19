"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import DailyMission from "@/components/DailyMission";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { usePvpResult } from "@/hooks/usePvpResult";
import { useTrainingActions } from "@/hooks/useTrainingActions";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/train/trainStyles";
import TrainResultModal from "@/components/train/TrainResultModal";
import PreGameCard from "@/components/train/PreGameCard";
import RecordingHud from "@/components/train/RecordingHud";
import { useTrainingData } from "@/hooks/useTrainingData";
import { useCameraSession } from "@/hooks/useCameraSession";

const RECORD_SECONDS = 10;
const CHALLENGES = {
  "jab-minute": { titleKey: "challengeJabTitle", seconds: 60 },
  "speed-test": { titleKey: "challengeSpeedTitle", seconds: 20 },
  "combo-master": { titleKey: "challengeComboTitle", seconds: 30 },
};

export default function TrainPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const { user, loading: authLoading } = useAuth();

  const {
    reelId, challengeId, trainSource, trainSourceUserId,
    challengeUserId, creatorBestScore, targetScore,
    currentXP, sessionHistory, weeklySessionCount, userStreak,
    opponentUsername, ghostBestScore, setGhostBestScore, ghostBestScoreRef,
  } = useTrainingData({ user });

  const activeChallenge = challengeId ? CHALLENGES[challengeId] : null;
  const sessionSeconds = activeChallenge?.seconds || RECORD_SECONDS;
  const activeChallengeName = activeChallenge ? t(activeChallenge.titleKey) : "";

  const pvpSavedRef = useRef(false);
  const resetForNewSessionRef = useRef(null);
  const setPvpResultRef = useRef(null);
  const setPvpSavedRef = useRef(null);

  const {
    videoRef,
    streamRef,
    recorderRef,
    chunksRef,
    cameraState, setCameraState,
    cameraRetryKey, setCameraRetryKey,
    phase,
    countdown,
    secondsLeft,
    result, setResult,
    error, setError,
    comboCount,
    hitCount,
    liveScore,
    isFlashing,
    liveFeedback,
    showGo,
    ghostScore,
    ghostEnabled, setGhostEnabled,
    handleStart,
    handleTryAgain,
    finishRecording,
  } = useCameraSession({
    sessionSeconds,
    currentXP,
    resetForNewSession: (...args) => resetForNewSessionRef.current?.(...args),
    ghostBestScoreRef,
    setPvpResult: (...args) => setPvpResultRef.current?.(...args),
    setPvpSaved: (...args) => setPvpSavedRef.current?.(...args),
    pvpSavedRef,
    t,
  });

  const {
    saving, saved, savedAttemptNumber,
    challengeSaving, challengeSaved, challengeSavedRef,
    missionJustCompleted, missionStreakBonus, missionNewStreak,
    rankUpInfo,
    handleSave, handleSaveChallengeResult,
    handleShareChallenge, handleChallengeFriend, handleShareTraining,
    resetForNewSession,
  } = useTrainingActions({
    user, locale, result, reelId, challengeId,
    activeChallenge, activeChallengeName,
    creatorBestScore, trainSourceUserId, currentXP,
    t, router, setError,
  });

  const { pvpResult, pvpSaved, setPvpResult, setPvpSaved } = usePvpResult({
    result, challengeUserId, targetScore, user, reelId, opponentUsername, locale, pvpSavedRef,
  });

  useLayoutEffect(() => {
    resetForNewSessionRef.current = resetForNewSession;
    setPvpResultRef.current = setPvpResult;
    setPvpSavedRef.current = setPvpSaved;
  });

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(`/${locale}/reels`);
  };

  const goToReels = () => {
    if (reelId) {
      const params = new URLSearchParams({ reelId });
      if (trainSource === "profile" && trainSourceUserId) {
        params.set("source", "profile");
        params.set("userId", trainSourceUserId);
      }
      router.push(`/${locale}/reels?${params.toString()}`);
      return;
    }
    router.push(`/${locale}/reels`);
  };

  const goToChallenges = () => {
    router.push(`/${locale}/challenges`);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [authLoading, user, router, locale]);

  if (authLoading) {
    return <div style={styles.loading}>{t("loading")}</div>;
  }

  if (!user) return null;

  const isCountingDown = phase === "countdown";
  const isRecording = phase === "recording";
  const canStart = phase === "idle" || phase === "result";

  return (
    <main style={styles.page}>
      <button type="button" style={styles.backButton} onClick={goBack} aria-label="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <section style={styles.shell}>
        <header style={styles.header}>
          <p style={styles.kicker}>
            {challengeUserId ? t("pvpChallengeMode") : activeChallenge ? t("challengeMode") : t("trainKicker")}
          </p>
          <h1 style={styles.title}>{activeChallenge ? t(activeChallenge.titleKey) : t("trainTitle")}</h1>
          <p style={styles.subtitle}>{t("trainSubtitle")}</p>
          {challengeUserId && targetScore && (
            <div style={styles.pvpBanner}>
              <span style={styles.pvpBannerVs}>🆚</span>
              <div style={styles.pvpBannerText}>
                <span style={styles.pvpBannerLabel}>
                  {t("pvpBeatScoreOf").replace("{username}", opponentUsername || "...")}
                </span>
                <span style={styles.pvpBannerScore}>{targetScore.toFixed(1)}/10</span>
              </div>
            </div>
          )}
          {!challengeUserId && activeChallenge && targetScore && (
            <div style={styles.targetScorePill}>
              <span style={styles.targetScoreLabel}>{t("challengeBeatScore").replace("{score}", targetScore.toFixed(1))}</span>
            </div>
          )}
        </header>

        <div style={styles.stage}>
          {cameraState === "ready" ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={styles.preview}
            />
          ) : (
            <div style={styles.fallback}>
              {cameraState === "checking" ? (
                <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.15)", borderTopColor: RED, borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 12 }} />
              ) : (
                <div style={styles.fallbackMark}>REC</div>
              )}
              <p style={styles.fallbackTitle}>
                {cameraState === "checking" ? t("trainCameraChecking") : t("trainCameraUnavailable")}
              </p>
              <p style={styles.fallbackText}>
                {cameraState === "denied" ? t("trainCameraDenied") : t("trainCameraFallback")}
              </p>
              {cameraState === "denied" && (
                <button
                  type="button"
                  onClick={() => setCameraRetryKey((k) => k + 1)}
                  style={{ marginTop: 12, padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                >
                  {t("trainRetryCam")}
                </button>
              )}
            </div>
          )}

          <div style={styles.stageShade} />

          {/* Hit flash overlay — quick red burst on each simulated punch */}
          {isFlashing && <div style={styles.flashOverlay} />}

          {/* Countdown with scale-pop animation */}
          {isCountingDown && (
            <div
              key={showGo ? "go" : String(countdown)}
              style={{ ...styles.countdown, ...(showGo ? styles.countdownGo : {}) }}
              className="countdown-pop"
            >
              {showGo ? "GO!" : countdown}
            </div>
          )}

          {isRecording && (
            <RecordingHud
              hitCount={hitCount}
              secondsLeft={secondsLeft}
              totalSeconds={sessionSeconds}
              comboCount={comboCount}
              challengeUserId={challengeUserId}
              targetScore={targetScore}
              liveScore={liveScore}
              ghostBestScore={ghostBestScore}
              ghostEnabled={ghostEnabled}
              ghostScore={ghostScore}
              liveFeedback={liveFeedback}
              t={t}
            />
          )}
        </div>

        <PreGameCard
          phase={phase}
          challengeUserId={challengeUserId}
          weeklySessionCount={weeklySessionCount}
          userStreak={userStreak}
          ghostBestScore={ghostBestScore}
          sessionHistory={sessionHistory}
          targetScore={targetScore}
          opponentUsername={opponentUsername}
          ghostEnabled={ghostEnabled}
          reelId={reelId}
          locale={locale}
          t={t}
        />

        {error && <div style={styles.error}>{error}</div>}
        {saved && (
          <div style={styles.saved}>
            {savedAttemptNumber
              ? t("trainAttemptSaved").replace("{n}", savedAttemptNumber)
              : t("trainSaved")}
          </div>
        )}
        {challengeSaved && <div style={styles.saved}>{t("challengeResultSaved")}</div>}

        <div style={styles.controls}>
          {canStart && (
            <button type="button" style={styles.startButton} onClick={handleStart}>
              {t("trainStart")}
            </button>
          )}

          {isRecording && (
            <button type="button" style={styles.stopButton} onClick={finishRecording}>
              {t("trainStop")}
            </button>
          )}

          {!challengeUserId && !challengeId && ghostBestScore !== null && !isRecording && !isCountingDown && (
            <button
              type="button"
              style={ghostEnabled ? styles.ghostToggleOn : styles.ghostToggleOff}
              onClick={() => setGhostEnabled(g => !g)}
            >
              {ghostEnabled ? t("ghostModeOn") : t("ghostModeOff")}
            </button>
          )}
        </div>
      </section>

      <TrainResultModal
        result={result}
        activeChallenge={activeChallenge}
        challengeUserId={challengeUserId}
        challengeSaving={challengeSaving}
        challengeSaved={challengeSaved}
        rankUpInfo={rankUpInfo}
        sessionHistory={sessionHistory}
        ghostBestScore={ghostBestScore}
        pvpResult={pvpResult}
        opponentUsername={opponentUsername}
        targetScore={targetScore}
        reelId={reelId}
        missionJustCompleted={missionJustCompleted}
        missionStreakBonus={missionStreakBonus}
        missionNewStreak={missionNewStreak}
        error={error}
        saving={saving}
        saved={saved}
        savedAttemptNumber={savedAttemptNumber}
        locale={locale}
        t={t}
        router={router}
        onTryAgain={handleTryAgain}
        onSave={handleSave}
        onSaveChallengeResult={handleSaveChallengeResult}
        onShareChallenge={handleShareChallenge}
        onShareTraining={handleShareTraining}
      />
      <DailyMission locale={locale} />
      <BottomNav router={router} user={user} currentLocale={locale} activeTab="reels" />

    </main>
  );
}
