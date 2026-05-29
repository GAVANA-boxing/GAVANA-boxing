"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { calculateChallengeXP, getRankProgress } from "@/lib/xp";
import { calculateTrainingScore, computeScoreBreakdown } from "@/lib/trainHelpers";
import { getChallengeRank } from "@/lib/utils";
import { usePunchDetector } from "@/hooks/usePunchDetector";
import { useMovementAnalyzer } from "@/hooks/useMovementAnalyzer";
import { DEFAULT_DRILL } from "@/lib/drillConfig";

export function useCameraSession({
  drillConfig = DEFAULT_DRILL,
  currentXP,
  resetForNewSession,
  ghostBestScoreRef,
  setPvpResult,
  setPvpSaved,
  pvpSavedRef,
  t,
}) {
  const sessionSeconds = drillConfig.durationSeconds;
  const targetMovements = drillConfig.targetMovements ?? null;

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const stopHandledRef = useRef(false);

  const [cameraState, setCameraState] = useState("checking");
  const [cameraRetryKey, setCameraRetryKey] = useState(0);
  const [facingMode, setFacingMode] = useState("user");
  const [phase, setPhase] = useState("idle");
  const [countdown, setCountdown] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(sessionSeconds);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [comboCount, setComboCount] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const [liveScore, setLiveScore] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState(null);
  const [showGo, setShowGo] = useState(false);
  const [lastPunchType, setLastPunchType] = useState(null);
  const isRecordingRef = useRef(false);
  const hitCountRef = useRef(0);
  const speedSumRef = useRef(0);
  const liveScoreRef = useRef(0);
  const audioCtxRef = useRef(null);

  const [ghostScore, setGhostScore] = useState(0);
  const [ghostEnabled, setGhostEnabled] = useState(true);
  const ghostIntervalRef = useRef(null);

  const [movementEvents, setMovementEvents] = useState([]);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const movementEventIdRef = useRef(0);

  // Wall-clock timer refs — completely independent of React renders
  const sessionEndTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  // Keep finishRecording accessible inside the interval without re-creating it
  const finishRecordingRef = useRef(null);

  // ── Camera setup ────────────────────────────────────────────────────────
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
          video: { facingMode },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setCameraState("ready");
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        if (active) setCameraState("denied");
      }
    }

    startCamera();

    return () => {
      active = false;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraRetryKey, facingMode]);

  useEffect(() => {
    if (cameraState === "ready" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraState]);

  // ── Finish recording ─────────────────────────────────────────────────────
  const finishRecording = useCallback(() => {
    if (stopHandledRef.current) return;
    stopHandledRef.current = true;

    if (recorderRef.current?.state === "recording") recorderRef.current.stop();

    isRecordingRef.current = false;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (ghostIntervalRef.current) {
      clearInterval(ghostIntervalRef.current);
      ghostIntervalRef.current = null;
    }

    setSecondsLeft(0);
    setPhase("result");
    const finalScore = liveScoreRef.current;
    const xpGained = calculateChallengeXP(finalScore, getChallengeRank(finalScore));
    const breakdown = computeScoreBreakdown(finalScore, hitCountRef.current, sessionSeconds, targetMovements);
    setResult({
      score: finalScore,
      xpGained,
      rankProgress: getRankProgress(currentXP + xpGained),
      hitCount: hitCountRef.current,
      breakdown,
    });
    resetForNewSession();
  }, [currentXP, resetForNewSession, sessionSeconds, targetMovements]);

  // Always keep the ref current so the wall-clock interval can call it
  useEffect(() => { finishRecordingRef.current = finishRecording; }, [finishRecording]);

  // ── Countdown ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "countdown" || countdown === null) return undefined;

    if (countdown <= 0) {
      setShowGo(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([60, 30, 60]);
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
          } catch {
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

    const timer = window.setTimeout(() => setCountdown((v) => v - 1), 1000);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, countdown, sessionSeconds]);

  // ── Wall-clock session timer ─────────────────────────────────────────────
  // Uses Date.now() as source of truth — unaffected by React renders or
  // punch detection state updates. Checks every 250ms for smooth display.
  useEffect(() => {
    if (phase !== "recording") {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    sessionEndTimeRef.current = Date.now() + sessionSeconds * 1000;

    timerIntervalRef.current = setInterval(() => {
      const msRemaining = sessionEndTimeRef.current - Date.now();
      const secsRemaining = Math.max(0, Math.ceil(msRemaining / 1000));
      setSecondsLeft(secsRemaining);
      if (msRemaining <= 0) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        finishRecordingRef.current?.();
      }
    }, 250);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [phase, sessionSeconds]); // no secondsLeft dep, no finishRecording dep

  // ── Punch sound ──────────────────────────────────────────────────────────
  const playPunchSound = useCallback((speed = 0.5) => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      const freq = 140 + speed * 80;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
      gain.gain.setValueAtTime(0.3 + speed * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch { /* fail silently */ }
  }, []);

  // ── Punch detection callback ─────────────────────────────────────────────
  const onPunch = useCallback(({ speed }) => {
    if (!isRecordingRef.current) return;

    hitCountRef.current += 1;
    speedSumRef.current += (speed ?? 0.5);
    const avgSpeed = speedSumRef.current / hitCountRef.current;
    const newScore = calculateTrainingScore(hitCountRef.current, sessionSeconds, targetMovements, avgSpeed);
    liveScoreRef.current = newScore;
    setLiveScore(newScore);
    setComboCount((c) => c + 1);
    setHitCount((c) => c + 1);
    setIsFlashing(true);
    window.setTimeout(() => setIsFlashing(false), 130);
    playPunchSound(speed);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(25);

    const FEEDBACK = ["Guard up! 🛡", "Keep going!", "Stay tight!", "Breathe!", "Move! 👊", "Hands up!", "Combo! 🔥", "Drive through!", "Rotate! 💪", "Speed! ⚡"];
    const text = FEEDBACK[Math.floor(Math.random() * FEEDBACK.length)];
    const id = Date.now();
    setLiveFeedback({ text, id });
    window.setTimeout(() => setLiveFeedback((prev) => (prev?.id === id ? null : prev)), 1200);
  }, [sessionSeconds, targetMovements, playPunchSound]);

  usePunchDetector({
    videoRef,
    isActive: phase === "recording",
    onPunch,
  });

  const onMovementEvent = useCallback((events) => {
    if (!isRecordingRef.current) return;
    setMovementEvents((prev) => [
      ...prev,
      ...events.map((ev) => ({
        ...ev,
        id: `${ev.type}-${++movementEventIdRef.current}`,
      })),
    ]);
  }, []);

  useMovementAnalyzer({
    videoRef,
    isActive: phase === "recording",
    onEvent: onMovementEvent,
  });

  // ── Recording phase init ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "recording") {
      isRecordingRef.current = false;
      return;
    }

    isRecordingRef.current = true;
    hitCountRef.current = 0;
    speedSumRef.current = 0;
    liveScoreRef.current = 0;
    setComboCount(0);
    setHitCount(0);
    setLiveScore(0);
    setGhostScore(0);
    setLastPunchType(null);
    setMovementEvents([]);
    movementEventIdRef.current = 0;
    setSessionStartTime(Date.now());

    if (ghostBestScoreRef.current !== null && ghostEnabled) {
      const ghostTarget = ghostBestScoreRef.current;
      const intervalMs = 200;
      const steps = (sessionSeconds * 1000) / intervalMs;
      const increment = ghostTarget / steps;
      let ghostProgress = 0;
      ghostIntervalRef.current = setInterval(() => {
        if (!isRecordingRef.current) {
          clearInterval(ghostIntervalRef.current);
          return;
        }
        ghostProgress = Math.min(ghostTarget, ghostProgress + increment);
        const rounded = Number(ghostProgress.toFixed(1));
        setGhostScore((prev) => (prev !== rounded ? rounded : prev));
      }, intervalMs);
    }

    return () => {
      isRecordingRef.current = false;
      if (ghostIntervalRef.current) {
        clearInterval(ghostIntervalRef.current);
        ghostIntervalRef.current = null;
      }
    };
  }, [phase, sessionSeconds, ghostBestScoreRef, ghostEnabled]);

  // ── Start / Try again ────────────────────────────────────────────────────
  const handleStart = () => {
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
    } catch { /* fail silently */ }
    setError("");
    setResult(null);
    resetForNewSession();
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
    speedSumRef.current = 0;
    liveScoreRef.current = 0;
    setCountdown(3);
    setPhase("countdown");
  };

  const handleTryAgain = () => {
    setError("");
    setResult(null);
    resetForNewSession();
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
    speedSumRef.current = 0;
    liveScoreRef.current = 0;
  };

  const toggleCamera = useCallback(() => {
    setFacingMode((m) => (m === "user" ? "environment" : "user"));
  }, []);

  return {
    videoRef,
    streamRef,
    recorderRef,
    chunksRef,
    cameraState, setCameraState,
    cameraRetryKey, setCameraRetryKey,
    facingMode, toggleCamera,
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
  };
}
