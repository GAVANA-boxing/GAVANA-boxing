"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { addDoc, collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, setDoc, where } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import DailyMission from "@/components/DailyMission";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { createChallengeAttemptNotification, createChallengeBeatenNotification, createPvpNotification } from "@/lib/notifications";
import { getCurrentSeasonId } from "@/lib/season";
import { calculateChallengeXP, calculateUserXP, getFighterRank, getRankProgress } from "@/lib/xp";
import { writeChallengeAttempt, updateUserTrainingProfile } from "@/lib/analytics";
import { checkAndAwardBadges } from "@/lib/badges";

const RECORD_SECONDS = 10;
const CHALLENGES = {
  "jab-minute": { titleKey: "challengeJabTitle", seconds: 60 },
  "speed-test": { titleKey: "challengeSpeedTitle", seconds: 20 },
  "combo-master": { titleKey: "challengeComboTitle", seconds: 30 },
};

function calculateTrainingScore(hits, sessionSeconds) {
  const targetHits = Math.max(1, Math.round(sessionSeconds * 1.5));
  const ratio = Math.min(1, hits / targetHits);
  return Number((ratio * 10).toFixed(1));
}

function computeScoreBreakdown(score, hitCount, sessionSeconds) {
  const maxHits = Math.max(1, sessionSeconds * 2);
  const hitRate = hitCount / maxHits;
  const hitsPerSec = hitCount / Math.max(1, sessionSeconds);
  const accuracy = Number(Math.min(10, hitRate * 12).toFixed(1));
  const speed = Number(Math.min(10, hitsPerSec * 5).toFixed(1));
  const power = Number(Math.min(10, score * 1.05).toFixed(1));
  const consistency = Number(Math.min(10, Math.max(0, score - (10 - score) * 0.15)).toFixed(1));
  return { accuracy, speed, power, consistency };
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
  const [trainSource, setTrainSource] = useState(null);
  const [trainSourceUserId, setTrainSourceUserId] = useState(null);
  const [creatorBestScore, setCreatorBestScore] = useState(null);
  const [challengeUserId, setChallengeUserId] = useState(null);
  const [opponentUsername, setOpponentUsername] = useState(null);
  const [pvpResult, setPvpResult] = useState(null);
  const [pvpSaved, setPvpSaved] = useState(false);
  const pvpSavedRef = useRef(false);
  const [challengeSaving, setChallengeSaving] = useState(false);
  const [challengeSaved, setChallengeSaved] = useState(false);
  const [error, setError] = useState("");
  const [missionJustCompleted, setMissionJustCompleted] = useState(false);
  const [missionStreakBonus, setMissionStreakBonus] = useState(0);
  const [missionNewStreak, setMissionNewStreak] = useState(0);

  // Live game state
  const [comboCount, setComboCount] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const [liveScore, setLiveScore] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState(null);
  const [showGo, setShowGo] = useState(false);
  const isRecordingRef = useRef(false);
  const hitTimerRef = useRef(null);
  const hitCountRef = useRef(0);
  const liveScoreRef = useRef(0);
  const audioCtxRef = useRef(null);

  // Ghost AI state
  const [ghostBestScore, setGhostBestScore] = useState(null);
  const [ghostScore, setGhostScore] = useState(0);
  const [ghostEnabled, setGhostEnabled] = useState(true);
  const ghostBestScoreRef = useRef(null);
  const ghostIntervalRef = useRef(null);

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
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setReelId(params.get("reelId") || null);
    setChallengeId(params.get("challengeId") || null);
    setTrainSource(params.get("source") || null);
    setTrainSourceUserId(params.get("reelCreatorId") || params.get("userId") || null);
    setChallengeUserId(params.get("challengeUserId") || null);
    const parsedCreatorBest = Number(params.get("creatorBestScore"));
    setCreatorBestScore(Number.isFinite(parsedCreatorBest) && parsedCreatorBest > 0 ? parsedCreatorBest : null);
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

  // Load PvP opponent username
  useEffect(() => {
    if (!challengeUserId) return;
    let active = true;

    async function loadOpponent() {
      try {
        const snap = await getDoc(doc(db, "users", challengeUserId));
        if (!active) return;
        const data = snap.exists() ? snap.data() : {};
        setOpponentUsername(data.username || data.displayName || "Opponent");
      } catch (e) {
        if (active) setOpponentUsername("Opponent");
      }
    }

    loadOpponent();
    return () => { active = false; };
  }, [challengeUserId]);

  // Load ghost — best training session for this reelId
  useEffect(() => {
    if (!user?.uid || !reelId || challengeUserId) return;
    let active = true;

    async function loadGhost() {
      try {
        const snap = await getDocs(query(
          collection(db, "training_sessions"),
          where("userId", "==", user.uid),
          where("reelId", "==", reelId)
        ));
        if (!active) return;
        const scores = snap.docs
          .map(d => d.data())
          .filter(d => d.type === "training" && Number.isFinite(Number(d.score)))
          .map(d => Number(d.score));
        if (!scores.length) return;
        const best = Math.max(...scores);
        setGhostBestScore(best);
        ghostBestScoreRef.current = best;
      } catch (e) {
        // silent — ghost won't show
      }
    }

    loadGhost();
    return () => { active = false; };
  }, [user?.uid, reelId, challengeUserId]);

  // Load ghost — best challenge result for challengeId-based flow
  useEffect(() => {
    if (!user?.uid || !challengeId || challengeUserId) return;
    let active = true;

    async function loadChallengeGhost() {
      try {
        const snap = await getDocs(query(
          collection(db, "challenge_results"),
          where("userId", "==", user.uid),
          where("challengeId", "==", challengeId)
        ));
        if (!active) return;
        const scores = snap.docs
          .map(d => d.data())
          .filter(d => Number.isFinite(Number(d.score)))
          .map(d => Number(d.score));
        if (!scores.length) return;
        const best = Math.max(...scores);
        setGhostBestScore(best);
        ghostBestScoreRef.current = best;
      } catch (e) {
        // silent — ghost won't show
      }
    }

    loadChallengeGhost();
    return () => { active = false; };
  }, [user?.uid, challengeId, challengeUserId]);

  // Auto-save PvP result and notify opponent when training finishes in PvP mode
  useEffect(() => {
    if (!result || !challengeUserId || !targetScore || !user?.uid || pvpSavedRef.current) return;

    pvpSavedRef.current = true;
    const won = result.score > targetScore;
    const pvpRes = won ? "win" : "lose";
    setPvpResult(pvpRes);

    async function savePvpAndNotify() {
      try {
        const challengerSnap = await getDoc(doc(db, "users", user.uid));
        const challengerData = challengerSnap.exists() ? challengerSnap.data() : {};
        const challengerName = challengerData.username || challengerData.displayName || user.displayName || "Fighter";
        const opponentName = opponentUsername || "Opponent";

        await addDoc(collection(db, "pvp_results"), {
          challengerId: user.uid,
          challengerName,
          opponentId: challengeUserId,
          opponentName,
          reelId: reelId || null,
          challengerScore: result.score,
          opponentScore: targetScore,
          result: pvpRes,
          seasonId: getCurrentSeasonId(),
          createdAt: serverTimestamp(),
          locale,
        });
        setPvpSaved(true);

        createPvpNotification({
          opponentId: challengeUserId,
          challengerId: user.uid,
          challengerName,
          reelId: reelId || null,
          challengerScore: result.score,
          opponentScore: targetScore,
          result: pvpRes,
        }).catch(console.error);
      } catch (err) {
        console.error("Failed to save PvP result:", err);
      }
    }

    savePvpAndNotify();
  }, [result, challengeUserId, targetScore, user?.uid, reelId, opponentUsername]);

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
    if (ghostIntervalRef.current) {
      window.clearInterval(ghostIntervalRef.current);
      ghostIntervalRef.current = null;
    }

    setSecondsLeft(0);
    setPhase("result");
    const finalScore = liveScoreRef.current;
    // Use the same formula as the Firestore transaction so the display matches what's stored
    const xpGained = calculateChallengeXP(finalScore, getChallengeRank(finalScore));
    const breakdown = computeScoreBreakdown(finalScore, hitCountRef.current, sessionSeconds);
    setResult({
      score: finalScore,
      xpGained,
      rankProgress: getRankProgress(currentXP + xpGained),
      hitCount: hitCountRef.current,
      breakdown,
    });
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
    liveScoreRef.current = 0;
    setComboCount(0);
    setHitCount(0);
    setLiveScore(0);
    setGhostScore(0);

    // Ghost progression — linear from 0 → ghostBestScore over sessionSeconds
    if (ghostBestScoreRef.current !== null && ghostEnabled) {
      const ghostTarget = ghostBestScoreRef.current;
      const intervalMs = 200;
      const steps = (sessionSeconds * 1000) / intervalMs;
      const increment = ghostTarget / steps;
      let ghostProgress = 0;
      ghostIntervalRef.current = window.setInterval(() => {
        if (!isRecordingRef.current) {
          window.clearInterval(ghostIntervalRef.current);
          return;
        }
        ghostProgress = Math.min(ghostTarget, ghostProgress + increment);
        const rounded = Number(ghostProgress.toFixed(1));
        setGhostScore((prev) => (prev !== rounded ? rounded : prev));
      }, intervalMs);
    }

    const FEEDBACK = [
      "Faster! 💨", "Good! ✓", "Guard up!", "Nice combo!",
      "Keep going!", "Power! 💪", "Speed up!", "Snap it!", "Nice jab!", "Stay tight!",
    ];

    function playPunchSound() {
      try {
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();
        const now = ctx.currentTime;
        // Low thud: sine oscillator 180→60 Hz over 70ms
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.07);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) {
        // Fail silently
      }
    }

    function scheduleHit() {
      const delay = 500 + Math.floor(Math.random() * 400);
      hitTimerRef.current = window.setTimeout(() => {
        if (!isRecordingRef.current) return;
        hitCountRef.current += 1;
        const newScore = calculateTrainingScore(hitCountRef.current, sessionSeconds);
        liveScoreRef.current = newScore;
        setLiveScore(newScore);
        setComboCount((c) => c + 1);
        setHitCount((c) => c + 1);
        setIsFlashing(true);
        window.setTimeout(() => setIsFlashing(false), 130);
        playPunchSound();
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(30);
        }
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
      if (ghostIntervalRef.current) {
        window.clearInterval(ghostIntervalRef.current);
        ghostIntervalRef.current = null;
      }
    };
  }, [phase, sessionSeconds]);

  const handleStart = () => {
    // Warm up AudioContext on direct user interaction so browsers allow sound
    try {
      if (typeof window !== "undefined") {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
            audioCtxRef.current = new AudioCtx();
          } else if (audioCtxRef.current.state === "suspended") {
            audioCtxRef.current.resume();
          }
        }
      }
    } catch (e) {
      // Fail silently
    }
    setError("");
    setResult(null);
    setSaved(false);
    setSavedAttemptNumber(null);
    setChallengeSaved(false);
    challengeSavedRef.current = false;
    setPvpResult(null);
    setPvpSaved(false);
    pvpSavedRef.current = false;
    setComboCount(0);
    setHitCount(0);
    setLiveScore(0);
    setGhostScore(0);
    setIsFlashing(false);
    setLiveFeedback(null);
    setShowGo(false);
    hitCountRef.current = 0;
    liveScoreRef.current = 0;
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
    setPvpResult(null);
    setPvpSaved(false);
    pvpSavedRef.current = false;
    setSecondsLeft(sessionSeconds);
    setCountdown(null);
    setPhase("idle");
    setComboCount(0);
    setHitCount(0);
    setLiveScore(0);
    setGhostScore(0);
    setIsFlashing(false);
    setLiveFeedback(null);
    setShowGo(false);
    hitCountRef.current = 0;
    liveScoreRef.current = 0;
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
          seasonId: getCurrentSeasonId(),
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

    const scoreStr = result.score.toFixed(1);
    const baseText = t("shareChallengeResult")
      ? `${t("shareChallengeResult")} — ${scoreStr}/10 🥊`
      : `I scored ${scoreStr}/10 in GAVANA 🥊 Can you beat me?`;

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({ score: scoreStr });
    if (reelId) params.set("reelId", reelId);
    if (user?.uid) params.set("challengeUserId", user.uid);
    const challengeUrl = reelId ? `${baseUrl}/${locale}/train?${params.toString()}` : "";
    const fullText = challengeUrl ? `${baseText}\n${challengeUrl}` : baseText;

    try {
      if (navigator.share) {
        await navigator.share({ title: "GAVANA Boxing", text: baseText, ...(challengeUrl ? { url: challengeUrl } : {}) });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullText);
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
        .map((d) => d.data())
        .filter((session) => session.type === "training").length;
      const attemptNumber = previousAttempts + 1;

      await addDoc(collection(db, "training_sessions"), {
        userId: user.uid,
        reelId,
        score: result.score,
        xpGained: result.xpGained,
        attemptNumber,
        rankProgress: result.rankProgress,
        breakdown: result.breakdown || null,
        hitCount: result.hitCount || 0,
        createdAt: serverTimestamp(),
        type: "training",
        locale,
        source: "train_screen",
      });

      // Daily mission completion
      const todayKey = getLocalDateKey();
      const yesterdayKey = getPreviousLocalDateKey();
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      const alreadyCompleted = userData.dailyMissionCompleted === todayKey;

      if (!alreadyCompleted) {
        const MISSION_XP = 50;
        const lastDate = String(userData.lastTrainingDate || "");
        const currentStreak = Number(userData.dailyStreak) || 0;
        const newStreak = lastDate === yesterdayKey ? currentStreak + 1 : 1;
        const streakBonus = newStreak === 3 ? 100 : newStreak === 7 ? 250 : 0;
        const totalBonus = MISSION_XP + streakBonus;
        const currentStoredXP = Number(userData.xp) || 0;
        const newBest = Math.max(newStreak, Number(userData.bestDailyStreak) || 0);

        await setDoc(userRef, {
          dailyMissionCompleted: todayKey,
          lastTrainingDate: todayKey,
          dailyStreak: newStreak,
          bestDailyStreak: newBest,
          xp: currentStoredXP + totalBonus,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        setMissionJustCompleted(true);
        setMissionStreakBonus(streakBonus);
        setMissionNewStreak(newStreak);
      } else {
        // Still update lastTrainingDate even if mission already completed today
        await setDoc(userRef, { lastTrainingDate: todayKey }, { merge: true });
      }

      setSaved(true);
      setSavedAttemptNumber(attemptNumber);

      // Analytics + badges (non-critical, fire and forget)
      if (reelId) {
        writeChallengeAttempt({
          userId: user.uid,
          reelId,
          score: result.score,
          hitCount: result.hitCount || 0,
          attemptNumber,
        }).catch(() => {});
      }

      const newStreak = Number((await getDoc(doc(db, "users", user.uid))).data()?.dailyStreak) || 1;
      const breakdown = result.breakdown || {};
      updateUserTrainingProfile(user.uid, {
        lastScore: result.score,
        dailyStreak: newStreak,
        totalAttempts: attemptNumber,
      }).catch(() => {});

      checkAndAwardBadges(user.uid, {
        totalAttempts: attemptNumber,
        dailyStreak: newStreak,
        accuracy: breakdown.accuracy,
        speed: breakdown.speed,
        category: "boxing",
      }).catch(() => {});

      // Notify the reel creator that someone attempted their challenge
      if (reelId && trainSourceUserId) {
        createChallengeAttemptNotification({
          reelCreatorId: trainSourceUserId,
          actorId: user.uid,
          actorName: user.displayName || user.email?.split("@")[0] || "Someone",
          actorPhotoURL: user.photoURL || "",
          reelId,
          score: result.score,
        }).catch(() => {});

        // Notify creator if challenger beats their best score
        if (creatorBestScore != null && result.score > creatorBestScore) {
          createChallengeBeatenNotification({
            reelCreatorId: trainSourceUserId,
            actorId: user.uid,
            actorName: user.displayName || user.email?.split("@")[0] || "Someone",
            actorPhotoURL: user.photoURL || "",
            reelId,
            score: result.score,
          }).catch(() => {});
        }
      }
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
                <span style={styles.liveScoreHud}>{liveScore.toFixed(1)}</span>
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

              {/* PvP target HUD — top-right (replaces ghost HUD in PvP mode) */}
              {challengeUserId && targetScore && (
                <div style={styles.ghostHud}>
                  <div style={styles.ghostHudRow}>
                    <span style={styles.ghostHudYouLabel}>{t("pvpYouLabel")}</span>
                    <span style={{
                      ...styles.ghostHudYouScore,
                      color: liveScore >= targetScore ? "#34D399" : "#D4AF37",
                    }}>
                      {liveScore.toFixed(1)}
                    </span>
                  </div>
                  <span style={styles.ghostHudSep}>vs</span>
                  <div style={styles.ghostHudRow}>
                    <span style={styles.ghostHudGhostLabel}>🎯</span>
                    <span style={styles.ghostHudGhostScore}>{targetScore.toFixed(1)}</span>
                  </div>
                </div>
              )}

              {/* Ghost vs You HUD — top-right */}
              {!challengeUserId && ghostBestScore !== null && ghostEnabled && (
                <div style={styles.ghostHud}>
                  <div style={styles.ghostHudRow}>
                    <span style={styles.ghostHudYouLabel}>YOU</span>
                    <span style={styles.ghostHudYouScore}>{liveScore.toFixed(1)}</span>
                  </div>
                  <span style={styles.ghostHudSep}>vs</span>
                  <div style={styles.ghostHudRow}>
                    <span style={styles.ghostHudGhostLabel}>👻</span>
                    <span style={styles.ghostHudGhostScore}>{ghostScore.toFixed(1)}</span>
                  </div>
                  <span style={{
                    ...styles.ghostHudState,
                    color: liveScore > ghostBestScore ? "#34D399"
                      : liveScore >= ghostBestScore - 0.5 ? "#FB923C"
                      : liveScore > ghostScore ? "#D4AF37"
                      : "rgba(255,255,255,0.4)",
                  }}>
                    {liveScore > ghostBestScore ? "NEW BEST"
                      : liveScore >= ghostBestScore - 0.5 ? "ALMOST!"
                      : liveScore > ghostScore ? "AHEAD"
                      : "BEHIND"}
                  </span>
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

        {/* Pre-game competitive context card */}
        {phase === "idle" && (
          <div style={styles.contextCard}>
            {(ghostBestScore !== null || targetScore || (challengeUserId && opponentUsername)) ? (
              <div style={styles.contextStatsRow}>
                {!challengeUserId && ghostBestScore !== null && (
                  <div style={styles.contextStat}>
                    <span style={styles.contextStatLabel}>👻 YOUR BEST</span>
                    <span style={styles.contextStatValue}>{ghostBestScore.toFixed(1)}<span style={styles.contextStatUnit}>/10</span></span>
                  </div>
                )}
                {!challengeUserId && targetScore && (
                  <div style={styles.contextStat}>
                    <span style={styles.contextStatLabel}>🎯 TARGET</span>
                    <span style={{ ...styles.contextStatValue, color: "#FDE68A" }}>{targetScore.toFixed(1)}<span style={styles.contextStatUnit}>/10</span></span>
                  </div>
                )}
                {challengeUserId && targetScore && (
                  <div style={{ ...styles.contextStat, flex: 1, alignItems: "center" }}>
                    <span style={styles.contextStatLabel}>🆚 BEAT</span>
                    <span style={{ ...styles.contextStatValue, color: "#93C5FD", fontSize: 17 }}>
                      {opponentUsername || "Opponent"} · {targetScore.toFixed(1)}/10
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.contextEmptyMsg}>
                {reelId ? "Set your first score on this challenge" : "Ready to train"}
              </div>
            )}
            {ghostEnabled && ghostBestScore !== null && !challengeUserId && (
              <div style={styles.contextGhostNote}>👻 Ghost mode active — beat {ghostBestScore.toFixed(1)}/10</div>
            )}
          </div>
        )}

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

      {result && (
        <div style={styles.modalWrap}>
          <div style={styles.modalOverlay} />
          <section style={styles.modal}>
            {/* TOP — score hero */}
            <div style={styles.modalTop}>
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
                      <span>{t("trainXpGained")}</span>
                      <strong style={{ color: "#D4AF37" }}>+{result.xpGained}</strong>
                    </div>
                    <div style={{ ...styles.resultItem, gridColumn: "1 / -1" }}>
                      <span>{t("challengeComparison")}</span>
                      <strong>{t("challengeBeatPlayers").replace("{n}", getChallengeComparisonPercent(result.score))}</strong>
                    </div>
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
                  </>
                )}
              </div>
              {!activeChallenge && (
                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressFill, width: `${result.rankProgress}%` }} />
                </div>
              )}
            </div>

            {/* MIDDLE — detail breakdown (scrollable) */}
            <div style={styles.modalMiddle}>
              {challengeUserId && pvpResult && (
                <div style={pvpResult === "win" ? styles.pvpWinBanner : styles.pvpLoseBanner}>
                  <div style={styles.pvpResultBadge}>
                    {pvpResult === "win" ? t("pvpWin") : t("pvpLose")}
                  </div>
                  <div style={styles.pvpResultHeadline}>
                    {pvpResult === "win"
                      ? t("pvpYouWon").replace("{username}", opponentUsername || "them")
                      : t("pvpYouLost")}
                  </div>
                  <div style={styles.pvpResultScoreRow}>
                    <div style={styles.pvpResultScoreCell}>
                      <span style={styles.pvpResultScoreNum}>{result.score.toFixed(1)}</span>
                      <span style={styles.pvpResultScoreLbl}>{t("pvpYouLabel")}</span>
                    </div>
                    <div style={styles.pvpResultScoreVs}>{t("pvpVsLabel")}</div>
                    <div style={styles.pvpResultScoreCell}>
                      <span style={styles.pvpResultScoreNum}>{targetScore?.toFixed(1)}</span>
                      <span style={styles.pvpResultScoreLbl}>@{opponentUsername || "?"}</span>
                    </div>
                  </div>
                  {(() => {
                    const diff = result.score - (targetScore || 0);
                    return (
                      <div style={{ ...styles.pvpResultDiff, color: diff >= 0 ? "#34D399" : "#F87171" }}>
                        {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
                      </div>
                    );
                  })()}
                </div>
              )}

              {!challengeUserId && ghostBestScore !== null && (
                <div style={result.score > ghostBestScore ? styles.newBestCard : styles.vsGhostCard}>
                  {result.score > ghostBestScore && (
                    <div style={styles.newBestBadge}>🏆 Өмнөх оноогоо эвдлээ!</div>
                  )}
                  <div style={styles.vsCompareRow}>
                    <div style={styles.vsCompareCell}>
                      <span style={styles.vsCompareLbl}>ШИНЭ</span>
                      <span style={{ ...styles.vsCompareScore, color: result.score > ghostBestScore ? "#34D399" : "#fff" }}>
                        {result.score.toFixed(1)}
                      </span>
                    </div>
                    <div style={{ ...styles.vsCompareDelta, color: result.score >= ghostBestScore ? "#34D399" : "#F87171" }}>
                      {result.score >= ghostBestScore ? `+${(result.score - ghostBestScore).toFixed(1)}` : (result.score - ghostBestScore).toFixed(1)}
                    </div>
                    <div style={styles.vsCompareCell}>
                      <span style={styles.vsCompareLbl}>ХАМГИЙН ӨНДӨР</span>
                      <span style={styles.vsCompareScore}>{ghostBestScore.toFixed(1)}</span>
                    </div>
                  </div>
                  {result.score < ghostBestScore && (
                    <div style={styles.almostMsg}>
                      {(ghostBestScore - result.score) <= 0.5
                        ? "🔥 Бараг боллоо — дахин оролдоод давна"
                        : `${(ghostBestScore - result.score).toFixed(1)} оноо дутлаа — дахин оролдоод давна`}
                    </div>
                  )}
                </div>
              )}

              {!activeChallenge && result.breakdown && (
                <div style={styles.breakdownCard}>
                  <p style={styles.breakdownTitle}>{t("scoreBreakdown")}</p>
                  <div style={styles.breakdownGrid}>
                    {[
                      { key: "scoreAccuracy", val: result.breakdown.accuracy, color: "#60A5FA" },
                      { key: "scoreSpeed", val: result.breakdown.speed, color: "#F59E0B" },
                      { key: "scorePower", val: result.breakdown.power, color: "#F87171" },
                      { key: "scoreConsistency", val: result.breakdown.consistency, color: "#34D399" },
                    ].map(({ key, val, color }) => (
                      <div key={key} style={styles.breakdownItem}>
                        <span style={styles.breakdownLbl}>{t(key)}</span>
                        <span style={{ ...styles.breakdownVal, color }}>{val.toFixed(1)}</span>
                        <div style={styles.breakdownTrack}>
                          <div style={{ ...styles.breakdownFill, width: `${val * 10}%`, background: color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {missionJustCompleted && (
                <div style={styles.missionCompleteBanner}>
                  <div style={styles.missionCompleteTitle}>🎯 {t("missionDailyComplete")}</div>
                  <div style={styles.missionCompleteXP}>
                    +50 XP
                    {missionStreakBonus > 0 && (
                      <span style={styles.missionStreakBonusText}>
                        {" "}+ {missionStreakBonus} XP 🔥{missionNewStreak} {t("missionStreakBonus")}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM — action buttons */}
            <div style={styles.modalBottom}>
              <div style={styles.modalActions}>
                <button type="button" style={styles.tryAgainButton} onClick={handleTryAgain}>
                  {activeChallenge ? t("challengeTryAgain") : t("trainTryAgain")}
                </button>
                {!activeChallenge && (
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
                )}
                {activeChallenge && (
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
                )}
                <button
                  type="button"
                  style={styles.shareResultButton}
                  onClick={activeChallenge ? handleShareChallenge : handleShareTraining}
                >
                  {t("share") || "Share"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      <DailyMission locale={locale} />
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
  breakdownCard: {
    marginTop: 14,
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
  },
  breakdownTitle: {
    margin: "0 0 12px",
    fontSize: 11,
    fontWeight: 900,
    color: "rgba(255,255,255,0.65)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  breakdownGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px 16px",
  },
  breakdownItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  breakdownLbl: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontWeight: 700,
  },
  breakdownVal: {
    fontSize: 20,
    fontWeight: 1000,
    lineHeight: 1,
  },
  breakdownTrack: {
    height: 4,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginTop: 2,
  },
  breakdownFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.6s ease",
  },
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
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
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
  pvpBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 14,
    background: "rgba(96,165,250,0.1)",
    border: "1px solid rgba(96,165,250,0.3)",
  },
  pvpBannerVs: {
    fontSize: 20,
    flexShrink: 0,
  },
  pvpBannerText: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  pvpBannerLabel: {
    color: "#93C5FD",
    fontSize: 13,
    fontWeight: 900,
    lineHeight: 1.2,
  },
  pvpBannerScore: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: 1000,
    lineHeight: 1,
  },
  pvpWinBanner: {
    margin: "14px 0 0",
    padding: "14px 16px",
    borderRadius: 14,
    background: "rgba(52,211,153,0.12)",
    border: "1px solid rgba(52,211,153,0.35)",
    textAlign: "center",
  },
  pvpLoseBanner: {
    margin: "14px 0 0",
    padding: "14px 16px",
    borderRadius: 14,
    background: "rgba(193,18,31,0.12)",
    border: "1px solid rgba(193,18,31,0.35)",
    textAlign: "center",
  },
  pvpResultBadge: {
    display: "inline-block",
    padding: "3px 14px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 1000,
    letterSpacing: 2,
    textTransform: "uppercase",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    marginBottom: 8,
  },
  pvpResultHeadline: {
    fontSize: 15,
    fontWeight: 1000,
    color: "#fff",
    marginBottom: 10,
  },
  pvpResultScoreRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 6,
  },
  pvpResultScoreCell: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  pvpResultScoreNum: {
    fontSize: 28,
    fontWeight: 1000,
    lineHeight: 1,
    color: "#fff",
  },
  pvpResultScoreLbl: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    fontWeight: 700,
  },
  pvpResultScoreVs: {
    fontSize: 12,
    color: "rgba(255,255,255,0.62)",
    fontWeight: 700,
  },
  pvpResultDiff: {
    fontSize: 20,
    fontWeight: 1000,
    marginBottom: 6,
  },
  pvpResultSaved: {
    fontSize: 11,
    color: "#34D399",
    fontWeight: 800,
    marginTop: 4,
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
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
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
    color: "rgba(255,255,255,0.62)",
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
    color: "rgba(255,255,255,0.65)",
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
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
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
  liveScoreHud: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: 1000,
    color: "#D4AF37",
    letterSpacing: 0.5,
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
  missionCompleteBanner: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 14,
    background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(52,211,153,0.10))",
    border: "1px solid rgba(212,175,55,0.35)",
    display: "grid",
    gap: 4,
    textAlign: "center",
  },
  missionCompleteTitle: {
    fontSize: 14,
    fontWeight: 1000,
    color: "#D4AF37",
    letterSpacing: 0.3,
  },
  missionCompleteXP: {
    fontSize: 18,
    fontWeight: 1000,
    color: "#34D399",
  },
  missionStreakBonusText: {
    color: "#FB923C",
    fontSize: 14,
  },
  missionCompleteSub: {
    fontSize: 11,
    color: "#888",
    fontWeight: 700,
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
    background: "linear-gradient(180deg, #151111, #080808)",
    border: "1px solid rgba(212,175,55,0.2)",
    boxShadow: "0 -24px 70px rgba(0,0,0,0.54)",
    textAlign: "center",
    maxHeight: "min(600px, calc(100vh - 120px))",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalTop: {
    padding: "18px 20px 14px",
    flexShrink: 0,
  },
  modalMiddle: {
    overflowY: "auto",
    padding: "0 20px",
    flex: 1,
  },
  modalBottom: {
    padding: "12px 20px 16px",
    flexShrink: 0,
    borderTop: "1px solid rgba(255,255,255,0.06)",
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
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
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
  ghostHud: {
    position: "absolute",
    top: 64,
    right: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    background: "rgba(0,0,0,0.62)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: 14,
    padding: "8px 14px",
    border: "1px solid rgba(255,255,255,0.14)",
    zIndex: 5,
    minWidth: 60,
  },
  ghostHudRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 1,
  },
  ghostHudYouLabel: {
    color: "#D4AF37",
    fontSize: 9,
    fontWeight: 1000,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  ghostHudYouScore: {
    color: "#D4AF37",
    fontSize: 20,
    fontWeight: 1000,
    lineHeight: 1,
  },
  ghostHudSep: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10,
    fontWeight: 700,
  },
  ghostHudGhostLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    lineHeight: 1,
  },
  ghostHudGhostScore: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 20,
    fontWeight: 1000,
    lineHeight: 1,
  },
  ghostToggleOn: {
    minHeight: 40,
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  ghostToggleOff: {
    minHeight: 40,
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    background: "transparent",
    color: "rgba(255,255,255,0.58)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  ghostWinBanner: {
    margin: "14px 0 0",
    padding: "12px 16px",
    borderRadius: 14,
    background: "rgba(52,211,153,0.12)",
    border: "1px solid rgba(52,211,153,0.35)",
    textAlign: "center",
    fontSize: 15,
    fontWeight: 1000,
    color: "#34D399",
  },
  ghostLoseBanner: {
    margin: "14px 0 0",
    padding: "12px 16px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    textAlign: "center",
    fontSize: 15,
    fontWeight: 1000,
    color: "rgba(255,255,255,0.65)",
  },
  ghostBestScoreRow: {
    marginTop: 4,
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    fontWeight: 700,
  },
  ghostHudState: {
    marginTop: 5,
    fontSize: 8,
    fontWeight: 1000,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  // Pre-game context card
  contextCard: {
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  contextStatsRow: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  contextStat: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
  },
  contextStatLabel: {
    fontSize: 10,
    fontWeight: 900,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  contextStatValue: {
    fontSize: 24,
    fontWeight: 1000,
    color: "#fff",
    lineHeight: 1,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
  },
  contextStatUnit: {
    fontSize: 13,
    fontWeight: 700,
    color: "rgba(255,255,255,0.5)",
    marginLeft: 2,
  },
  contextEmptyMsg: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: 700,
    textAlign: "center",
    padding: "4px 0",
  },
  contextGhostNote: {
    fontSize: 11,
    color: "rgba(255,255,255,0.38)",
    fontWeight: 700,
    borderTop: "1px solid rgba(255,255,255,0.07)",
    paddingTop: 8,
  },

  // Result — new best / vs ghost comparison card
  newBestCard: {
    margin: "14px 0 0",
    padding: "14px 16px",
    borderRadius: 16,
    background: "linear-gradient(135deg, rgba(52,211,153,0.14), rgba(11,11,11,0.92))",
    border: "1px solid rgba(52,211,153,0.35)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "center",
  },
  vsGhostCard: {
    margin: "14px 0 0",
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "center",
  },
  newBestBadge: {
    fontSize: 11,
    fontWeight: 1000,
    letterSpacing: 1.6,
    color: "#34D399",
    textTransform: "uppercase",
  },
  vsCompareRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  vsCompareCell: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  vsCompareLbl: {
    fontSize: 9,
    fontWeight: 900,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  vsCompareScore: {
    fontSize: 30,
    fontWeight: 1000,
    color: "#fff",
    lineHeight: 1,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
  },
  vsCompareDelta: {
    fontSize: 18,
    fontWeight: 1000,
    minWidth: 44,
    textAlign: "center",
  },
  almostMsg: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    fontWeight: 700,
  },
};
