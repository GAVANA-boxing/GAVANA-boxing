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
import { ACADEMY_LESSONS } from "@/lib/academyLessons";
import TrainingFocusCard from "@/components/train/TrainingFocusCard";
import { useAcademyProgress } from "@/hooks/useAcademyProgress";
import { getDrillConfig } from "@/lib/drillConfig";
import { buildCoachSnapshot, buildCoachContext } from "@/lib/buildCoachContext";
import MilestoneCelebration from "@/components/MilestoneCelebration";
import { usePoseDetection } from "@/hooks/usePoseDetection";
import TechniquePicker from "@/components/train/TechniquePicker";
import { getPersonalConnection } from "@/lib/fighterPersonalConnection";
import { isBeginnerUser, getCurrentBeginnerLesson, getBeginnerProgress } from "@/lib/beginnerPath";
import { getTodaysDNAMission } from "@/lib/dnaDailyMissions";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";
import { getBelt, getBeltProgress, getNextBelt } from "@/lib/belts";
import dynamic from "next/dynamic";
const PoseDebugOverlay   = dynamic(() => import("@/components/train/PoseDebugOverlay"),   { ssr: false });
const DebugSessionPanel  = dynamic(() => import("@/components/train/DebugSessionPanel"),  { ssr: false });
const LivePunchCounter   = dynamic(() => import("@/components/train/LivePunchCounter"),   { ssr: false });

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
  const { recordSession } = useAcademyProgress({ user });

  const [debugEnabled, setDebugEnabled] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dailyMission, setDailyMission] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDebugEnabled(params.get("debug") === "1");
    setAutoStart(params.get("autostart") === "1");
    if (!localStorage.getItem("gavana_train_seen")) {
      setShowOnboarding(true);
      localStorage.setItem("gavana_train_seen", "1");
    }
    try {
      const stored = localStorage.getItem("gavana_daily_mission");
      if (stored) setDailyMission(JSON.parse(stored));
    } catch {}
  }, []);

  const {
    reelId, drillId, challengeId, trainSource, trainSourceUserId,
    challengeUserId, creatorBestScore, targetScore,
    currentXP, sessionHistory, weeklySessionCount, userStreak,
    bestDailyStreak, missionCompletedToday, totalSessionCount,
    opponentUsername, ghostBestScore, setGhostBestScore, ghostBestScoreRef,
    challengePostId: activeChallengePostId,
    challengePostData,
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
    recordingEnabled, setRecordingEnabled,
    recordedBlob,
    thumbnailBlob,
  } = useCameraSession({
    drillConfig,
    currentXP,
    resetForNewSession: (...args) => resetForNewSessionRef.current?.(...args),
    ghostBestScoreRef,
    setPvpResult: (...args) => setPvpResultRef.current?.(...args),
    setPvpSaved: (...args) => setPvpSavedRef.current?.(...args),
    pvpSavedRef,
    t,
    locale,
  });

  const { computeSessionSummary, getDebugInfo } = usePoseDetection({
    videoRef,
    isActive: phase === "recording",
  });

  const {
    saving, saved, savedAttemptNumber,
    challengeSaving, challengeSaved, challengeSavedRef,
    missionJustCompleted, missionStreakBonus, missionNewStreak,
    rankUpInfo, beltUpInfo,
    handleSave, handleSaveChallengeResult,
    handleShareChallenge, handleChallengeFriend, handleShareTraining,
    feedSharing, feedShared, sharedReelId,
    handleShareToFeed, handleShareAcademyToFeed,
    challengePosting, challengePosted, challengePostId,
    handleCreateChallengePost,
    challengeResponsePosting, challengeResponsePosted, challengeResponseId,
    handlePostChallengeResponse,
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

  // ── Post-session AI debrief ───────────────────────────────────────────────
  const [debrief, setDebrief]             = useState(null);
  const [debriefSource, setDebriefSource] = useState(null);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [focusTip, setFocusTip] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  const [dnaMilestone, setDnaMilestone] = useState(null);
  const [poseSessionSummary, setPoseSessionSummary] = useState(null);
  const [prevPoseMetrics, setPrevPoseMetrics] = useState(null);
  const [positionCue, setPositionCue] = useState(null);
  const [trackingRing, setTrackingRing] = useState(null);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [readinessStep, setReadinessStep] = useState(0); // 0/1/2
  const readinessShownRef = useRef(false);
  const [currentExperiment, setCurrentExperiment] = useState(null);
  const [experimentSessionCount, setExperimentSessionCount] = useState(0);
  const [userArchetype, setUserArchetype] = useState(null);
  const coachSnapshotRef = useRef(null);
  const prevSessionCountRef = useRef(null);
  const priorSessionsRef = useRef([]);

  // Fetch training sessions once → build coach snapshot + grab last session's pose metrics
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const { collection, getDocs, query, where, doc, getDoc } = await import("firebase/firestore");
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
        priorSessionsRef.current = sessions.slice(0, 9);
        // Most recent past session's pose metrics for comparison
        if (sessions[0]?.poseMetrics) setPrevPoseMetrics(sessions[0].poseMetrics);
        // Load currentExperiment from user doc
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (!active) return;
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const expData = userData.currentExperiment;
          if (expData) {
            setCurrentExperiment(expData);
            const startSec = expData.startDate?.seconds || 0;
            const count = sessions.filter((s) => (s.createdAt?.seconds || 0) > startSec).length;
            setExperimentSessionCount(count);
          }
          const arch = userData.fighterDNA?.archetypeKey;
          if (arch) setUserArchetype(arch);
        }
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

  // Override pixel-detector score with MediaPipe score as soon as result appears.
  // Runs on result.hitCount change (new session) — not on score change — to avoid loops.
  useEffect(() => {
    if (!result) return;
    const poseSummary = computeSessionSummary();
    if (poseSummary?.score != null) {
      setPoseSessionSummary(poseSummary);
      if (poseSummary.score !== result.score) {
        setResult((prev) => prev ? { ...prev, score: poseSummary.score } : prev);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.hitCount]);

  // Generate debrief when result appears
  useEffect(() => {
    if (!result?.score) { setDebrief(null); setDebriefSource(null); setPoseSessionSummary(null); return; }

    // Capture pose summary (may already be set by score-override effect above)
    const poseSummary = computeSessionSummary();
    // Skip debrief when punch count is too low — AI has nothing real to say
    const effectivePunchCount = poseSummary?.punchCount ?? result.hitCount ?? 0;
    if (effectivePunchCount < 5) { setDebrief(null); setDebriefLoading(false); setPoseSessionSummary(null); return; }

    if (poseSummary && !poseSessionSummary) setPoseSessionSummary(poseSummary);

    const effectiveScore = poseSummary?.score ?? result.score;

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
              content: `Boxing session finished. Performance score: ${effectiveScore.toFixed(1)}/10. ${prevStr}${poseStr} Give a 2-3 sentence coaching debrief — one strength observed, one specific thing to improve, and one concrete drill to do next. Do not repeat or mention any score number.`,
            }],
            persona: "analyst",
            locale,
            coachContext: ctx,
          }),
        });
        const data = await res.json();
        const text = data.content?.[0]?.text || data.message || null;
        const src = data._source ?? (data.fallback ? "fallback" : data.aiError ? "error" : "openai");
        if (active) { setDebrief(text); setDebriefSource(src); }
      } catch { /* silent — debrief is optional */ } finally {
        if (active) setDebriefLoading(false);
      }
    })();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.score]);

  // ── Write daily mission to localStorage after result ────────────────────
  useEffect(() => {
    if (!result?.breakdown) return;
    const bd = result.breakdown;
    const lowest = Object.entries(bd).reduce((a, [k, v]) => v < a[1] ? [k, v] : a, ["", 99]);
    const missionMap = {
      accuracy:    t("missionAccuracyText"),
      speed:       t("missionSpeedText"),
      power:       t("missionPowerText"),
      consistency: t("missionConsistencyText"),
    };
    const text = missionMap[lowest[0]] || t("missionDefaultText");
    const mission = { text, date: new Date().toISOString().split("T")[0] };
    try { localStorage.setItem("gavana_daily_mission", JSON.stringify(mission)); } catch {}
    setDailyMission(mission);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.score]);

  // ── Setup cue: poll during recording to detect camera framing issues ──
  // Only shown after 20s so it doesn't disrupt the session start
  useEffect(() => {
    if (phase !== "recording") { setPositionCue(null); return; }
    let active = true;
    const delayId = setTimeout(() => {
      if (!active) return;
      const id = setInterval(() => {
        if (!active) { clearInterval(id); return; }
        const info = getDebugInfo();
        if (info.status !== "ready" || !info.landmarksDetected) { setPositionCue(null); return; }
        const q = info.cameraQuality;
        if (q === "too_close") {
          setPositionCue(t("trainCueTooClose"));
        } else if (q === "upper_body_only") {
          setPositionCue(t("trainCueUpperBodyOnly"));
        } else if (q === "upper_body_hips") {
          setPositionCue(t("trainCueUpperBodyHips"));
        } else {
          setPositionCue(null);
        }
      }, 1200);
      return () => clearInterval(id);
    }, 20000);
    return () => { active = false; clearTimeout(delayId); setPositionCue(null); };
  }, [phase, getDebugInfo]);

  // ── Tracking ring: live feedback on whether pose detector sees the user ──
  useEffect(() => {
    if (phase !== "recording") { setTrackingRing(null); return; }
    let active = true;
    const id = setInterval(() => {
      if (!active) return;
      const info = getDebugInfo();
      if (!info || info.status !== "ready") { setTrackingRing("none"); return; }
      if (!info.landmarksDetected) { setTrackingRing("none"); return; }
      setTrackingRing(info.trackingQuality || "good");
    }, 400);
    return () => { active = false; clearInterval(id); setTrackingRing(null); };
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

  // ── DNA milestone moments after session save ──────────────────────────────
  useEffect(() => {
    if (!saved || !savedAttemptNumber) return;
    const DNA_MILESTONES = {
      1:  { emoji: "🥊", en: "DNA Journey Started",       mn: "ДНХ аялал эхэллээ",              ko: "DNA 여정 시작",
             hint: { en: "Your first punch pattern has been recorded.", mn: "Анхны цохилтын хэв маяг бичигдлаа.", ko: "첫 번째 펀치 패턴이 기록되었습니다." } },
      3:  { emoji: "🔬", en: "DNA Analysis Unlocked",     mn: "ДНХ шинжилгээ нээгдлаа",          ko: "DNA 분석 잠금 해제",
             hint: { en: "Visit Fighter Profile to see your early read →", mn: "Тулаанчийн профайлаас дүнгээ харна уу →", ko: "파이터 프로필에서 초기 분석 확인 →" }, cta: true },
      8:  { emoji: "🧬", en: "Archetype Signal Strong",   mn: "Archetype дохио хүчтэй",           ko: "아키타입 신호 강함",
             hint: { en: "Your Fighter DNA is forming — check your profile!", mn: "Тулаанчийн ДНХ бүрдэж байна — профайлаа шалга!", ko: "파이터 DNA 형성 중 — 프로필 확인!" }, cta: true },
      15: { emoji: "⚗️", en: "Fighter Identity Emerging", mn: "Тулаанчийн мөн чанар бүрдэж байна", ko: "파이터 아이덴티티 형성",
             hint: { en: "Your style is becoming clear. Try an experiment!", mn: "Таны хэв маяг тодорхой болж байна. Туршилт хийгээрэй!", ko: "스타일이 명확해지고 있습니다. 실험해 보세요!" } },
    };
    const milestone = DNA_MILESTONES[savedAttemptNumber];
    if (milestone) {
      setDnaMilestone(milestone);
      const timer = setTimeout(() => setDnaMilestone(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [saved, savedAttemptNumber]);

  // ── Lesson context from query params ─────────────────────────────────────
  const [lessonContext, setLessonContext] = useState(null);
  const [activeCueIndex, setActiveCueIndex] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const academyLessonId = params.get("academyLesson");
    if (academyLessonId) {
      const al = ACADEMY_LESSONS.find(l => l.id === academyLessonId);
      if (al) setLessonContext({ academyLesson: al });
      return;
    }
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

  // ── Rotating cue for academy lessons during recording ────────────────────
  useEffect(() => {
    if (phase !== "recording" || !lessonContext?.academyLesson) {
      setActiveCueIndex(0);
      return;
    }
    const cues = lessonContext.academyLesson.keyCues;
    if (cues.length <= 1) return;
    const id = setInterval(() => setActiveCueIndex(i => (i + 1) % cues.length), 9000);
    return () => clearInterval(id);
  }, [phase, lessonContext]);

  // ── Auto-record academy progress when result arrives ─────────────────────
  const lastRecordedRef = useRef({ lessonId: null, score: null });
  useEffect(() => {
    if (!result?.score || !lessonContext?.academyLesson) return;
    const lid = lessonContext.academyLesson.id;
    const score = result.score;
    if (lastRecordedRef.current.lessonId === lid && lastRecordedRef.current.score === score) return;
    lastRecordedRef.current = { lessonId: lid, score };
    recordSession(lid, score);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.score, lessonContext?.academyLesson?.id]);

  // Auto-start when coming from landing with ?autostart=1
  const autoStartFiredRef = useRef(false);
  useEffect(() => {
    if (!autoStart || cameraState !== "ready" || phase !== "idle" || autoStartFiredRef.current) return;
    autoStartFiredRef.current = true;
    const id = setTimeout(() => handleStart(), 1400);
    return () => clearTimeout(id);
  // handleStart is intentionally omitted — it's recreated every render but behaviorally stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, cameraState, phase]);

  if (authLoading) {
    return <div style={styles.loading}>{t("loading")}</div>;
  }

  const isGuest = !user;

  const isCountingDown = phase === "countdown";
  const isRecording = phase === "recording";
  const canStart = phase === "idle" || phase === "result";

  // For brand-new users (first session ever), intercept start with readiness flow
  const isFirstSession = totalSessionCount === 0;
  const wrappedHandleStart = () => {
    if (isFirstSession && !readinessShownRef.current) {
      readinessShownRef.current = true;
      setReadinessOpen(true);
      setReadinessStep(0);
      return;
    }
    handleStart();
  };

  return (
    <main style={styles.page}>
      <button type="button" style={styles.backButton} onClick={goBack} aria-label="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <section style={styles.shell}>
        {/* Guest mode banner */}
        {isGuest && (
          <div style={{
            margin: "0 0 14px",
            padding: "10px 14px",
            borderRadius: 12,
            background: "rgba(245,196,81,0.07)",
            border: "1px solid rgba(245,196,81,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>
              {locale === "mn"
                ? "Хэдэн цохилт хий — AI таны хэв маягийг шинжилнэ. Дүнг хадгалахын тулд бүртгүүл."
                : locale === "ko"
                ? "몇 번 펀치해보세요 — AI가 스타일을 분석합니다. 저장하려면 가입하세요."
                : "Throw a few punches — AI reads your style. Sign up to save your progress."}
            </span>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/login?mode=signup`)}
              style={{
                flexShrink: 0,
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: "rgba(245,196,81,0.18)",
                color: "#F5C451",
                fontSize: 11,
                fontWeight: 900,
                cursor: "pointer",
                letterSpacing: 0.5,
              }}
            >
              {locale === "mn" ? "Бүртгүүлэх" : locale === "ko" ? "가입" : "Sign up"}
            </button>
          </div>
        )}

        {/* First-time onboarding hint */}
        {showOnboarding && phase === "idle" && (
          <div style={{
            margin: "0 0 14px",
            padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(255,59,48,0.07)",
            border: "1px solid rgba(255,59,48,0.22)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 10,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.8, color: "rgba(255,59,48,0.8)", textTransform: "uppercase", marginBottom: 5 }}>
                {locale === "mn" ? "Хэрхэн ажилладаг вэ" : "How it works"}
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                {locale === "mn"
                  ? "① Камер зөвшөөрнө → ② Start дарна → ③ Цохилт хийнэ → ④ AI таны хэв маягийг шинжилнэ"
                  : "① Allow camera → ② Press Start → ③ Throw punches → ④ AI reads your style"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowOnboarding(false)}
              style={{ flexShrink: 0, background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 2 }}
            >
              ✕
            </button>
          </div>
        )}

        <header style={{ ...styles.header, display: (isCountingDown || isRecording) ? "none" : undefined }}>
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

        {/* Challenge Active card — shown when responding to a feed challenge */}
        {activeChallengePostId && canStart && (
          <div style={{
            margin: "0 0 14px",
            padding: "12px 16px",
            borderRadius: 14,
            background: "rgba(167,139,250,0.08)",
            border: "1px solid rgba(167,139,250,0.3)",
            borderLeft: "3px solid rgba(167,139,250,0.7)",
          }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: "#C084FC", textTransform: "uppercase", marginBottom: 8 }}>
              ⚔️ {locale === "mn" ? "Challenge идэвхтэй" : locale === "ko" ? "챌린지 활성" : "Challenge Active"}
            </div>
            {challengePostData ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 6 }}>
                  {challengePostData.challengeTitle || (locale === "mn" ? "Challenge" : locale === "ko" ? "챌린지" : "Challenge")}
                </div>
                {typeof challengePostData.challengeTargetScore === "number" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ padding: "5px 12px", borderRadius: 8, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.28)" }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: "rgba(167,139,250,0.65)", textTransform: "uppercase", letterSpacing: 1 }}>
                        {locale === "mn" ? "Зорилт" : locale === "ko" ? "목표" : "Target"}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 1000, color: "#C084FC", marginLeft: 8, fontFamily: "var(--font-display,'Anton',sans-serif)" }}>
                        {challengePostData.challengeTargetScore.toFixed(1)}/10
                      </span>
                    </div>
                    {challengePostData.username && (
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                        @{challengePostData.username}
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                {locale === "mn" ? "Challenge ачааллаж байна…" : locale === "ko" ? "챌린지 불러오는 중…" : "Loading challenge…"}
              </div>
            )}
          </div>
        )}

        {/* Training Focus — shown when arriving from a fighter or academy lesson */}
        {lessonContext && canStart && (
          <TrainingFocusCard
            fighterName={lessonContext.fighter?.name || lessonContext.academyLesson?.relatedFighterName}
            lesson={lessonContext.lesson}
            academyLesson={lessonContext.academyLesson}
            accent={lessonContext.fighter?.accent || lessonContext.academyLesson?.accentColor}
            locale={locale}
            router={router}
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
                {locale === "mn" ? "⚡ Өнөөдрийн анхаарал" : locale === "ko" ? "⚡ 오늘의 집중" : "⚡ Today's Focus"}
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
                  {locale === "mn" ? "Судлах" : locale === "ko" ? "배우기" : "Study"}
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
              style={{ ...styles.preview, transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
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

          {/* Camera flip button — only shown when idle, not recording */}
          {phase === "idle" && cameraState === "ready" && (
            <button
              type="button"
              onClick={toggleCamera}
              style={{
                position: "absolute", top: 12, right: 12,
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", zIndex: 10,
              }}
              aria-label="Switch camera"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7h-3a2 2 0 0 1-2-2V2" />
                <path d="M9 2H5a2 2 0 0 0-2 2v4" />
                <path d="M3 17v3a2 2 0 0 0 2 2h4" />
                <path d="M20 17v3a2 2 0 0 1-2 2h-3" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          )}

          {/* Hit flash overlay — quick red burst on each simulated punch */}
          {isFlashing && <div style={styles.flashOverlay} />}

          {/* Tracking ring — tells user whether pose detector sees them */}
          {trackingRing && (() => {
            const ringColor =
              trackingRing === "good"     ? "#34D399" :
              trackingRing === "degraded" ? "#F59E0B" : "#F87171";
            return (
              <div style={{
                position: "absolute", inset: 0, borderRadius: 28,
                border: `2px solid ${ringColor}`,
                boxShadow: `inset 0 0 18px ${ringColor}30, 0 0 18px ${ringColor}30`,
                pointerEvents: "none", zIndex: 9,
                transition: "border-color 0.4s, box-shadow 0.4s",
              }} />
            );
          })()}

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

          {/* Live punch counter — shown during recording */}
          <LivePunchCounter getDebugInfo={getDebugInfo} isActive={phase === "recording"} punchTarget={drillConfig?.punchTarget ?? null} />

          {/* Pose debug overlay — enabled via ?debug=1 query param */}
          <PoseDebugOverlay getDebugInfo={getDebugInfo} isActive={phase === "recording"} debugEnabled={debugEnabled} />

          {/* Live technique coaching cue — shown during recording when a lesson is active */}
          {isRecording && (lessonContext?.lesson?.bodyCue || lessonContext?.academyLesson?.keyCues?.length > 0) && (() => {
            const acc = lessonContext.fighter?.accent || lessonContext.academyLesson?.accentColor || GOLD;
            const cueText = lessonContext.academyLesson
              ? (lessonContext.academyLesson.keyCues[activeCueIndex] || lessonContext.academyLesson.keyCues[0])
              : lessonContext.lesson.bodyCue;
            return (
              <div style={{
                position: "absolute", top: 12, left: 0, right: 0,
                display: "flex", justifyContent: "center", pointerEvents: "none",
                padding: "0 14px",
              }}>
                <div style={{
                  background: `${acc}18`,
                  border: `1px solid ${acc}55`,
                  borderRadius: 20,
                  padding: "6px 14px",
                  maxWidth: 320,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: acc,
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${acc}`,
                  }} />
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: "rgba(255,255,255,0.88)",
                    lineHeight: 1.35,
                    textAlign: "center",
                  }}>
                    {cueText}
                  </span>
                </div>
              </div>
            );
          })()}

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

        {/* Technique picker — only when idle and no lesson already selected */}
        {canStart && !lessonContext && !challengeId && !challengeUserId && (
          <TechniquePicker
            locale={locale}
            onSelect={({ fighter, lesson }) => setLessonContext({ fighter, lesson })}
          />
        )}

        {/* Video recording toggle — opt-in, shown when idle and browser supports MediaRecorder */}
        {phase === "idle" && !challengeUserId && !activeChallengePostId && typeof window !== "undefined" && window.MediaRecorder && (
          <div style={{
            margin: "0 0 8px",
            padding: "10px 14px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${recordingEnabled ? "rgba(255,59,48,0.3)" : "rgba(255,255,255,0.07)"}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.65)" }}>
                {locale === "mn" ? "Видео бичлэг" : locale === "ko" ? "비디오 녹화" : "Record video"}
              </div>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>
                {locale === "mn" ? "Feed-д хуваалцах үед upload хийгдэнэ" : locale === "ko" ? "공유 시 업로드됩니다" : "Uploads when you share to feed"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRecordingEnabled((v) => !v)}
              style={{
                flexShrink: 0, width: 44, height: 26, borderRadius: 13,
                background: recordingEnabled ? RED : "rgba(255,255,255,0.1)",
                border: "none", cursor: "pointer", position: "relative",
                transition: "background 0.2s",
              }}
              aria-label={recordingEnabled ? "Disable recording" : "Enable recording"}
            >
              <div style={{
                position: "absolute", top: 3,
                left: recordingEnabled ? 21 : 3,
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }} />
            </button>
          </div>
        )}

        {/* ── Daily Hub — shown when idle only ─────────────────────────── */}
        {phase === "idle" && (() => {
          const effectiveMissionDone = missionCompletedToday || missionJustCompleted;
          const isBeginner = isBeginnerUser(totalSessionCount ?? 999);
          const nextLesson = isBeginner ? getCurrentBeginnerLesson(totalSessionCount ?? 0) : null;
          const beginnerProg = isBeginner ? getBeginnerProgress(totalSessionCount ?? 0) : null;
          const belt = getBelt(currentXP);
          const beltPct = getBeltProgress(currentXP);
          const nextBelt = getNextBelt(currentXP);

          return (
          <div style={{ margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>

            {/* Mission + streak + belt card */}
            <div style={{
              borderRadius: 14, overflow: "hidden",
              border: effectiveMissionDone ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(245,196,81,0.2)",
              background: effectiveMissionDone ? "rgba(52,211,153,0.04)" : "rgba(0,0,0,0.3)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{effectiveMissionDone ? "✅" : "🥊"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.8, textTransform: "uppercase", color: effectiveMissionDone ? "#34D399" : "rgba(245,196,81,0.8)", marginBottom: 2 }}>
                    {effectiveMissionDone
                      ? (locale === "mn" ? "ӨНӨӨДРИЙН ДААЛГАВАР ДУУССАН" : locale === "ko" ? "오늘 미션 완료" : "TODAY'S MISSION DONE")
                      : (locale === "mn" ? "ӨНӨӨДРИЙН ДААЛГАВАР" : locale === "ko" ? "오늘의 미션" : "DAILY MISSION")}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.75)" }}>
                    {effectiveMissionDone
                      ? (locale === "mn" ? "Гайхалтай! Маргааш streak-ийг үргэлжлүүл." : locale === "ko" ? "훌륭해요! 내일도 스트릭을 이어가세요." : "Great work! Keep the streak alive tomorrow.")
                      : (locale === "mn" ? "Дасгал хийж +50 XP ав" : locale === "ko" ? "훈련하고 +50 XP 획득" : "Train once today for +50 XP")}
                  </div>
                </div>
                {/* Streak pill */}
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 10px", borderRadius: 10, background: userStreak >= 7 ? "rgba(251,146,60,0.15)" : userStreak >= 3 ? "rgba(251,146,60,0.1)" : "rgba(255,255,255,0.05)", border: userStreak >= 3 ? "1px solid rgba(251,146,60,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: 16 }}>🔥</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: userStreak > 0 ? "#FB923C" : "rgba(255,255,255,0.3)", lineHeight: 1 }}>{userStreak}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: 0.5, textTransform: "uppercase" }}>
                    {locale === "mn" ? "өдөр" : locale === "ko" ? "일" : "day"}
                  </span>
                </div>
              </div>

              {/* Belt progress row */}
              <div style={{ padding: "0 14px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12 }}>🥋</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: belt.color }}>{t(belt.key)}</span>
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ width: `${beltPct}%`, height: "100%", background: belt.gradient, transition: "width 0.6s ease" }} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color: belt.color }}>{beltPct}%</span>
                {nextBelt && <span style={{ fontSize: 8, color: "rgba(255,255,255,0.22)" }}>→ {t(nextBelt.key)}</span>}
              </div>

              {/* Streak milestones */}
              {userStreak > 0 && (
                <div style={{ padding: "0 14px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                  {[1, 3, 7, 14, 30].map((m) => (
                    <div key={m} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: userStreak >= m ? "#FB923C" : "rgba(255,255,255,0.1)", boxShadow: userStreak >= m ? "0 0 6px rgba(251,146,60,0.6)" : "none" }} />
                      <span style={{ fontSize: 7, fontWeight: 700, color: userStreak >= m ? "#FB923C" : "rgba(255,255,255,0.2)" }}>{m}</span>
                    </div>
                  ))}
                  <div style={{ flex: 1, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, (userStreak / 30) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#FB923C,#F59E0B)", transition: "width 0.6s ease" }} />
                  </div>
                  {bestDailyStreak > 0 && (
                    <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>
                      {locale === "mn" ? `Хамгийн дээд: ${bestDailyStreak}` : locale === "ko" ? `최고: ${bestDailyStreak}일` : `Best: ${bestDailyStreak}d`}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Beginner Path card — only for new users */}
            {isBeginner && nextLesson && (
              <div style={{ borderRadius: 14, border: "2px solid rgba(139,92,246,0.35)", background: "rgba(139,92,246,0.06)", padding: "14px 14px 12px" }}>
                {/* Header row: START HERE + lesson count + dots */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: "#A78BFA", background: "rgba(139,92,246,0.2)", padding: "3px 8px", borderRadius: 20 }}>
                      {t("beginnerStartHere")}
                    </span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
                      {t("beginnerLessonCount").replace("{current}", beginnerProg.completed + 1).replace("{total}", beginnerProg.total)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 3 }}>
                    {Array.from({ length: beginnerProg.total }).map((_, i) => (
                      <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i < beginnerProg.completed ? "#8B5CF6" : i === beginnerProg.completed ? "#A78BFA" : "rgba(255,255,255,0.1)", boxShadow: i === beginnerProg.completed ? "0 0 5px rgba(167,139,250,0.6)" : "none" }} />
                    ))}
                  </div>
                </div>

                {/* Lesson title + why */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{t(nextLesson.titleKey)}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                    {t(nextLesson.whyKey)}
                  </div>
                </div>

                {/* Dual CTA */}
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={`/${locale}/programs${nextLesson.lessonId ? `?lesson=${nextLesson.lessonId}` : ""}`}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0", borderRadius: 10, background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.45)", color: "#C4B5FD", fontSize: 12, fontWeight: 900, textDecoration: "none" }}>
                    📖 {t("beginnerCTALesson")}
                  </a>
                  <button type="button"
                    onClick={wrappedHandleStart}
                    style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                    🎥 {t("beginnerCTARecord")}
                  </button>
                </div>
              </div>
            )}

            {/* DNA Daily Focus — archetype-specific mission */}
            {userArchetype && (() => {
              const mission = getTodaysDNAMission(userArchetype);
              if (!mission) return null;
              const archColor = ARCH_TRAINING_COLORS[userArchetype] || GOLD;
              return (
                <div style={{
                  borderRadius: 14, overflow: "hidden",
                  border: `1px solid ${archColor}30`,
                  background: `${archColor}08`,
                }}>
                  <div style={{ height: 2, background: `linear-gradient(90deg, ${archColor}88, transparent)` }} />
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, textTransform: "uppercase", color: archColor, marginBottom: 3 }}>
                          {locale === "mn" ? "ӨНӨӨДРИЙН DNA ФОКУС" : locale === "ko" ? "오늘의 DNA 포커스" : "TODAY'S DNA FOCUS"}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
                          {mission[locale] || mission.en}
                        </div>
                      </div>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: `${archColor}18`, border: `1px solid ${archColor}35`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18,
                      }}>
                        🎯
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, fontWeight: 600, marginBottom: 10 }}>
                      {mission.hint[locale] || mission.hint.en}
                    </div>
                    <button
                      type="button"
                      onClick={wrappedHandleStart}
                      style={{
                        width: "100%", padding: "9px 0", borderRadius: 10,
                        background: `${archColor}20`, border: `1px solid ${archColor}45`,
                        color: archColor, fontSize: 12, fontWeight: 900, cursor: "pointer",
                      }}
                    >
                      {locale === "mn" ? "Одоо дасгал хий →" : locale === "ko" ? "지금 훈련하기 →" : "Train Now →"}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Experiment Mode widget */}
            {currentExperiment && (() => {
              const exp = currentExperiment;
              const expAcc = exp.fighterAccent || "#F5C451";
              const startSec = exp.startDate?.seconds || Math.floor(Date.now() / 1000);
              const daysElapsed = Math.min(7, Math.floor((Date.now() / 1000 - startSec) / 86400));
              const daysLeft = Math.max(0, 7 - daysElapsed);
              const isDone = daysLeft === 0;
              return (
                <div style={{
                  borderRadius: 14,
                  border: `1px solid ${isDone ? "rgba(52,211,153,0.3)" : `${expAcc}35`}`,
                  background: isDone ? "rgba(52,211,153,0.05)" : `${expAcc}08`,
                  padding: "13px 14px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>⚗️</span>
                      <div>
                        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: isDone ? "#34D399" : expAcc, textTransform: "uppercase", marginBottom: 2 }}>
                          {isDone ? t("experimentDone") : t("experimentWeekly")}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{exp.fighterName}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/fighters/${exp.fighterId}`)}
                      style={{ background: `${expAcc}18`, border: `1px solid ${expAcc}40`, borderRadius: 8, padding: "5px 11px", color: expAcc, fontSize: 10.5, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}
                    >
                      {t("experimentView")}
                    </button>
                  </div>

                  {/* Days progress bar */}
                  <div style={{ marginBottom: isDone ? 10 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>
                        {daysElapsed}/{7} {t("experimentDaysOf")}
                        {experimentSessionCount > 0 && (
                          <span style={{ marginLeft: 8, color: "rgba(255,255,255,0.28)" }}>
                            · {experimentSessionCount} {locale === "mn" ? "тренинг" : locale === "ko" ? "세션" : "sessions"}
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: isDone ? "#34D399" : expAcc }}>
                        {isDone
                          ? `7 ${t("experimentDaysComplete")}`
                          : `${daysLeft} ${t("experimentDaysLeft")}`}
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, (daysElapsed / 7) * 100)}%`, height: "100%", background: isDone ? "#34D399" : expAcc, transition: "width 0.6s ease" }} />
                    </div>
                  </div>

                  {isDone && (
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/fighter-profile`)}
                      style={{ width: "100%", padding: "10px 0", borderRadius: 10, background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", color: "#34D399", fontSize: 12, fontWeight: 900, cursor: "pointer", marginTop: 2 }}
                    >
                      {t("experimentResultsCta")}
                    </button>
                  )}
                </div>
              );
            })()}

          </div>
          );
        })()}

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
            <button type="button" style={styles.startButton} className="train-start-btn tap-bounce" onClick={wrappedHandleStart}>
              {isFirstSession ? (locale === "mn" ? "Эхлэх →" : locale === "ko" ? "시작 →" : "Get Started →") : t("trainStart")}
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
        debriefSource={debriefSource}
        debriefLoading={debriefLoading}
        result={result}
        isGuest={isGuest}
        activeChallenge={activeChallenge}
        challengeUserId={challengeUserId}
        challengeSaving={challengeSaving}
        challengeSaved={challengeSaved}
        rankUpInfo={rankUpInfo}
        beltUpInfo={beltUpInfo}
        sessionHistory={sessionHistory}
        ghostBestScore={ghostBestScore}
        pvpResult={pvpResult}
        opponentUsername={opponentUsername}
        targetScore={targetScore}
        reelId={reelId}
        userStreak={userStreak}
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
        onSave={(params) => handleSave({ ...params, priorSessions: priorSessionsRef.current })}
        onSaveChallengeResult={handleSaveChallengeResult}
        onShareChallenge={handleShareChallenge}
        onShareTraining={handleShareTraining}
        onShareToFeed={
          lessonContext?.academyLesson
            ? () => handleShareAcademyToFeed({ poseMetrics: poseSessionSummary, academyLesson: lessonContext.academyLesson, videoBlob: recordedBlob, thumbnailBlob })
            : () => handleShareToFeed({ poseMetrics: poseSessionSummary, videoBlob: recordedBlob, thumbnailBlob })
        }
        recordedBlob={recordedBlob}
        thumbnailBlob={thumbnailBlob}
        feedSharing={feedSharing}
        feedShared={feedShared}
        sharedReelId={sharedReelId}
        onCreateChallengePost={() => handleCreateChallengePost({
          poseMetrics: poseSessionSummary,
          academyLesson: lessonContext?.academyLesson || null,
        })}
        challengePosting={challengePosting}
        challengePosted={challengePosted}
        challengePostId={challengePostId}
        academyLesson={lessonContext?.academyLesson || null}
        challengePostData={challengePostData}
        onPostChallengeResponse={() => handlePostChallengeResponse({ challengePostData })}
        challengeResponsePosting={challengeResponsePosting}
        challengeResponsePosted={challengeResponsePosted}
        challengeResponseId={challengeResponseId}
      />
      {/* Debug session report — only visible when ?debug=1, appears after session */}
      <DebugSessionPanel
        stats={poseSessionSummary?.debugStats ?? null}
        boxing={poseSessionSummary?.boxingIntelligence ?? null}
        debugEnabled={debugEnabled}
      />

      <DailyMission locale={locale} />
      <BottomNav router={router} user={user} currentLocale={locale} activeTab="train" />

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
          position: "fixed",
          bottom: `calc(80px + env(safe-area-inset-bottom))`,
          left: "50%", transform: `translateX(-50%) translateY(${-i * 72}px)`,
          maxWidth: "calc(100vw - 32px)",
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
              {locale === "mn" ? "Шинэ badge!" : locale === "ko" ? "배지 획득!" : "Badge Unlocked!"}
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{badge.name}</div>
          </div>
        </div>
      ))}

      {/* DNA milestone moment toast */}
      {dnaMilestone && (
        <div style={{
          position: "fixed",
          bottom: `calc(80px + env(safe-area-inset-bottom))`,
          left: "50%", transform: "translateX(-50%)",
          maxWidth: "calc(100vw - 32px)", width: 320,
          zIndex: 9001,
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", borderRadius: 20,
          background: "rgba(12,12,14,0.96)",
          border: `1px solid rgba(245,196,81,0.3)`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,196,81,0.08)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          <span style={{ fontSize: 26, flexShrink: 0 }}>{dnaMilestone.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>
              {locale === "mn" ? "ДНХ мөч" : locale === "ko" ? "DNA 순간" : "DNA Moment"}
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 2 }}>
              {dnaMilestone[locale] || dnaMilestone.en}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 600, lineHeight: 1.4 }}>
              {dnaMilestone.hint[locale] || dnaMilestone.hint.en}
            </div>
          </div>
          {dnaMilestone.cta && (
            <button
              onClick={() => router.push(`/${locale}/fighter-profile`)}
              style={{
                flexShrink: 0, padding: "6px 10px", borderRadius: 10,
                background: goldAlpha(0.15), border: `1px solid ${goldAlpha(0.35)}`,
                color: GOLD, fontSize: 14, fontWeight: 900, cursor: "pointer",
              }}
            >
              →
            </button>
          )}
        </div>
      )}

      {/* ── Readiness Modal — shown for first-ever session ───────────── */}
      {readinessOpen && (() => {
        const steps = [
          { icon: "📖", label: t("readinessLearnStep"), desc: t("readinessLearnDesc") },
          { icon: "🥊", label: t("readinessPracticeStep"), desc: t("readinessPracticeDesc") },
          { icon: "📹", label: t("readinessRecordStep"), desc: t("readinessRecordDesc") },
        ];
        const step = steps[readinessStep];
        const isLast = readinessStep === steps.length - 1;
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.88)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
            {/* Step dots */}
            <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
              {steps.map((_, i) => (
                <div key={i} style={{ width: i === readinessStep ? 20 : 6, height: 6, borderRadius: 3, background: i <= readinessStep ? "#F5C451" : "rgba(255,255,255,0.15)", transition: "width 0.3s ease" }} />
              ))}
            </div>

            <div style={{ width: "100%", maxWidth: 360, borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: "28px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{step.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 10 }}>{step.label}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 24 }}>{step.desc}</div>

              {isLast ? (
                <button type="button"
                  style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#E53E3E,#F5C451)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer", letterSpacing: 0.5 }}
                  onClick={() => { setReadinessOpen(false); handleStart(); }}
                >
                  {t("readinessStartBtn")}
                </button>
              ) : (
                <button type="button"
                  style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "rgba(245,196,81,0.15)", color: "#F5C451", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
                  onClick={() => setReadinessStep(s => s + 1)}
                >
                  {locale === "mn" ? "Дараагийн →" : locale === "ko" ? "다음 →" : "Next →"}
                </button>
              )}
            </div>

            <button type="button"
              style={{ marginTop: 20, background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer" }}
              onClick={() => { setReadinessOpen(false); handleStart(); }}
            >
              {t("readinessSkip")}
            </button>
          </div>
        );
      })()}

    </main>
  );
}
