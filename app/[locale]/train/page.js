"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { FIGHTERS } from "@/lib/fighters";
import { FIGHTER_TECHNIQUES } from "@/lib/fighterTechniques";
import TrainingFocusCard from "@/components/train/TrainingFocusCard";
import { getDrillConfig } from "@/lib/drillConfig";
import { buildCoachSnapshot, buildCoachContext } from "@/lib/buildCoachContext";
import MilestoneCelebration from "@/components/MilestoneCelebration";
import { usePoseDetection } from "@/hooks/usePoseDetection";
import dynamic from "next/dynamic";
const PoseDebugOverlay = dynamic(() => import("@/components/train/PoseDebugOverlay"), { ssr: false });

// titleKey only — duration/target now live in drillConfig
const CHALLENGES = {
  "jab-minute":  { titleKey: "challengeJabTitle" },
  "speed-test":  { titleKey: "challengeSpeedTitle" },
  "combo-master": { titleKey: "challengeComboTitle" },
};

export default function TrainPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const { user, loading: authLoading } = useAuth();

  const [debugEnabled, setDebugEnabled] = useState(false);
  useEffect(() => {
    setDebugEnabled(new URLSearchParams(window.location.search).get("debug") === "1");
  }, []);

  const {
    reelId, drillId, challengeId, trainSource, trainSourceUserId,
    challengeUserId, creatorBestScore, targetScore,
    currentXP, sessionHistory, weeklySessionCount, userStreak,
    opponentUsername, ghostBestScore, setGhostBestScore, ghostBestScoreRef,
  } = useTrainingData({ user });

  const activeChallenge = challengeId ? CHALLENGES[challengeId] : null;
  const activeChallengeName = activeChallenge ? t(activeChallenge.titleKey) : "";

  // Drill config: challenge > standalone drill > default
  const drillConfig = getDrillConfig(challengeId || drillId || "default");

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
    lastPunchType,
    ghostScore,
    ghostEnabled, setGhostEnabled,
    movementEvents,
    sessionStartTime,
    handleStart,
    handleTryAgain,
    finishRecording,
  } = useCameraSession({
    drillConfig,
    currentXP,
    resetForNewSession: (...args) => resetForNewSessionRef.current?.(...args),
    ghostBestScoreRef,
    setPvpResult: (...args) => setPvpResultRef.current?.(...args),
    setPvpSaved: (...args) => setPvpSavedRef.current?.(...args),
    pvpSavedRef,
    t,
  });

  const { computeSessionSummary, getDebugInfo } = usePoseDetection({
    videoRef,
    isActive: phase === "recording",
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
    user, locale, result, reelId, drillId, drillConfig, challengeId,
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

  // ── Post-session AI debrief ───────────────────────────────────────────────
  const [debrief, setDebrief]             = useState(null);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [focusTip, setFocusTip] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  const [poseSessionSummary, setPoseSessionSummary] = useState(null);
  const [prevPoseMetrics, setPrevPoseMetrics] = useState(null);
  const [positionCue, setPositionCue] = useState(null);
  const coachSnapshotRef = useRef(null);
  const prevSessionCountRef = useRef(null);

  // Fetch training sessions once → build coach snapshot + grab last session's pose metrics
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getDocs(query(
          collection(db, "training_sessions"),
          where("userId", "==", user.uid)
        ));
        if (!active) return;
        const sessions = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => d.type === "training" && d.score != null)
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        const snapshot = buildCoachSnapshot({ sessions, profileData: {} });
        coachSnapshotRef.current = snapshot;
        prevSessionCountRef.current = sessions.length;
        // Most recent past session's pose metrics for comparison
        if (sessions[0]?.poseMetrics) setPrevPoseMetrics(sessions[0].poseMetrics);
        if (snapshot && sessions.length >= 3) {
          const weakAreas = Object.entries(snapshot.radarStats).sort(([, a], [, b]) => a - b);
          const miniSnap = { weakAreas, radarStats: snapshot.radarStats };
          const top = FIGHTERS
            .map((f) => ({ fighter: f, connection: getPersonalConnection(miniSnap, f) }))
            .filter((x) => x.connection?.isDirectlyRelevant)
            .sort((a, b) => (b.connection?.relevantWeak?.length || 0) - (a.connection?.relevantWeak?.length || 0))[0];
          if (top && active) setFocusTip({ fighter: top.fighter, connection: top.connection });
        }
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [user?.uid]);

  // Generate debrief when result appears; compute pose summary at the same time
  useEffect(() => {
    if (!result?.score) { setDebrief(null); setPoseSessionSummary(null); return; }

    // Capture pose summary synchronously before any async work
    const poseSummary = computeSessionSummary();
    setPoseSessionSummary(poseSummary);

    setDebrief(null);
    setDebriefLoading(true);
    let active = true;
    (async () => {
      try {
        const snapshot = coachSnapshotRef.current;
        const ctx = buildCoachContext({ snapshot, profileData: {}, locale });
        const prev = sessionHistory.slice(0, 5);
        const prevStr = prev.length
          ? `Previous scores: ${prev.map(s => s.toFixed(1)).join(", ")}.`
          : "";

        // Pose context for richer debrief
        let poseStr = "";
        if (poseSummary) {
          const issues = Object.entries(poseSummary)
            .filter(([k, v]) => v && typeof v === "object" && v.status && v.status !== "good")
            .map(([, v]) => v.cue)
            .slice(0, 2);
          if (issues.length) poseStr = ` Pose issues detected: ${issues.join("; ")}.`;
        }

        const { auth } = await import("@/lib/firebase");
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            messages: [{
              role: "user",
              content: `Session complete. Score: ${result.score.toFixed(1)}/10. ${prevStr}${poseStr} Give a 2-3 sentence debrief: what performed well, what to improve, one specific drill.`,
            }],
            persona: "analyst",
            locale,
            coachContext: ctx,
          }),
        });
        const data = await res.json();
        const text = data.content?.[0]?.text || data.message || null;
        if (active) setDebrief(text);
      } catch { /* silent — debrief is optional */ } finally {
        if (active) setDebriefLoading(false);
      }
    })();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.score]);

  // ── Setup cue: poll during recording to detect camera framing issues ──
  useEffect(() => {
    if (phase !== "recording") { setPositionCue(null); return; }
    const id = setInterval(() => {
      const info = getDebugInfo();
      if (info.status !== "ready" || !info.landmarksDetected) { setPositionCue(null); return; }
      const q = info.cameraQuality;
      if (q === "too_close") {
        setPositionCue("Too close — step back so full torso is visible");
      } else if (q === "upper_body_only") {
        setPositionCue("Step back — hips and feet must be visible for full analysis");
      } else if (q === "upper_body_hips") {
        setPositionCue("Feet not visible — step back for stance and balance analysis");
      } else {
        setPositionCue(null);
      }
    }, 1200);
    return () => { clearInterval(id); setPositionCue(null); };
  }, [phase, getDebugInfo]);

  // ── Badge celebration after session save ─────────────────────────────────
  useEffect(() => {
    if (!saved || !savedAttemptNumber) return;
    const { computeEarnedBadges, ACHIEVEMENT_BADGES } = require("@/lib/badges");
    const snap = coachSnapshotRef.current;
    const radarStats = snap?.radarStats || {};
    const before = computeEarnedBadges({ sessionCount: savedAttemptNumber - 1, bestScore: snap?.bestScore || 0, streakDays: snap?.streakDays || 0, studiedCount: 0, totalFighters: 10, radarStats });
    const after  = computeEarnedBadges({ sessionCount: savedAttemptNumber,     bestScore: Math.max(snap?.bestScore || 0, result?.score || 0), streakDays: snap?.streakDays || 0, studiedCount: 0, totalFighters: 10, radarStats });
    const earned = after.filter((id) => !before.includes(id));
    if (earned.length > 0) {
      const meta = ACHIEVEMENT_BADGES.filter((b) => earned.includes(b.id));
      setNewBadges(meta);
      const timer = setTimeout(() => setNewBadges([]), 5000);
      return () => clearTimeout(timer);
    }
  }, [saved, savedAttemptNumber]);

  // ── Lesson context from query params ─────────────────────────────────────
  const [lessonContext, setLessonContext] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fighterId = params.get("fighter");
    const lessonSlug = params.get("lesson");
    if (!fighterId || !lessonSlug) return;
    const fighter = FIGHTERS.find(f => f.id === fighterId);
    const lessons = FIGHTER_TECHNIQUES[fighterId] || [];
    const lesson = lessons.find(l =>
      l.title.toLowerCase().replace(/\s+/g, "-") === lessonSlug
    );
    if (fighter && lesson) setLessonContext({ fighter, lesson });
  }, []);

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

        {/* Training Focus — shown when arriving from a fighter technique lesson */}
        {lessonContext && canStart && (
          <TrainingFocusCard
            fighterName={lessonContext.fighter.name}
            lesson={lessonContext.lesson}
            accent={lessonContext.fighter.accent}
            onStart={handleStart}
          />
        )}

        {/* Pre-session personalized focus tip */}
        {focusTip && canStart && !lessonContext && !challengeUserId && !challengeId && (() => {
          const { fighter, connection } = focusTip;
          const acc = fighter.accent;
          const drill = connection.focusDrills?.[0] || connection.focusStudy?.[0];
          return (
            <div style={{
              margin: "0 0 14px",
              padding: "11px 14px",
              borderRadius: 14,
              background: `linear-gradient(135deg, ${acc}10 0%, rgba(0,0,0,0) 100%)`,
              border: `1px solid ${acc}28`,
              borderLeft: `3px solid ${acc}`,
            }}>
              <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 7 }}>
                {locale === "mn" ? "⚡ Өнөөдрийн анхаарал" : "⚡ Today's Focus"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: drill ? 8 : 0 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 900, color: "#fff" }}>{fighter.name}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginLeft: 8 }}>
                    {connection.primaryFocus} · {connection.primaryValue?.toFixed(1)}/10
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/fighters/${fighter.id}`)}
                  style={{ background: `${acc}18`, border: `1px solid ${acc}40`, borderRadius: 8, padding: "5px 11px", color: acc, fontSize: 10.5, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}
                >
                  {locale === "mn" ? "Судлах" : "Study"}
                </button>
              </div>
              {drill && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.4, paddingLeft: 2 }}>
                  <svg width="8" height="10" viewBox="0 0 13 16" fill={acc} style={{ marginRight: 5, verticalAlign: "middle" }}>
                    <path d="M7 0L0 9h6l-1 7 7-9H6L7 0z"/>
                  </svg>
                  {drill}
                </div>
              )}
            </div>
          );
        })()}

        <div style={styles.stage} className="train-stage">
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
              totalSeconds={drillConfig.durationSeconds}
              drillConfig={drillConfig}
              comboCount={comboCount}
              challengeUserId={challengeUserId}
              targetScore={targetScore}
              liveScore={liveScore}
              ghostBestScore={ghostBestScore}
              ghostEnabled={ghostEnabled}
              ghostScore={ghostScore}
              liveFeedback={liveFeedback}
              movementEvents={movementEvents}
              sessionStartTime={sessionStartTime}
              t={t}
            />
          )}

          {/* Pose debug overlay — enabled via ?debug=1 query param */}
          <PoseDebugOverlay getDebugInfo={getDebugInfo} isActive={phase === "recording"} debugEnabled={debugEnabled} />

          {/* Position cue — shown when lower body not in frame during recording */}
          {positionCue && (
            <div style={{
              position: "absolute", bottom: 56, left: 0, right: 0,
              display: "flex", justifyContent: "center", pointerEvents: "none",
            }}>
              <div style={{
                background: "rgba(245,196,81,0.13)",
                border: "1px solid rgba(245,196,81,0.45)",
                borderRadius: 20, padding: "5px 16px",
                fontSize: 11.5, fontWeight: 800,
                color: "rgba(245,196,81,0.95)",
                letterSpacing: 0.2,
              }}>
                {positionCue}
              </div>
            </div>
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
          focusTip={focusTip}
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
            <button type="button" style={styles.startButton} className="train-start-btn tap-bounce" onClick={handleStart}>
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
        debrief={debrief}
        debriefLoading={debriefLoading}
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
        movementEvents={movementEvents}
        sessionStartTime={sessionStartTime}
        poseMetrics={poseSessionSummary}
        prevPoseMetrics={prevPoseMetrics}
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

      {/* Milestone celebration (15B) */}
      {saved && savedAttemptNumber && (
        <MilestoneCelebration
          sessionCount={savedAttemptNumber}
          userId={user?.uid}
          locale={locale}
        />
      )}

      {/* Badge celebration toast */}
      {newBadges.map((badge, i) => (
        <div key={badge.id} style={{
          position: "fixed", bottom: `calc(${100 + i * 70}px + env(safe-area-inset-bottom))`,
          left: "50%", transform: "translateX(-50%)",
          zIndex: 9000, pointerEvents: "none",
          display: "flex", alignItems: "center", gap: 10,
          padding: "11px 18px", borderRadius: 20,
          background: "rgba(12,12,14,0.95)",
          border: `1px solid ${badge.tier === "gold" ? GOLD : badge.tier === "silver" ? "#A8A9AD" : "#CD7F32"}40`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.6)`,
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          whiteSpace: "nowrap",
        }}>
          <span style={{ fontSize: 22 }}>{badge.icon}</span>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: badge.tier === "gold" ? GOLD : badge.tier === "silver" ? "#A8A9AD" : "#CD7F32", letterSpacing: 1.5, textTransform: "uppercase" }}>
              {locale === "mn" ? "Шинэ badge!" : "Badge Unlocked!"}
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{badge.name}</div>
          </div>
        </div>
      ))}

    </main>
  );
}
