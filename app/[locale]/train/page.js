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
const LAST_SESSION_PREFIX = "gavana_last_session";
const TRAINING_STREAK_KEY = "gavana_training_streak";
const CHALLENGES = {
  "jab-minute": { titleKey: "challengeJabTitle", seconds: 60 },
  "speed-test": { titleKey: "challengeSpeedTitle", seconds: 20 },
  "combo-master": { titleKey: "challengeComboTitle", seconds: 30 },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getSessionStorageKey(userId, reelId, challengeId) {
  if (!userId) return "";
  const scope = challengeId ? `challenge_${challengeId}` : `reel_${reelId || "free"}`;
  return `${LAST_SESSION_PREFIX}_${userId}_${scope}`;
}

function makeTrainingResult(currentXP, stats) {
  const totalHits = Math.max(0, Number(stats.totalHits) || 0);
  const targetHits = Math.max(1, Number(stats.targetHits) || 1);
  const bestCombo = Math.max(0, Number(stats.bestCombo) || 0);
  const completion = clamp(Number(stats.completion) || 0, 0, 1);
  const hitRatio = clamp(totalHits / targetHits, 0, 1.25);
  const comboRatio = clamp(bestCombo / targetHits, 0, 1);
  const accuracy = totalHits === 0
    ? 0
    : Math.round(clamp(hitRatio * 82 + completion * 10 + comboRatio * 8, 0, 100));
  const variation = totalHits === 0 ? Math.random() * 0.4 : (Math.random() - 0.5) * 0.5;
  const rawScore = totalHits === 0
    ? 0.5 + variation
    : hitRatio * 6.6 + comboRatio * 1.5 + completion * 1.4 + (accuracy / 100) * 0.5 + variation;
  const score = Number(clamp(rawScore, totalHits === 0 ? 0.5 : 1, 10).toFixed(1));
  const xpGained = Math.round(score * 42 + totalHits * 4 + bestCombo * 3);
  return {
    score,
    xpGained,
    rankProgress: getRankProgress(currentXP + xpGained),
    beatPercent: Math.min(96, Math.max(5, Math.round(score * 9 + accuracy * 0.25))),
    hitCount: totalHits,
    totalHits,
    bestCombo,
    accuracy,
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
  return Math.min(99, Math.max(5, Math.round(score * 10 + 3)));
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

function getTrainingStreakFire(count) {
  if (!count) return "";
  return "🔥".repeat(Math.min(3, count));
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
  const [challengeSaveMessage, setChallengeSaveMessage] = useState("");
  const [error, setError] = useState("");

  // Live game state
  const [comboCount, setComboCount] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [impactId, setImpactId] = useState(0);
  const [liveFeedback, setLiveFeedback] = useState(null);
  const [showGo, setShowGo] = useState(false);
  const [lastSession, setLastSession] = useState(null);
  const [ghostEnabled, setGhostEnabled] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const [resultPreviousBest, setResultPreviousBest] = useState(null);
  const [trainingStreak, setTrainingStreak] = useState(0);
  const [animatedXP, setAnimatedXP] = useState(0);
  const [animatedRankProgress, setAnimatedRankProgress] = useState(0);
  const isRecordingRef = useRef(false);
  const hitTimerRef = useRef(null);
  const hitCountRef = useRef(0);
  const audioCtxRef = useRef(null);

  const activeChallenge = challengeId ? CHALLENGES[challengeId] : null;
  const sessionSeconds = activeChallenge?.seconds || RECORD_SECONDS;
  const activeChallengeName = activeChallenge ? t(activeChallenge.titleKey) : "";
  const targetHits = Math.max(10, Math.round(sessionSeconds * 1.2));

  const triggerImpact = useCallback(() => {
    setIsFlashing(true);
    setImpactId(Date.now());
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
    window.setTimeout(() => setIsFlashing(false), 150);
  }, []);

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
    if (typeof window === "undefined") return;
    const storageKey = getSessionStorageKey(user?.uid, reelId, challengeId);
    setLastSession(null);
    setGhostEnabled(false);
    if (!storageKey) return;

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      const score = Number(parsed?.score);
      if (!Number.isFinite(score)) return;

      setLastSession({
        score,
        comboCount: Math.max(0, Number(parsed.comboCount) || Number(parsed.hitCount) || 0),
        timestamp: parsed.timestamp || null,
        scoreProgression: Array.isArray(parsed.scoreProgression) ? parsed.scoreProgression : [],
      });
      setGhostEnabled(true);
    } catch (err) {
      console.warn("Could not load ghost session:", err);
    }
  }, [user?.uid, reelId, challengeId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(TRAINING_STREAK_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      const lastTrainedAt = Number(parsed?.lastTrainedAt) || 0;
      const count = Number(parsed?.count) || 0;
      const expired = lastTrainedAt && Date.now() - lastTrainedAt > 24 * 60 * 60 * 1000;
      setTrainingStreak(expired ? 0 : count);
    } catch (err) {
      console.warn("Could not load training streak:", err);
    }
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

    const totalHits = hitCountRef.current;
    const completion = clamp((sessionSeconds - secondsLeft) / sessionSeconds, 0, 1);
    const bestCombo = totalHits;
    setSecondsLeft(0);
    setPhase("finished");
    const nextResult = makeTrainingResult(currentXP, {
      totalHits,
      targetHits,
      bestCombo,
      completion,
    });
    const previousScore = Number(lastSession?.score);
    const hasPreviousBest = Number.isFinite(previousScore);
    const didBeatPrevious = hasPreviousBest && nextResult.score > previousScore;
    const shouldStoreSession = !hasPreviousBest || nextResult.score >= previousScore;

    setNewBest(didBeatPrevious);
    setResultPreviousBest(hasPreviousBest ? previousScore : null);

    if (shouldStoreSession) {
      const savedSession = {
        score: nextResult.score,
        comboCount: bestCombo,
        totalHits,
        bestCombo,
        accuracy: nextResult.accuracy,
        timestamp: Date.now(),
        scoreProgression: [0, Number((nextResult.score * 0.35).toFixed(1)), Number((nextResult.score * 0.7).toFixed(1)), nextResult.score],
      };

      setLastSession(savedSession);
      if (typeof window !== "undefined") {
        try {
          const storageKey = getSessionStorageKey(user?.uid, reelId, challengeId);
          if (storageKey) {
            window.localStorage.setItem(storageKey, JSON.stringify(savedSession));
          }
        } catch (err) {
          console.warn("Could not save ghost session:", err);
        }
      }
    }

    if (typeof window !== "undefined") {
      try {
        const now = Date.now();
        const todayKey = getLocalDateKey();
        const stored = window.localStorage.getItem(TRAINING_STREAK_KEY);
        const parsed = stored ? JSON.parse(stored) : {};
        const lastTrainedAt = Number(parsed?.lastTrainedAt) || 0;
        const lastDateKey = String(parsed?.lastDateKey || "");
        const currentCount = Number(parsed?.count) || 0;
        const expired = lastTrainedAt && now - lastTrainedAt > 24 * 60 * 60 * 1000;
        const nextStreak = lastDateKey === todayKey
          ? Math.max(1, currentCount)
          : expired
            ? 1
            : currentCount + 1;

        const streakSnapshot = {
          count: nextStreak,
          lastDateKey: todayKey,
          lastTrainedAt: now,
        };

        window.localStorage.setItem(TRAINING_STREAK_KEY, JSON.stringify(streakSnapshot));
        setTrainingStreak(nextStreak);
      } catch (err) {
        console.warn("Could not save training streak:", err);
      }
    }

    setResult(nextResult);
    setSaved(false);
    setSavedAttemptNumber(null);
  }, [challengeId, currentXP, lastSession, reelId, secondsLeft, sessionSeconds, targetHits, user?.uid]);

  useEffect(() => {
    if (phase !== "countdown" || countdown === null) return undefined;

    if (countdown <= 0) {
      setShowGo(true);
      triggerImpact();

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
        window.clearTimeout(goTimer);
      };
    }

    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, countdown, sessionSeconds, triggerImpact]);

  useEffect(() => {
    if (phase !== "recording") return undefined;

    if (secondsLeft <= 0) {
      finishRecording();
      return undefined;
    }

    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, secondsLeft, finishRecording]);

  useEffect(() => {
    if (!result) {
      setAnimatedXP(0);
      setAnimatedRankProgress(0);
      return undefined;
    }

    const start = performance.now();
    const duration = 900;
    const xpTarget = Math.max(0, Number(result.xpGained) || 0);
    const rankTarget = Math.max(0, Math.min(100, Number(result.rankProgress) || 0));
    let frame = 0;

    function animate(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedXP(Math.round(xpTarget * eased));
      setAnimatedRankProgress(Math.round(rankTarget * eased));

      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      }
    }

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [result]);

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
      const delay = 400 + Math.floor(Math.random() * 501);
      hitTimerRef.current = window.setTimeout(() => {
        if (!isRecordingRef.current) return;
        const nextHitCount = hitCountRef.current + 1;
        hitCountRef.current = nextHitCount;
        setComboCount((c) => c + 1);
        setHitCount((c) => c + 1);
        setIsFlashing(true);
        window.setTimeout(() => setIsFlashing(false), 130);
        const id = Date.now();
        const feedbackKey = milestoneMap[nextHitCount] || feedbackKeys[Math.floor(Math.random() * feedbackKeys.length)];
        const text = t(feedbackKey);
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
  }, [phase, t, triggerImpact]);

  const handleStart = () => {
    setError("");
    setResult(null);
    setSaved(false);
    setSavedAttemptNumber(null);
    setChallengeSaved(false);
    setChallengeSaveMessage("");
    challengeSavedRef.current = false;
    setComboCount(0);
    setHitCount(0);
    setIsFlashing(false);
    setImpactId(0);
    setLiveFeedback(null);
    setShowGo(false);
    setNewBest(false);
    setResultPreviousBest(null);
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
    setChallengeSaveMessage("");
    challengeSavedRef.current = false;
    setSecondsLeft(sessionSeconds);
    setCountdown(null);
    setPhase("idle");
    setComboCount(0);
    setHitCount(0);
    setIsFlashing(false);
    setImpactId(0);
    setLiveFeedback(null);
    setShowGo(false);
    setNewBest(false);
    setResultPreviousBest(null);
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
      const todayKey = getLocalDateKey();
      const previousAttemptsSnap = await getDocs(query(
        collection(db, "challenge_results"),
        where("userId", "==", user.uid),
        where("challengeId", "==", challengeId)
      ));
      const xpAlreadyClaimedToday = previousAttemptsSnap.docs.some((attemptDoc) => {
        const attempt = attemptDoc.data();
        return attempt.challengeDate === todayKey && Number(attempt.xpGained) > 0;
      });

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", user.uid);
        const challengeResultRef = doc(collection(db, "challenge_results"));
        const userSnap = await transaction.get(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        const yesterdayKey = getPreviousLocalDateKey();
        const lastChallengeDate = String(userData.lastChallengeDate || "");
        const currentStreak = Number(userData.challengeStreak) || 0;
        const isSameDay = lastChallengeDate === todayKey;
        const nextStreak = isSameDay
          ? currentStreak
          : lastChallengeDate === yesterdayKey
            ? currentStreak + 1
            : 1;
        const streakBonusXP = xpAlreadyClaimedToday || isSameDay ? 0 : getChallengeStreakBonus(nextStreak);
        const totalChallengeXP = xpAlreadyClaimedToday ? 0 : xpGained + streakBonusXP;
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
          challengeDate: todayKey,
          xpClaimed: !xpAlreadyClaimedToday,
          createdAt: serverTimestamp(),
          locale,
        });

        const userUpdate = {
          totalChallengesCompleted: nextCompleted,
          lastChallengeDate: todayKey,
          updatedAt: serverTimestamp(),
        };

        if (!xpAlreadyClaimedToday) {
          userUpdate.xp = nextXP;
          userUpdate.rank = nextRank.key;
          userUpdate.rankName = nextRank.key.replace(/^rank/, "");
          userUpdate.challengeStreak = nextStreak;
        }

        transaction.set(userRef, userUpdate, { merge: true });
      });

      setChallengeSaved(true);
      setChallengeSaveMessage(xpAlreadyClaimedToday ? t("challengeXpAlreadyClaimed") : t("challengeSavedToLeaderboard"));
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
        totalHits: result.totalHits ?? result.hitCount ?? 0,
        bestCombo: result.bestCombo || 0,
        accuracy: result.accuracy || 0,
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
  const canStart = phase === "idle" || phase === "finished";
  const ghostScore = Number(lastSession?.score) || 0;
  const ghostComboTarget = Math.max(0, Number(lastSession?.comboCount) || 0);
  const elapsedSeconds = Math.max(0, sessionSeconds - secondsLeft);
  const ghostProgress = sessionSeconds > 0 ? Math.min(100, Math.round((elapsedSeconds / sessionSeconds) * 100)) : 0;
  const ghostComboProgress = Math.min(ghostComboTarget, Math.round((ghostComboTarget * ghostProgress) / 100));
  const ghostScoreProgress = Number(((ghostScore * ghostProgress) / 100).toFixed(1));
  const showGhostOverlay = Boolean(lastSession && ghostEnabled && (isCountingDown || isRecording));
  const almostThere = Boolean(result && lastSession && !newBest && result.score < ghostScore && ghostScore - result.score <= 0.5);
  const aheadPercent = result ? result.beatPercent || getChallengeComparisonPercent(result.score) : 0;
  const resultBestLabel = Number.isFinite(resultPreviousBest)
    ? t("ghostLastBest").replace("{score}", resultPreviousBest.toFixed(1))
    : t("ghostNoPrevious");
  const streakText = trainingStreak
    ? t("trainingDayStreak")
      .replace("{n}", trainingStreak)
      .replace("{fire}", getTrainingStreakFire(trainingStreak))
    : "";

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
          {(lastSession || user?.uid) && (
            <div style={styles.ghostTopRow}>
              <span style={styles.ghostBestText}>
                {lastSession ? t("ghostLastBest").replace("{score}", ghostScore.toFixed(1)) : t("ghostNoPrevious")}
              </span>
              {lastSession && (
                <button
                  type="button"
                  style={{ ...styles.ghostToggle, ...(ghostEnabled ? styles.ghostToggleOn : {}) }}
                  onClick={() => setGhostEnabled((value) => !value)}
                  aria-pressed={ghostEnabled}
                >
                  {ghostEnabled ? t("ghostModeOn") : t("ghostModeOff")}
                </button>
              )}
            </div>
          )}
        </header>

        <div
          style={styles.stage}
          className={isFlashing ? "stage-impact" : ""}
          onClick={() => {
            if (isRecording) triggerImpact();
          }}
        >
          {cameraState === "ready" ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={styles.preview}
              className={isFlashing ? "camera-impact" : ""}
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

          {showGhostOverlay && (
            <div style={styles.ghostOverlay}>
              <div style={styles.ghostSilhouette} />
              <div style={styles.ghostPanel}>
                <span style={styles.ghostPanelTitle}>
                  {t("ghostLastBest").replace("{score}", ghostScore.toFixed(1))}
                </span>
                <div style={styles.ghostTrack}>
                  <div style={{ ...styles.ghostFill, width: `${ghostProgress}%` }} />
                </div>
                <div style={styles.ghostStats}>
                  <span>{t("reels.combo")} {ghostComboProgress}/{ghostComboTarget || targetHits}</span>
                  <span>{t("score")} {ghostScoreProgress.toFixed(1)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Hit flash overlay — quick red burst on each simulated punch */}
          {isFlashing && <div style={styles.flashOverlay} />}
          {impactId > 0 && <div key={impactId} style={styles.impactRing} className="impact-ring" />}

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
                <div style={styles.hudStatus}>
                  <span style={styles.recordDot} />
                  <span>{secondsLeft}s</span>
                </div>
                <div style={styles.hudMetric}>
                  <span>{t("reels.combo")}</span>
                  <strong>{comboCount}</strong>
                </div>
                <div style={styles.hudMetric}>
                  <span>{t("challengeTargetScore")}</span>
                  <strong>{hitCount}/{targetHits}</strong>
                </div>
              </div>
              <div style={styles.hitProgressTrack}>
                <div
                  style={{
                    ...styles.hitProgressFill,
                    width: `${Math.min(100, Math.round((hitCount / targetHits) * 100))}%`,
                  }}
                />
              </div>

              {/* Hit progress counter */}
              <div style={styles.hitCounter}>
                <span style={styles.hitCountNum}>{hitCount}</span>
                <span style={styles.hitCountSep}>/</span>
                <span style={styles.hitCountTarget}>{targetHits}</span>
                <span style={styles.hitCountLabel}>{t("trainHits")}</span>
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
            <div
              style={{
                ...styles.score,
                ...(result.score > 7 ? styles.scoreGood : {}),
                ...(result.score < 5 ? styles.scoreLow : {}),
              }}
              className="score-reveal"
            >
              {result.score.toFixed(1)}
            </div>
            <span style={styles.scoreUnit}>/10</span>
            <p style={styles.beatUsersText}>
              {t("challengeBeatPlayers").replace("{n}", aheadPercent)}
            </p>
            <div style={styles.resultMetaRow}>
              <span>{resultBestLabel}</span>
              <button
                type="button"
                style={styles.resultShareButton}
                onClick={activeChallenge ? handleShareChallenge : handleShareTraining}
              >
                {t("challenge.share")}
              </button>
            </div>
            {newBest && <div style={styles.newBestBadge}>{t("ghostNewBest")}</div>}
            {almostThere && <div style={styles.almostThereBadge}>{t("trainingAlmostThere")}</div>}

            <div style={styles.rewardPanel}>
              <div style={styles.nextChallengeBox}>
                <span style={styles.rewardLabel}>{t("trainingNextChallenge")}</span>
                <strong>{t("trainingNextChallengeSuggestion")}</strong>
              </div>
              {streakText && <div style={styles.streakPill}>{streakText}</div>}
            </div>

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
                    <strong>+{animatedXP}</strong>
                  </div>
                  <div style={styles.resultItem}>
                    <span>{t("trainRankProgress")}</span>
                    <strong>{animatedRankProgress}%</strong>
                  </div>
                </>
              )}
            </div>

            <div style={styles.sessionSummary}>
              <div style={styles.summaryItem}>
                <span>{t("trainTotalHits")}</span>
                <strong>{result.hitCount || 0}</strong>
              </div>
              <div style={styles.summaryItem}>
                <span>{t("trainingBestCombo")}</span>
                <strong>{result.bestCombo ?? result.hitCount ?? 0}</strong>
              </div>
              <div style={styles.summaryItem}>
                <span>{t("trainingAccuracy")}</span>
                <strong>{result.accuracy ?? 0}%</strong>
              </div>
            </div>

            {!activeChallenge && (
              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressFill, width: `${animatedRankProgress}%` }} />
              </div>
            )}
            {!activeChallenge && (
              <p style={styles.aheadText}>{t("trainingAheadUsers").replace("{n}", aheadPercent)}</p>
            )}

            {activeChallenge && challengeSaved && (
              <div style={styles.modalSaved}>{challengeSaveMessage || t("challengeSavedToLeaderboard")}</div>
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
                        ? t("challenge.saved")
                        : t("challenge.saveResult")}
                  </button>
                  <button type="button" style={styles.reelsButton} onClick={goToChallenges}>
                    {t("challenge.backToChallenges")}
                  </button>
                </>
              )}
              <button type="button" style={styles.tryAgainButton} className="try-again-pulse" onClick={handleTryAgain}>
                {activeChallenge ? t("challenge.tryAgain") : t("trainTryAgain")}
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

        .stage-impact {
          animation: stageImpact 150ms ease-out both;
        }
        @keyframes stageImpact {
          0%   { transform: translate3d(0,0,0); }
          20%  { transform: translate3d(1.5px,-1px,0); }
          45%  { transform: translate3d(-1.5px,1px,0); }
          72%  { transform: translate3d(1px,0,0); }
          100% { transform: translate3d(0,0,0); }
        }

        .camera-impact {
          animation: cameraImpact 180ms ease-out both;
        }
        @keyframes cameraImpact {
          0%   { transform: scaleX(-1) scale(1); }
          45%  { transform: scaleX(-1) scale(1.02); }
          100% { transform: scaleX(-1) scale(1); }
        }

        .impact-ring {
          animation: impactRing 210ms ease-out forwards;
        }
        @keyframes impactRing {
          0%   { opacity: 0.96; transform: translate(-50%, -50%) scale(0.34); filter: blur(0); }
          62%  { opacity: 0.72; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.52); filter: blur(1px); }
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
          animation: comboPop 360ms cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes comboPop {
          0%   { transform: translateX(-50%) scale(1); opacity: 0.9; filter: drop-shadow(0 0 0 rgba(251,146,60,0)); }
          48%  { transform: translateX(-50%) scale(1.3); opacity: 1; filter: drop-shadow(0 0 22px rgba(251,146,60,0.72)); }
          100% { transform: translateX(-50%) scale(1); opacity: 1; filter: drop-shadow(0 0 8px rgba(193,18,31,0.28)); }
        }

        .feedback-fade {
          animation: feedbackFade 1300ms ease forwards;
        }
        @keyframes feedbackFade {
          0%   { opacity: 0; transform: translateX(-50%) translateY(14px) scale(0.96); }
          16%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          68%  { opacity: 1; transform: translateX(-50%) translateY(-4px) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-18px) scale(0.98);}
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .score-reveal {
          animation: scoreReveal 620ms cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes scoreReveal {
          0%   { opacity: 0; transform: scale(0.72); filter: blur(8px); }
          58%  { opacity: 1; transform: scale(1.12); filter: blur(0); }
          100% { opacity: 1; transform: scale(1); }
        }

        .try-again-pulse {
          animation: tryAgainPulse 1800ms ease-in-out infinite;
        }
        @keyframes tryAgainPulse {
          0%, 100% { box-shadow: 0 0 0 rgba(212,175,55,0); transform: translateY(0); }
          50% { box-shadow: 0 0 28px rgba(212,175,55,0.18); transform: translateY(-1px); }
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
    padding: "calc(58px + env(safe-area-inset-top)) 16px calc(92px + env(safe-area-inset-bottom))",
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
    width: "min(100%, 540px)",
    minHeight: "calc(100vh - 172px)",
    margin: "0 auto",
    display: "grid",
    alignContent: "center",
    gap: 14,
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
  ghostTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    padding: 10,
    borderRadius: 16,
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  ghostBestText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: 900,
  },
  ghostToggle: {
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.36)",
    color: "rgba(255,255,255,0.76)",
    fontSize: 12,
    fontWeight: 950,
    cursor: "pointer",
  },
  ghostToggleOn: {
    border: "1px solid rgba(212,175,55,0.36)",
    background: "rgba(212,175,55,0.14)",
    color: "#FDE68A",
    boxShadow: "0 10px 28px rgba(212,175,55,0.12)",
  },
  stage: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 22,
    minHeight: 420,
    height: "min(72vh, 640px)",
    aspectRatio: "9 / 13",
    background: "#050505",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 22px 62px rgba(0,0,0,0.5)",
    willChange: "transform",
  },
  preview: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transform: "scaleX(-1)",
    transformOrigin: "center",
    willChange: "transform",
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
  ghostOverlay: {
    position: "absolute",
    inset: "22% 12% 20%",
    zIndex: 4,
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    pointerEvents: "none",
  },
  ghostSilhouette: {
    width: "46%",
    minWidth: 132,
    maxWidth: 190,
    aspectRatio: "0.52 / 1",
    borderRadius: "44% 44% 36% 36%",
    background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(212,175,55,0.08))",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 0 44px rgba(212,175,55,0.12), inset 0 0 40px rgba(255,255,255,0.08)",
    opacity: 0.46,
    filter: "blur(0.2px)",
  },
  ghostPanel: {
    width: "min(270px, 90%)",
    marginTop: -18,
    padding: "10px 12px",
    borderRadius: 16,
    background: "rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.13)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.24)",
  },
  ghostPanelTitle: {
    display: "block",
    color: "#FDE68A",
    fontSize: 12,
    fontWeight: 1000,
    textAlign: "center",
  },
  ghostTrack: {
    height: 6,
    marginTop: 8,
    borderRadius: 999,
    overflow: "hidden",
    background: "rgba(255,255,255,0.12)",
  },
  ghostFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, rgba(212,175,55,0.95), rgba(193,18,31,0.9))",
    transition: "width 260ms ease",
  },
  ghostStats: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 8,
    color: "rgba(255,255,255,0.74)",
    fontSize: 11,
    fontWeight: 900,
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
    background: "radial-gradient(circle at 50% 42%, rgba(253,186,116,0.28), rgba(251,146,60,0.2) 24%, rgba(193,18,31,0.18) 42%, transparent 74%)",
    zIndex: 8,
    pointerEvents: "none",
    animation: "flashFade 180ms ease-out forwards",
  },
  impactRing: {
    position: "absolute",
    left: "50%",
    top: "43%",
    width: 104,
    height: 104,
    borderRadius: "50%",
    border: "2px solid rgba(253,186,116,0.78)",
    background: "radial-gradient(circle, rgba(253,186,116,0.18), transparent 58%)",
    boxShadow: "0 0 38px rgba(251,146,60,0.34), inset 0 0 26px rgba(193,18,31,0.2)",
    zIndex: 9,
    pointerEvents: "none",
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
    bottom: 58,
    left: "50%",
    transform: "translateX(-50%)",
    display: "grid",
    alignItems: "center",
    justifyItems: "center",
    minWidth: 132,
    padding: "10px 18px",
    borderRadius: 22,
    background: "linear-gradient(180deg, rgba(0,0,0,0.58), rgba(0,0,0,0.28))",
    border: "1px solid rgba(212,175,55,0.24)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 0 28px rgba(251,146,60,0.16), 0 16px 38px rgba(0,0,0,0.34)",
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
    fontSize: 72,
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
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1.25fr",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    padding: "5px 8px",
    background: "rgba(0,0,0,0.54)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    fontSize: 12,
    fontWeight: 900,
    zIndex: 5,
  },
  hitProgressTrack: {
    position: "absolute",
    top: 62,
    left: 22,
    right: 22,
    height: 6,
    borderRadius: 999,
    background: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    zIndex: 5,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
  },
  hitProgressFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #C1121F 0%, #F97316 62%, #FBBF24 100%)",
    boxShadow: "0 0 18px rgba(249,115,22,0.5)",
    transition: "width 240ms cubic-bezier(0.16,1,0.3,1)",
  },
  hudStatus: {
    minHeight: 28,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    background: "rgba(193,18,31,0.18)",
    color: "#fff",
  },
  hudMetric: {
    minHeight: 28,
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    gap: 1,
    borderRadius: 999,
    background: "rgba(255,255,255,0.055)",
    color: "#fff",
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
    alignItems: "center",
    justifyContent: "center",
    padding: "calc(18px + env(safe-area-inset-top)) 16px calc(86px + env(safe-area-inset-bottom))",
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
    maxWidth: 440,
    borderRadius: 20,
    padding: 16,
    background: "linear-gradient(180deg, #151111, #080808)",
    border: "1px solid rgba(212,175,55,0.2)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.54)",
    textAlign: "center",
    maxHeight: "calc(100vh - 110px)",
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
    marginTop: 6,
    fontSize: 62,
    lineHeight: 0.95,
    fontWeight: 1000,
    color: "#D4AF37",
    textShadow: "0 0 44px rgba(212,175,55,0.28)",
  },
  scoreGood: {
    color: "#34D399",
    textShadow: "0 0 46px rgba(52,211,153,0.36)",
  },
  scoreLow: {
    color: "#FF6B6B",
    textShadow: "0 0 42px rgba(193,18,31,0.34)",
  },
  scoreUnit: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 16,
    fontWeight: 900,
  },
  beatUsersText: {
    margin: "6px 0 0",
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: 850,
  },
  resultMetaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 8,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: 850,
  },
  resultShareButton: {
    minHeight: 28,
    padding: "0 10px",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 999,
    background: "rgba(255,255,255,0.055)",
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
  },
  newBestBadge: {
    width: "fit-content",
    margin: "12px auto 0",
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(52,211,153,0.14)",
    border: "1px solid rgba(52,211,153,0.32)",
    color: "#A7F3D0",
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: 1.4,
    boxShadow: "0 0 26px rgba(52,211,153,0.18)",
  },
  almostThereBadge: {
    width: "fit-content",
    margin: "12px auto 0",
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(251,146,60,0.13)",
    border: "1px solid rgba(251,146,60,0.32)",
    color: "#FDBA74",
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: 0.8,
  },
  rewardPanel: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "stretch",
    gap: 10,
    marginTop: 10,
  },
  nextChallengeBox: {
    display: "grid",
    gap: 3,
    minHeight: 48,
    padding: "8px 10px",
    borderRadius: 14,
    background: "linear-gradient(135deg, rgba(193,18,31,0.16), rgba(212,175,55,0.09))",
    border: "1px solid rgba(212,175,55,0.16)",
    textAlign: "left",
  },
  rewardLabel: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: 1000,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  streakPill: {
    minWidth: 88,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 12px",
    borderRadius: 14,
    background: "rgba(0,0,0,0.36)",
    border: "1px solid rgba(251,146,60,0.26)",
    color: "#FDBA74",
    fontSize: 13,
    fontWeight: 1000,
    whiteSpace: "nowrap",
  },
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginTop: 10,
  },
  resultItem: {
    display: "grid",
    gap: 6,
    padding: 10,
    borderRadius: 12,
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: 800,
  },
  sessionSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    marginTop: 10,
  },
  summaryItem: {
    display: "grid",
    gap: 4,
    padding: "10px 8px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: 850,
  },
  aheadText: {
    margin: "8px 0 0",
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
    fontWeight: 850,
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
    background: "linear-gradient(90deg, #C1121F 0%, #F97316 58%, #D4AF37 100%)",
    boxShadow: "0 0 18px rgba(249,115,22,0.42)",
    transition: "width 420ms cubic-bezier(0.16,1,0.3,1)",
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
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
    marginTop: 12,
  },
  saveButton: {
    minHeight: 42,
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
    minHeight: 42,
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 14,
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
  reelsButton: {
    minHeight: 42,
    border: "1px solid rgba(212,175,55,0.32)",
    borderRadius: 14,
    background: "rgba(212,175,55,0.1)",
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: 950,
    cursor: "pointer",
  },
  shareMiniButton: {
    minHeight: 38,
    width: "fit-content",
    justifySelf: "center",
    padding: "0 14px",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 999,
    background: "rgba(255,255,255,0.055)",
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: 900,
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
