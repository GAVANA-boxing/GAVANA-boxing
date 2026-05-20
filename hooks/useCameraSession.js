"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { calculateChallengeXP, getRankProgress } from "@/lib/xp";
import { calculateTrainingScore, computeScoreBreakdown } from "@/lib/trainHelpers";
import { getChallengeRank } from "@/lib/utils";
import { usePunchDetector } from "@/hooks/usePunchDetector";

export function useCameraSession({
  sessionSeconds,
  currentXP,
  resetForNewSession,
  ghostBestScoreRef,
  setPvpResult,
  setPvpSaved,
  pvpSavedRef,
  t,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const stopHandledRef = useRef(false);

  const [cameraState, setCameraState] = useState("checking");
  const [cameraRetryKey, setCameraRetryKey] = useState(0);
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
  const hitTimerRef = useRef(null);
  const hitCountRef = useRef(0);
  const liveScoreRef = useRef(0);
  const audioCtxRef = useRef(null);

  const [ghostScore, setGhostScore] = useState(0);
  const [ghostEnabled, setGhostEnabled] = useState(true);
  const ghostIntervalRef = useRef(null);

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
        if (err.name === "NotFoundError") {
        } else {
        }
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
    if (ghostIntervalRef.current) {
      window.clearInterval(ghostIntervalRef.current);
      ghostIntervalRef.current = null;
    }

    setSecondsLeft(0);
    setPhase("result");
    const finalScore = liveScoreRef.current;
    const xpGained = calculateChallengeXP(finalScore, getChallengeRank(finalScore));
    const breakdown = computeScoreBreakdown(finalScore, hitCountRef.current, sessionSeconds);
    setResult({
      score: finalScore,
      xpGained,
      rankProgress: getRankProgress(currentXP + xpGained),
      hitCount: hitCountRef.current,
      breakdown,
    });
    resetForNewSession();
  }, [currentXP, resetForNewSession, sessionSeconds]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, countdown, sessionSeconds]); // t omitted — recreated every render, locale covers it

  useEffect(() => {
    if (phase !== "recording") return undefined;

    if (secondsLeft <= 0) {
      finishRecording();
      return undefined;
    }

    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, secondsLeft, finishRecording]);

  // Play a short impact sound when a punch is detected
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
      const freq = 140 + speed * 80; // faster punch = higher pitch
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
      gain.gain.setValueAtTime(0.3 + speed * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch { /* fail silently */ }
  }, []);

  // Called by punch detector when real motion punch is detected
  const onPunch = useCallback(({ type, speed }) => {
    if (!isRecordingRef.current) return;

    hitCountRef.current += 1;
    const newScore = calculateTrainingScore(hitCountRef.current, sessionSeconds);
    liveScoreRef.current = newScore;
    setLiveScore(newScore);
    setComboCount((c) => c + 1);
    setHitCount((c) => c + 1);
    setLastPunchType(type);
    setIsFlashing(true);
    window.setTimeout(() => setIsFlashing(false), 130);
    playPunchSound(speed);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(25);

    const FEEDBACK_BY_TYPE = {
      jab:   ["Snap it! ✓", "Double jab!", "Jab faster!", "Clean jab!", "Speed! ⚡"],
      cross:  ["Power! 💥", "Drive through!", "Rotate! 💪", "Nice cross!", "Hip into it!"],
    };
    const FEEDBACK_GENERIC = ["Guard up! 🛡", "Keep going!", "Stay tight!", "Breathe!", "Combo! 🔥"];
    const pool = FEEDBACK_BY_TYPE[type] || FEEDBACK_GENERIC;
    const text = pool[Math.floor(Math.random() * pool.length)];
    const id = Date.now();
    setLiveFeedback({ text, id });
    window.setTimeout(() => setLiveFeedback((prev) => (prev?.id === id ? null : prev)), 1200);
  }, [sessionSeconds, playPunchSound]);

  // Wire up real punch detection during recording
  usePunchDetector({
    videoRef,
    isActive: phase === "recording",
    onPunch,
  });

  useEffect(() => {
    if (phase !== "recording") {
      isRecordingRef.current = false;
      return;
    }

    isRecordingRef.current = true;
    hitCountRef.current = 0;
    liveScoreRef.current = 0;
    setComboCount(0);
    setHitCount(0);
    setLiveScore(0);
    setGhostScore(0);
    setLastPunchType(null);

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

    return () => {
      isRecordingRef.current = false;
      if (ghostIntervalRef.current) {
        window.clearInterval(ghostIntervalRef.current);
        ghostIntervalRef.current = null;
      }
    };
  }, [phase, sessionSeconds, ghostBestScoreRef, ghostEnabled]);

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
    } catch (e) {
      // Fail silently
    }
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
    liveScoreRef.current = 0;
  };

  return {
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
    handleStart,
    handleTryAgain,
    finishRecording,
  };
}
