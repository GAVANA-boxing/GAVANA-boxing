"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { addDoc, collection, doc, getDocs, query, runTransaction, serverTimestamp, where } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { calculateChallengeXP, calculateUserXP, getFighterRank, getRankProgress } from "@/lib/xp";

const RECORD_SECONDS = 10;
const CHALLENGES = {
  "jab-minute": { titleKey: "challengeJabTitle", seconds: 60 },
  "speed-test": { titleKey: "challengeSpeedTitle", seconds: 20 },
  "combo-master": { titleKey: "challengeComboTitle", seconds: 30 },
};

function makeTrainingResult(currentXP) {
  const score = Number((6.2 + Math.random() * 2.6).toFixed(1));
  const xpGained = Math.round(score * score * 8);
  return {
    score,
    xpGained,
    rankProgress: getRankProgress(currentXP + xpGained),
  };
}

function getChallengeRank(score) {
  if (score >= 9) return "S";
  if (score >= 8) return "A";
  if (score >= 7) return "B";
  if (score >= 6) return "C";
  return "D";
}

function getChallengeComparisonPercent(score) {
  return Math.min(99, Math.max(42, Math.round(score * 10 + 3)));
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPreviousLocalDateKey(date = new Date()) {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return getLocalDateKey(previous);
}

function getChallengeStreakBonus(streak) {
  if (streak === 14) return 300;
  if (streak === 7) return 150;
  if (streak === 3) return 50;
  return 0;
}

export default function TrainPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const { user, loading: authLoading } = useAuth();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const stopHandledRef = useRef(false);
  const challengeSavedRef = useRef(false);

  const [cameraState, setCameraState] = useState("checking");
  const [phase, setPhase] = useState("idle");
  const [countdown, setCountdown] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(RECORD_SECONDS);
  const [result, setResult] = useState(null);
  const [currentXP, setCurrentXP] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedAttemptNumber, setSavedAttemptNumber] = useState(null);
  const [reelId, setReelId] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const [targetScore, setTargetScore] = useState(null);
  const [challengeSaving, setChallengeSaving] = useState(false);
  const [challengeSaved, setChallengeSaved] = useState(false);
  const [error, setError] = useState("");

  // Live game state
  const [comboCount, setComboCount] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState(null);
  const [showGo, setShowGo] = useState(false);
  const isRecordingRef = useRef(false);
  const hitTimerRef = useRef(null);
  const hitCountRef = useRef(0);

  const activeChallenge = challengeId ? CHALLENGES[challengeId] : null;
  const sessionSeconds = activeChallenge?.seconds || RECORD_SECONDS;
  const activeChallengeName = activeChallenge ? t(activeChallenge.titleKey) : "";

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(`/${locale}/reels`);
  };

  const goToReels = () => {
    router.push(`/${locale}/reels`);
  };

  const goToChallenges = () => {
    router.push(`/${locale}/challenges`);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setReelId(params.get("reelId") || null);
    setChallengeId(params.get("challengeId") || null);
    const parsedTargetScore = Number(params.get("score") || params.get("targetScore"));
    setTargetScore(Number.isFinite(parsedTargetScore) && parsedTargetScore > 0 ? parsedTargetScore : null);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (!user?.uid) return;

    let active = true;

    async function loadCurrentXP() {
      try {
        const snap = await getDocs(query(collection(db, "ai_feedback"), where("userId", "==", user.uid)));
        const docs = snap.docs.map((doc) => ({
          score: doc.data().score,
          createdAt: doc.data().createdAt,
        }));

        if (active) {
          setCurrentXP(calculateUserXP({ aiFeedbackDocs: docs }));
        }
      } catch (err) {
        console.error("Failed to load training XP baseline:", err);
      }
    }

    loadCurrentXP();

    return () => {
      active = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState("unsupported");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setCameraState("ready");
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera permission error:", err);
        if (active) {
          setCameraState("denied");
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (cameraState === "ready" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraState]);

  const finishRecording = useCallback(() => {
    if (stopHandledRef.current) return;
    stopHandledRef.current = true;

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }

    isRecordingRef.current = false;
    if (hitTimerRef.current) window.clearTimeout(hitTimerRef.current);

    setSecondsLeft(0);
    setPhase("result");
    setResult({ ...makeTrainingResult(currentXP), hitCount: hitCountRef.current });
    setSaved(false);
    setSavedAttemptNumber(null);
  }, [currentXP]);

  useEffect(() => {
    if (phase !== "countdown" || countdown === null) return undefined;

    if (countdown <= 0) {
      setShowGo(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([60, 30, 60]);
      }
      setIsFlashing(true);
      const flashTimer = window.setTimeout(() => setIsFlashing(false), 300);

      const goTimer = window.setTimeout(() => {
        setShowGo(false);
        chunksRef.current = [];
        stopHandledRef.current = false;

        if (streamRef.current && window.MediaRecorder) {
          try {
            const recorder = new MediaRecorder(streamRef.current);
            recorder.ondataavailable = (event) => {
              if (event.data?.size) chunksRef.current.push(event.data);
            };
            recorder.start();
            recorderRef.current = recorder;
          } catch (err) {
            console.error("MediaRecorder start failed:", err);
          }
        }

        setSecondsLeft(sessionSeconds);
        setPhase("recording");
      }, 700);

      return () => {
        window.clearTimeout(flashTimer);
        window.clearTimeout(goTimer);
      };
    }

    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, countdown, sessionSeconds]);

  useEffect(() => {
    if (phase !== "recording") return undefined;

    if (secondsLeft <= 0) {
      finishRecording();
      return undefined;
    }

    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, secondsLeft, finishRecording]);

  // Hit simulation — fires during recording only
  useEffect(() => {
    if (phase !== "recording") {
      isRecordingRef.current = false;
      if (hitTimerRef.current) window.clearTimeout(hitTimerRef.current);
      return;
    }

    isRecordingRef.current = true;
    hitCountRef.current = 0;
    setComboCount(0);
    setHitCount(0);

    const FEEDBACK = [
      "Faster! 💨", "Good! ✓", "Guard up!", "Nice combo!",
      "Keep going!", "Power! 💪", "Speed up!", "Snap it!", "Nice jab!", "Stay tight!",
    ];

    function scheduleHit() {
      const delay = 500 + Math.floor(Math.random() * 400);
      hitTimerRef.current = window.setTimeout(() => {
        if (!isRecordingRef.current) return;
        hitCountRef.current += 1;
        setComboCount((c) => c + 1);
        setHitCount((c) => c + 1);
        setIsFlashing(true);
        window.setTimeout(() => setIsFlashing(false), 130);
        const id = Date.now();
        const text = FEEDBACK[Math.floor(Math.random() * FEEDBACK.length)];
        setLiveFeedback({ text, id });
        window.setTimeout(() => setLiveFeedback((prev) => (prev?.id === id ? null : prev)), 1300);
        if (isRecordingRef.current) scheduleHit();
      }, delay);
    }

    scheduleHit();

    return () => {
      isRecordingRef.current = false;
      if (hitTimerRef.current) window.clearTimeout(hitTimerRef.current);
    };
  }, [phase]);

  const handleStart = () => {
    setError("");
    setResult(null);
    setSaved(false);
    setSavedAttemptNumber(null);
    setChallengeSaved(false);
    challengeSavedRef.current = false;
    setComboCount(0);
    setHitCount(0);
    setIsFlashing(false);
    setLiveFeedback(null);
    setShowGo(false);
    hitCountRef.current = 0;
    setCountdown(3);
    setPhase("countdown");
  };

  const handleTryAgain = () => {
    setError("");
    setResult(null);
    setSaved(false);
    setSavedAttemptNumber(null);
    setChallengeSaved(false);
    challengeSavedRef.current = false;
    setSecondsLeft(sessionSeconds);
    setCountdown(null);
    setPhase("idle");
    setComboCount(0);
    setHitCount(0);
    setIsFlashing(false);
    setLiveFeedback(null);
    setShowGo(false);
    hitCountRef.current = 0;
  };

  const handleShareChallenge = async () => {
    if (!result) return;

    const text = t("challengeShareText")
      .replace("{score}", result.score.toFixed(1))
      .replace("{challengeName}", activeChallengeName);

    try {
      if (navigator.share) {
        await navigator.share({
          title: activeChallengeName || t("challengesTitle"),
          text,
        });
        return;
      }

      await navigator.clipboard.writeText(text);
      setError(t("shareLinkCopied"));
    } catch (err) {
      console.error("Challenge share failed:", err);
      setError(t("shareFailed"));
    }
  };

  const handleChallengeFriend = async () => {
    if (!result || !activeChallenge || !challengeId) return;

    const scoreText = result.score.toFixed(1);
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/train?challengeId=${encodeURIComponent(challengeId)}&score=${encodeURIComponent(scoreText)}`
      : "";
    const text = t("challengeFriendShareText")
      .replace("{score}", scoreText)
      .replace("{challengeName}", activeChallengeName);
    const fallbackText = url ? `${text}\n${url}` : text;

    try {
      if (navigator.share) {
        await navigator.share({
          title: activeChallengeName || t("challengesTitle"),
          text,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(fallbackText);
      setError(t("shareLinkCopied"));
    } catch (err) {
      console.error("Friend challenge share failed:", err);
      setError(t("shareFailed"));
    }
  };

  const handleSaveChallengeResult = async () => {
    if (!activeChallenge || !challengeId || !result) return;

    if (!user?.uid) {
      router.push(`/${locale}/login`);
      return;
    }

    if (challengeSavedRef.current || challengeSaved) return;

    challengeSavedRef.current = true;
    setChallengeSaving(true);
    setError("");

    try {
      const rank = getChallengeRank(result.score);
      const comparisonPercent = getChallengeComparisonPercent(result.score);
      const xpGained = calculateChallengeXP(result.score, rank);

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", user.uid);
        const challengeResultRef = doc(collection(db, "challenge_results"));
        const userSnap = await transaction.get(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        const todayKey = getLocalDateKey();
        const yesterdayKey = getPreviousLocalDateKey();
        const lastChallengeDate = String(userData.lastChallengeDate || "");
        const currentStreak = Number(userData.challengeStreak) || 0;
        const isSameDay = lastChallengeDate === todayKey;
        const nextStreak = isSameDay
          ? currentStreak
          : lastChallengeDate === yesterdayKey
            ? currentStreak + 1
            : 1;
        const streakBonusXP = isSameDay ? 0 : getChallengeStreakBonus(nextStreak);
        const totalChallengeXP = xpGained + streakBonusXP;
        const nextXP = Math.round((Number(userData.xp) || 0) + totalChallengeXP);
        const nextCompleted = Math.round((Number(userData.totalChallengesCompleted) || 0) + 1);
        const nextRank = getFighterRank(nextXP);

        transaction.set(challengeResultRef, {
          userId: user.uid,
          challengeId,
          score: result.score,
          rank,
          comparisonPercent,
          xpGained: totalChallengeXP,
          baseXP: xpGained,
          streakBonusXP,
          challengeStreak: nextStreak,
          createdAt: serverTimestamp(),
          locale,
        });

        transaction.set(userRef, {
          xp: nextXP,
          rank: nextRank.key,
          rankName: nextRank.key.replace(/^rank/, ""),
          totalChallengesCompleted: nextCompleted,
          challengeStreak: nextStreak,
          lastChallengeDate: todayKey,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      });

      setChallengeSaved(true);
    } catch (err) {
      challengeSavedRef.current = false;
      console.error("Failed to save challenge result:", err);
      setError(t("challengeSaveFailed"));
    } finally {
      setChallengeSaving(false);
    }
  };

  const handleShareTraining = async () => {
    if (!result) return;

    const text = `I scored ${result.score.toFixed(1)} in GAVANA 🥊 Can you beat me?`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "GAVANA",
          text,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setError(t("shareLinkCopied"));
        return;
      }

      setError(t("shareFailed"));
    } catch (err) {
      console.error("Training share failed:", err);
      setError(t("shareFailed"));
    }
  };

  const handleSave = async () => {
    if (!user?.uid || !result) return;

    setSaving(true);
    setError("");

    try {
      const previousSessionsSnap = await getDocs(query(
        collection(db, "training_sessions"),
        where("userId", "==", user.uid),
        where("reelId", "==", reelId)
      ));
      const previousAttempts = previousSessionsSnap.docs
        .map((doc) => doc.data())
        .filter((session) => session.type === "training").length;
      const attemptNumber = previousAttempts + 1;

      await addDoc(collection(db, "training_sessions"), {
        userId: user.uid,
        reelId,
        score: result.score,
        xpGained: result.xpGained,
        attemptNumber,
        rankProgress: result.rankProgress,
        createdAt: serverTimestamp(),
        type: "training",
        locale,
        source: "train_screen",
      });

      setSaved(true);
      setSavedAttemptNumber(attemptNumber);
    } catch (err) {
      console.error("Failed to save training session:", err);
      setError(t("trainSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div style={styles.loading}>{t("loading")}</div>;
  }

  if (!user) return null;

  const isCountingDown = phase === "countdown";
  const isRecording = phase === "recording";
  const canStart = phase === "idle" || phase === "result";

  return (
    <main style={styles.page}>
      <button type="button" style={styles.backButton} onClick={goBack}>
        <span style={styles.backIcon}>{"<"}</span>
        {t("back")}
      </button>

      <section style={styles.shell}>
        <header style={styles.header}>
          <p style={styles.kicker}>{activeChallenge ? t("challengeMode") : t("trainKicker")}</p>
          <h1 style={styles.title}>{activeChallenge ? t(activeChallenge.titleKey) : t("trainTitle")}</h1>
          <p style={styles.subtitle}>{t("trainSubtitle")}</p>
          {activeChallenge && targetScore && (
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
              <div style={styles.fallbackMark}>REC</div>
              <p style={styles.fallbackTitle}>
                {cameraState === "checking" ? t("trainCameraChecking") : t("trainCameraUnavailable")}
              </p>
              <p style={styles.fallbackText}>
                {cameraState === "denied" ? t("trainCameraDenied") : t("trainCameraFallback")}
              </p>
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
            <>
              {/* Recording HUD — top bar */}
              <div style={styles.recordingHud}>
                <span style={styles.recordDot} />
                <span>{t("trainRecording")}</span>
                <strong style={{ marginLeft: "auto" }}>{secondsLeft}s</strong>
              </div>

              {/* Hit progress counter */}
              <div style={styles.hitCounter}>
                <span style={styles.hitCountNum}>{hitCount}</span>
                <span style={styles.hitCountSep}>/</span>
                <span style={styles.hitCountTarget}>{Math.round(sessionSeconds * 1.2)}</span>
                <span style={styles.hitCountLabel}>hits</span>
              </div>

              {/* Combo counter — bottom-center */}
              {comboCount > 0 && (
                <div key={comboCount} style={styles.comboCounter} className="combo-pop">
                  <span style={styles.comboLabel}>COMBO</span>
                  <span style={styles.comboNum}>{comboCount}</span>
                </div>
              )}

              {/* Floating feedback toast — mid-screen */}
              {liveFeedback && (
                <div key={liveFeedback.id} style={styles.liveFeedbackBox} className="feedback-fade">
                  {liveFeedback.text}
                </div>
              )}
            </>
          )}
        </div>

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
        </div>
      </section>

      {result && (
        <div style={styles.modalWrap}>
          <div style={styles.modalOverlay} />
          <section style={styles.modal}>
            <p style={styles.modalKicker}>{t("trainResult")}</p>
            <div style={styles.score}>{result.score.toFixed(1)}</div>
            <span style={styles.scoreUnit}>/10</span>

            <div style={styles.resultGrid}>
              {activeChallenge ? (
                <>
                  <div style={styles.resultItem}>
                    <span>{t("challengeRank")}</span>
                    <strong>{getChallengeRank(result.score)}</strong>
                  </div>
                  <div style={styles.resultItem}>
                    <span>{t("challengeComparison")}</span>
                    <strong>
                      {t("challengeBeatPlayers").replace(
                        "{n}",
                        getChallengeComparisonPercent(result.score)
                      )}
                    </strong>
                  </div>
                  {targetScore && (
                    <div style={{ ...styles.resultItem, ...styles.targetResultItem }}>
                      <span>{t("challengeTargetScore")}</span>
                      <strong>{targetScore.toFixed(1)}/10</strong>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={styles.resultItem}>
                    <span>{t("trainXpGained")}</span>
                    <strong>+{result.xpGained}</strong>
                  </div>
                  <div style={styles.resultItem}>
                    <span>{t("trainRankProgress")}</span>
                    <strong>{result.rankProgress}%</strong>
                  </div>
                  {result.hitCount > 0 && (
                    <div style={{ ...styles.resultItem, gridColumn: "1 / -1" }}>
                      <span>Total Hits</span>
                      <strong>{result.hitCount} 🥊</strong>
                    </div>
                  )}
                </>
              )}
            </div>

            {!activeChallenge && (
              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressFill, width: `${result.rankProgress}%` }} />
              </div>
            )}

            {!activeChallenge && (
              <button type="button" style={styles.shareResultButton} onClick={handleShareTraining}>
                {t("challengeShare")}
              </button>
            )}

            {activeChallenge && challengeSaved && (
              <div style={styles.modalSaved}>{t("challengeResultSaved")}</div>
            )}

            <div style={styles.modalActions}>
              {!activeChallenge && (
                <>
                  <button
                    type="button"
                    style={{ ...styles.saveButton, ...(saved ? styles.saveButtonDone : {}) }}
                    onClick={handleSave}
                    disabled={saving || saved}
                  >
                    {saving
                      ? t("trainSaving")
                      : saved && savedAttemptNumber
                        ? t("trainAttemptSaved").replace("{n}", savedAttemptNumber)
                        : saved
                          ? t("trainSavedShort")
                          : t("trainSaveProgress")}
                  </button>
                  <button type="button" style={styles.reelsButton} onClick={goToReels}>
                    {t("trainBackToReels")}
                  </button>
                </>
              )}
              {activeChallenge && (
                <>
                  <button
                    type="button"
                    style={{ ...styles.saveButton, ...(challengeSaved ? styles.saveButtonDone : {}) }}
                    onClick={handleSaveChallengeResult}
                    disabled={challengeSaving || challengeSaved}
                  >
                    {challengeSaving
                      ? t("trainSaving")
                      : challengeSaved
                        ? t("challengeResultSaved")
                        : t("challengeSaveResult")}
                  </button>
                  <button type="button" style={styles.reelsButton} onClick={goToChallenges}>
                    {t("challengeBackToChallenges")}
                  </button>
                  <button type="button" style={styles.challengeFriendButton} onClick={handleChallengeFriend}>
                    {t("challengeFriend")}
                  </button>
                  <button type="button" style={styles.reelsButton} onClick={handleShareChallenge}>
                    {t("challengeShare")}
                  </button>
                </>
              )}
              <button type="button" style={styles.tryAgainButton} onClick={handleTryAgain}>
                {activeChallenge ? t("challengeTryAgain") : t("trainTryAgain")}
              </button>
            </div>
          </section>
        </div>
      )}

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="upload" />

      <style>{`
        @keyframes flashFade {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }

        .countdown-pop {
          animation: countdownPop 900ms ease both;
        }
        @keyframes countdownPop {
          0%   { transform: scale(1.7); opacity: 0; }
          22%  { transform: scale(1);   opacity: 1; }
          72%  { transform: scale(1);   opacity: 1; }
          100% { transform: scale(0.8); opacity: 0; }
        }

        .combo-pop {
          animation: comboPop 380ms cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes comboPop {
          0%   { transform: translateX(-50%) scale(0.5); opacity: 0; }
          60%  { transform: translateX(-50%) scale(1.2); opacity: 1; }
          100% { transform: translateX(-50%) scale(1);   opacity: 1; }
        }

        .feedback-fade {
          animation: feedbackFade 1300ms ease forwards;
        }
        @keyframes feedbackFade {
          0%   { opacity: 0; transform: translateX(-50%) translateY(10px); }
          14%  { opacity: 1; transform: translateX(-50%) translateY(0);    }
          70%  { opacity: 1; transform: translateX(-50%) translateY(0);    }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px);}
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 50% 0%, rgba(193,18,31,0.2), transparent 34%), linear-gradient(180deg, #080808 0%, #0B0B0B 100%)",
    color: "#fff",
    padding: "calc(68px + env(safe-area-inset-top)) 16px calc(92px + env(safe-area-inset-bottom))",
    fontFamily: "sans-serif",
  },
  loading: {
    minHeight: "100vh",
    background: "#070707",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "fixed",
    top: "calc(14px + env(safe-area-inset-top))",
    left: "max(14px, env(safe-area-inset-left))",
    zIndex: 40,
    minHeight: 38,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 11,
    paddingRight: 14,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.44)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  backIcon: {
    fontSize: 24,
    lineHeight: 1,
    color: "#D4AF37",
  },
  shell: {
    maxWidth: 520,
    margin: "0 auto",
    display: "grid",
    gap: 18,
  },
  header: {
    display: "grid",
    gap: 8,
  },
  kicker: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1,
    fontWeight: 1000,
    letterSpacing: 0,
  },
  subtitle: {
    margin: 0,
    color: "rgba(255,255,255,0.66)",
    fontSize: 14,
    lineHeight: 1.45,
    maxWidth: 420,
  },
  targetScorePill: {
    width: "fit-content",
    display: "inline-flex",
    alignItems: "center",
    minHeight: 36,
    padding: "0 13px",
    borderRadius: 999,
    background: "rgba(212,175,55,0.16)",
    border: "1px solid rgba(212,175,55,0.34)",
    boxShadow: "0 12px 32px rgba(212,175,55,0.12)",
  },
  targetScoreLabel: {
    color: "#FDE68A",
    fontSize: 13,
    fontWeight: 1000,
  },
  stage: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 22,
    minHeight: 460,
    aspectRatio: "9 / 14",
    background: "#050505",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.46)",
  },
  preview: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transform: "scaleX(-1)",
  },
  fallback: {
    position: "absolute",
    inset: 0,
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    gap: 12,
    padding: 28,
    textAlign: "center",
    background: "radial-gradient(circle at 50% 38%, rgba(212,175,55,0.13), transparent 30%), linear-gradient(145deg, #12090a, #050505)",
  },
  fallbackMark: {
    border: "1px solid rgba(193,18,31,0.55)",
    borderRadius: 999,
    padding: "7px 12px",
    color: "#FF6B6B",
    fontSize: 11,
    fontWeight: 1000,
    letterSpacing: 1.5,
  },
  fallbackTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 950,
  },
  fallbackText: {
    margin: 0,
    color: "rgba(255,255,255,0.64)",
    fontSize: 14,
    lineHeight: 1.5,
  },
  stageShade: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background: "linear-gradient(to top, rgba(0,0,0,0.38), transparent 48%)",
  },
  countdown: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 140,
    fontWeight: 1000,
    color: "#fff",
    textShadow: "0 0 80px rgba(193,18,31,0.7), 0 18px 60px rgba(0,0,0,0.9)",
    zIndex: 10,
    pointerEvents: "none",
  },
  countdownGo: {
    fontSize: 100,
    color: "#34D399",
    textShadow: "0 0 80px rgba(52,211,153,0.65), 0 18px 60px rgba(0,0,0,0.9)",
  },
  flashOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(193,18,31,0.38)",
    zIndex: 8,
    pointerEvents: "none",
    animation: "flashFade 150ms ease-out forwards",
  },
  hitCounter: {
    position: "absolute",
    top: 64,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "baseline",
    gap: 4,
    background: "rgba(0,0,0,0.58)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: 999,
    padding: "5px 16px",
    border: "1px solid rgba(255,255,255,0.16)",
    zIndex: 5,
    whiteSpace: "nowrap",
  },
  hitCountNum: {
    color: "#fff",
    fontSize: 24,
    fontWeight: 1000,
    lineHeight: 1,
    textShadow: "0 0 20px rgba(212,175,55,0.5)",
  },
  hitCountSep: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontWeight: 700,
    margin: "0 2px",
  },
  hitCountTarget: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 16,
    fontWeight: 800,
  },
  hitCountLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: 700,
    marginLeft: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  comboCounter: {
    position: "absolute",
    bottom: 70,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 6,
    pointerEvents: "none",
  },
  comboLabel: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: 1000,
    letterSpacing: 2.5,
    textShadow: "0 2px 8px rgba(0,0,0,0.95)",
    textTransform: "uppercase",
  },
  comboNum: {
    color: "#fff",
    fontSize: 64,
    fontWeight: 1000,
    lineHeight: 1,
    textShadow: "0 0 40px rgba(212,175,55,0.55), 0 4px 18px rgba(0,0,0,0.95)",
  },
  liveFeedbackBox: {
    position: "absolute",
    top: "32%",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: 999,
    padding: "9px 22px",
    color: "#fff",
    fontSize: 15,
    fontWeight: 900,
    whiteSpace: "nowrap",
    zIndex: 9,
    textShadow: "0 2px 8px rgba(0,0,0,0.9)",
    pointerEvents: "none",
  },
  recordingHud: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    minHeight: 38,
    display: "flex",
    alignItems: "center",
    gap: 9,
    borderRadius: 999,
    padding: "0 13px",
    background: "rgba(0,0,0,0.54)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    fontSize: 12,
    fontWeight: 900,
    zIndex: 5,
  },
  recordDot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: "#C1121F",
    flexShrink: 0,
    boxShadow: "0 0 0 6px rgba(193,18,31,0.18)",
  },
  controls: {
    display: "grid",
    gap: 12,
  },
  startButton: {
    minHeight: 58,
    border: "1px solid rgba(212,175,55,0.34)",
    borderRadius: 16,
    background: "linear-gradient(135deg, #C1121F, #7d0812 58%, #9a6a18)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 1000,
    letterSpacing: 1.2,
    cursor: "pointer",
    boxShadow: "0 18px 44px rgba(193,18,31,0.26)",
  },
  stopButton: {
    minHeight: 54,
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 950,
    cursor: "pointer",
  },
  error: {
    padding: 12,
    borderRadius: 12,
    background: "rgba(193,18,31,0.14)",
    border: "1px solid rgba(193,18,31,0.35)",
    color: "#ffb4b4",
    fontSize: 13,
  },
  saved: {
    padding: 12,
    borderRadius: 12,
    background: "rgba(52,211,153,0.12)",
    border: "1px solid rgba(52,211,153,0.28)",
    color: "#A7F3D0",
    fontSize: 13,
    fontWeight: 800,
  },
  modalSaved: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    background: "rgba(52,211,153,0.12)",
    border: "1px solid rgba(52,211,153,0.28)",
    color: "#A7F3D0",
    fontSize: 13,
    fontWeight: 900,
  },
  modalWrap: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "20px 16px calc(92px + env(safe-area-inset-bottom))",
  },
  modalOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.64)",
    backdropFilter: "blur(8px)",
  },
  modal: {
    position: "relative",
    width: "100%",
    maxWidth: 460,
    borderRadius: 22,
    padding: 20,
    background: "linear-gradient(180deg, #151111, #080808)",
    border: "1px solid rgba(212,175,55,0.2)",
    boxShadow: "0 -24px 70px rgba(0,0,0,0.54)",
    textAlign: "center",
    maxHeight: "calc(100vh - 132px)",
    overflowY: "auto",
  },
  modalKicker: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  score: {
    marginTop: 8,
    fontSize: 72,
    lineHeight: 0.95,
    fontWeight: 1000,
  },
  scoreUnit: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 16,
    fontWeight: 900,
  },
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 18,
  },
  resultItem: {
    display: "grid",
    gap: 6,
    padding: 14,
    borderRadius: 14,
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: 800,
  },
  targetResultItem: {
    gridColumn: "1 / -1",
    background: "rgba(212,175,55,0.13)",
    border: "1px solid rgba(212,175,55,0.28)",
    color: "rgba(253,230,138,0.78)",
    boxShadow: "0 0 28px rgba(212,175,55,0.12)",
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    marginTop: 16,
    background: "rgba(255,255,255,0.09)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #C1121F, #D4AF37)",
  },
  shareResultButton: {
    width: "100%",
    minHeight: 46,
    marginTop: 14,
    border: "1px solid rgba(212,175,55,0.36)",
    borderRadius: 14,
    background: "linear-gradient(135deg, rgba(212,175,55,0.18), rgba(193,18,31,0.18))",
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: 950,
    cursor: "pointer",
  },
  modalActions: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 10,
    marginTop: 18,
  },
  saveButton: {
    minHeight: 46,
    border: "none",
    borderRadius: 14,
    background: "#C1121F",
    color: "#fff",
    fontSize: 14,
    fontWeight: 950,
    cursor: "pointer",
  },
  saveButtonDone: {
    background: "#17664b",
    cursor: "default",
  },
  tryAgainButton: {
    minHeight: 46,
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 14,
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
  reelsButton: {
    minHeight: 46,
    border: "1px solid rgba(212,175,55,0.32)",
    borderRadius: 14,
    background: "rgba(212,175,55,0.1)",
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: 950,
    cursor: "pointer",
  },
  challengeFriendButton: {
    minHeight: 46,
    border: "1px solid rgba(212,175,55,0.42)",
    borderRadius: 14,
    background: "linear-gradient(135deg, rgba(193,18,31,0.92), rgba(212,175,55,0.28))",
    color: "#fff",
    fontSize: 14,
    fontWeight: 1000,
    cursor: "pointer",
    boxShadow: "0 14px 34px rgba(193,18,31,0.22)",
  },
};
