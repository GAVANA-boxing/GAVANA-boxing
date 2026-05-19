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
import { getChallengeRank } from "@/lib/utils";
import { calculateTrainingScore, computeScoreBreakdown, getChallengeComparisonPercent, getChallengeStreakBonus } from "@/lib/trainHelpers";
import { writeChallengeAttempt, updateUserTrainingProfile } from "@/lib/analytics";
import { checkAndAwardBadges } from "@/lib/badges";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/train/trainStyles";
import TrainResultModal from "@/components/train/TrainResultModal";
import PreGameCard from "@/components/train/PreGameCard";
import { getLocalDateKey, getPreviousLocalDateKey } from "@/lib/utils";

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

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const stopHandledRef = useRef(false);
  const challengeSavedRef = useRef(false);

  const [cameraState, setCameraState] = useState("checking");
  const [cameraRetryKey, setCameraRetryKey] = useState(0);
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
  const [rankUpInfo, setRankUpInfo] = useState(null);
  const [error, setError] = useState("");
  const [missionJustCompleted, setMissionJustCompleted] = useState(false);
  const [missionStreakBonus, setMissionStreakBonus] = useState(0);
  const [missionNewStreak, setMissionNewStreak] = useState(0);

  // Session stats for pre-session panel & sparkline
  const [sessionHistory, setSessionHistory] = useState([]);
  const [weeklySessionCount, setWeeklySessionCount] = useState(0);
  const [userStreak, setUserStreak] = useState(0);

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

  // Load session history, weekly count, and streak for pre-session panel
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;

    async function loadSessionStats() {
      try {
        const [userSnap, sessSnap] = await Promise.all([
          getDoc(doc(db, "users", user.uid)),
          getDocs(query(collection(db, "training_sessions"), where("userId", "==", user.uid))),
        ]);
        if (!active) return;

        const userData = userSnap.exists() ? userSnap.data() : {};
        setUserStreak(Number(userData.dailyStreak) || 0);

        const sessions = sessSnap.docs
          .map(d => d.data())
          .filter(d => d.type === "training" && Number.isFinite(Number(d.score)));

        sessions.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        setSessionHistory(sessions.slice(0, 5).map(d => Number(d.score)));

        const now = new Date();
        const dayOfWeek = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
        monday.setHours(0, 0, 0, 0);

        const weeklyCount = sessions.filter(d => {
          const ts = d.createdAt?.seconds ? new Date(d.createdAt.seconds * 1000) : null;
          return ts && ts >= monday;
        }).length;
        setWeeklySessionCount(weeklyCount);
      } catch {
        // silent
      }
    }

    loadSessionStats();
    return () => { active = false; };
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
    setCameraState("checking");

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (active) setCameraState("unsupported");
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
        if (active) setCameraState("denied");
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
  }, [cameraRetryKey]);

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
            setError(t("trainRecordError"));
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

      let rankUpData = null;
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
        const prevRank = getFighterRank(Number(userData.xp) || 0);
        const nextRank = getFighterRank(nextXP);
        if (prevRank.key !== nextRank.key) rankUpData = nextRank;

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
      if (rankUpData) setRankUpInfo(rankUpData);
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
                      color: liveScore >= targetScore ? "#34D399" : GOLD,
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
                      : liveScore > ghostScore ? GOLD
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

