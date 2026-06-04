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
import { getFeaturedPackage, getPackageFighter } from "@/lib/experimentPackages";
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

const ARCH_CUES = {
  pressure:   { en: ["Push forward!", "Don't let them breathe!", "Control the center!", "Keep the pressure on!", "Walk them down!"], mn: ["Урагш дар!", "Амрахыг өгөхгүй!", "Голыг эзэл!", "Дарамтыг хадгал!", "Урагшил!"], ko: ["전진하세요!", "숨 쉬게 하지 마세요!", "중앙 장악!", "프레셔 유지!", "밀어붙이세요!"] },
  outboxer:   { en: ["Use your footwork!", "Work those angles!", "Stay on the outside!", "Pivot and reset!", "Control the range!"], mn: ["Хөдөлгөөнөө ашигла!", "Өнцгийг ажилла!", "Гаднаас ажилла!", "Эрж ре-сет хий!", "Зайг контролло!"], ko: ["풋워크 활용!", "앵글을 만드세요!", "아웃사이드 유지!", "피벗하고 리셋!", "레인지 컨트롤!"] },
  counter:    { en: ["Wait for it...", "Set the trap!", "Time your counter!", "Patience — then fire!", "Let them come to you!"], mn: ["Хүлээ...", "Хавхаа тавь!", "Контрын цагаа тохируул!", "Тэвч — дараа цох!", "Ирэхийг нь хүлээ!"], ko: ["기다리세요...", "트랩 설정!", "카운터 타이밍!", "인내 후 반격!", "오게 내버려 두세요!"] },
  explosive:  { en: ["Explode!", "Fast combinations!", "Burst and reset!", "Max power!", "Surprise them!"], mn: ["Тэсрэн!", "Хурдан комбо!", "Тэсрэж, ре-сет хий!", "Дээд хүч!", "Гэнэтлүүл!"], ko: ["폭발하세요!", "빠른 콤보!", "버스트 후 리셋!", "최대 파워!", "기습하세요!"] },
  technician: { en: ["Perfect your form!", "Reset your stance!", "Stay systematic!", "Clean technique!", "Build the pattern!"], mn: ["Хэлбэрээ тогтоо!", "Байрлалаа буц!", "Системтэй бай!", "Цэвэр техник!", "Хэв маягаа буд!"], ko: ["폼을 완벽하게!", "스탠스 리셋!", "시스템대로!", "깔끔한 기술!", "패턴 구축!"] },
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
    if (!localStorage.getItem("gavana_onboarding_seen")) {
      setShowOnboarding(true);
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
  const [lastSessionSec, setLastSessionSec] = useState(null);
  const [weeklyBestScore, setWeeklyBestScore] = useState(null);
  const [archCueIndex, setArchCueIndex] = useState(0);
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
        if (sessions.length > 0) setLastSessionSec(sessions[0].createdAt?.seconds || null);
        // Weekly best score
        const now = Date.now() / 1000;
        const mondaySec = now - ((new Date().getDay() + 6) % 7) * 86400;
        const thisWeek = sessions.filter((s) => (s.createdAt?.seconds || 0) >= mondaySec);
        if (thisWeek.length > 0) setWeeklyBestScore(Math.max(...thisWeek.map((s) => s.score || 0)));

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

  // ── Live archetype coaching cues during recording ────────────────────────
  useEffect(() => {
    if (phase !== "recording" || !userArchetype) { setArchCueIndex(0); return; }
    const id = setInterval(() => setArchCueIndex((i) => i + 1), 8000);
    return () => clearInterval(id);
  }, [phase, userArchetype]);

  // ── First Session Hook state ──────────────────────────────────────────────
  const [firstSessionHook, setFirstSessionHook] = useState(null);

  // ── DNA milestone moments after session save ──────────────────────────────
  useEffect(() => {
    if (!saved || !savedAttemptNumber) return;
    // Sessions 1/2/3: show full overlay hook
    if (savedAttemptNumber === 1 || savedAttemptNumber === 2 || savedAttemptNumber === 3) {
      setFirstSessionHook({ sessionNum: savedAttemptNumber, poseMetrics: poseSessionSummary, score: result?.score });
      return;
    }
    const DNA_MILESTONES = {
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

        {/* Onboarding overlay — full screen, first visit only */}
        {showOnboarding && (() => {
          const OB = {
            en: {
              kicker:  "BOXING INTELLIGENCE",
              title:   "Build Your Fighter DNA",
              sub:     "Train. Discover who you fight like. Own your identity.",
              steps: [
                { n: "1", label: "Train",    desc: "Throw punches. AI reads your style." },
                { n: "2", label: "Signal",   desc: "Your punch patterns form early signals." },
                { n: "3", label: "DNA",      desc: "Your Fighter Archetype reveals." },
              ],
              hook:    "3 sessions unlock your Fighter DNA.",
              cta:     "Start Training →",
              skip:    "Skip",
            },
            mn: {
              kicker:  "БОКСЫН ТАГНУУЛ",
              title:   "Тулаанчийн ДНХ-аа бүрдүүл",
              sub:     "Бэлтгэл хий. Ямар тулаанч болохоо олж мэд. Мөн чанараа эзэм.",
              steps: [
                { n: "1", label: "Бэлтгэл",   desc: "Цохилт хий. AI хэв маягийг таньна." },
                { n: "2", label: "Дохио",     desc: "Цохилтын хэв маяг эрт дохио үүсгэнэ." },
                { n: "3", label: "ДНХ",       desc: "Тулаанчийн архетип илчлэгдэнэ." },
              ],
              hook:    "3 тренингт таны тулаанчийн ДНХ нээгдэнэ.",
              cta:     "Бэлтгэл эхлэх →",
              skip:    "Алгасах",
            },
            ko: {
              kicker:  "복싱 인텔리전스",
              title:   "파이터 DNA를 구축하세요",
              sub:     "훈련하세요. 어떤 파이터처럼 싸우는지 발견하세요. 정체성을 가지세요.",
              steps: [
                { n: "1", label: "훈련",      desc: "펀치를 던지세요. AI가 스타일을 읽습니다." },
                { n: "2", label: "신호",      desc: "펀치 패턴이 초기 신호를 형성합니다." },
                { n: "3", label: "DNA",       desc: "파이터 아키타입이 공개됩니다." },
              ],
              hook:    "3세션이 파이터 DNA를 잠금 해제합니다.",
              cta:     "훈련 시작 →",
              skip:    "건너뛰기",
            },
          };
          const L = OB[locale] || OB.en;
          function dismiss() {
            localStorage.setItem("gavana_onboarding_seen", "1");
            setShowOnboarding(false);
          }
          return (
            <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(4,4,6,0.99)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
              <div style={{ width: "100%", maxWidth: 360 }}>

                {/* Logo + kicker */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🥊</div>
                  <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 3, color: `${RED}cc`, textTransform: "uppercase", marginBottom: 10 }}>
                    {L.kicker}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display,'Anton',sans-serif)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: 10 }}>
                    {L.title}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.38)", fontWeight: 600, lineHeight: 1.5 }}>
                    {L.sub}
                  </p>
                </div>

                {/* 3-step journey */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 0, marginBottom: 28, position: "relative" }}>
                  {/* Connector line */}
                  <div style={{ position: "absolute", top: 18, left: "calc(50% / 3 + 18px)", right: "calc(50% / 3 + 18px)", height: 1, background: "rgba(255,255,255,0.08)", zIndex: 0 }} />
                  {L.steps.map((step, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 1 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: i === 2 ? `${GOLD}18` : "rgba(255,255,255,0.05)",
                        border: `1.5px solid ${i === 2 ? GOLD : "rgba(255,255,255,0.1)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 900,
                        color: i === 2 ? GOLD : "rgba(255,255,255,0.4)",
                      }}>
                        {i === 2 ? "🧬" : step.n}
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: i === 2 ? GOLD : "rgba(255,255,255,0.6)", marginBottom: 3 }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", lineHeight: 1.4, fontWeight: 600, maxWidth: 80 }}>
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hook line */}
                <div style={{ borderRadius: 14, padding: "14px 16px", background: `${GOLD}0c`, border: `1px solid ${GOLD}25`, marginBottom: 24, textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: GOLD, lineHeight: 1.4 }}>
                    {L.hook}
                  </p>
                </div>

                {/* CTAs */}
                <button
                  type="button"
                  onClick={dismiss}
                  style={{ width: "100%", padding: "16px 0", borderRadius: 14, background: RED, border: "none", color: "#fff", fontSize: 15, fontWeight: 900, letterSpacing: 0.5, cursor: "pointer", marginBottom: 12, boxShadow: `0 4px 24px ${RED}44` }}
                >
                  {L.cta}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  style={{ width: "100%", padding: "10px 0", borderRadius: 14, background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  {L.skip}
                </button>
              </div>
            </div>
          );
        })()}

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

          {/* Live archetype cue — shown during recording when no lesson context */}
          {isRecording && userArchetype && !lessonContext && (() => {
            const cues = ARCH_CUES[userArchetype]?.[locale] || ARCH_CUES[userArchetype]?.en || [];
            if (!cues.length) return null;
            const cue = cues[archCueIndex % cues.length];
            const color = ARCH_TRAINING_COLORS[userArchetype] || GOLD;
            return (
              <div style={{ position: "absolute", top: 12, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none", padding: "0 14px" }}>
                <div style={{ background: `${color}18`, border: `1px solid ${color}55`, borderRadius: 20, padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}` }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.88)", lineHeight: 1.35 }}>{cue}</span>
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

          // Freshness
          const daysSince = lastSessionSec ? Math.floor((Date.now() / 1000 - lastSessionSec) / 86400) : null;
          const showFreshness = daysSince != null && daysSince >= 5;
          const freshnessColor = daysSince >= 14 ? "#EF4444" : daysSince >= 8 ? "#FB923C" : "#F59E0B";
          const freshnessLabel = daysSince >= 14
            ? (locale === "mn" ? "Дохио алдагдлаа" : locale === "ko" ? "신호 손실" : "DNA Signal Lost")
            : daysSince >= 8
            ? (locale === "mn" ? "Дохио буурч байна" : locale === "ko" ? "신호 저하 중" : "DNA Signal Degrading")
            : (locale === "mn" ? "Дохио суларч байна" : locale === "ko" ? "신호 약화 중" : "DNA Signal Weakening");
          const freshnessHint = daysSince >= 14
            ? (locale === "mn" ? `${daysSince} хоног дасгал хийгээгүй — дахин эхэл` : locale === "ko" ? `${daysSince}일 미훈련 — 다시 시작하세요` : `${daysSince} days without training — time to restart`)
            : (locale === "mn" ? `${daysSince} хоног завсарласан. ДНХ сэргээхийн тулд дасгал хий.` : locale === "ko" ? `${daysSince}일 쉬었습니다. DNA를 복구하세요.` : `${daysSince}-day gap. Train to keep your DNA signal strong.`);
          // Weekly digest
          const showDigest = weeklySessionCount >= 1 && weeklyBestScore != null;

          return (
          <div style={{ margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>

            {/* DNA Freshness Warning */}
            {showFreshness && (
              <div style={{ borderRadius: 12, padding: "10px 14px", background: `${freshnessColor}0a`, border: `1px solid ${freshnessColor}30`, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: freshnessColor, marginBottom: 2 }}>{freshnessLabel}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{freshnessHint}</div>
                </div>
              </div>
            )}

            {/* Weekly DNA Digest */}
            {!showFreshness && showDigest && (
              <div style={{ borderRadius: 12, padding: "10px 14px", background: "rgba(245,196,81,0.05)", border: "1px solid rgba(245,196,81,0.15)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>📊</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(245,196,81,0.7)", marginBottom: 2 }}>
                    {locale === "mn" ? "ЭНЭ 7 ХОНОГ" : locale === "ko" ? "이번 주" : "THIS WEEK"}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.65)" }}>
                    {weeklySessionCount} {locale === "mn" ? "тренинг" : locale === "ko" ? "세션" : `session${weeklySessionCount !== 1 ? "s" : ""}`}
                    {userArchetype && <span style={{ color: ARCH_TRAINING_COLORS[userArchetype] || GOLD }}> · {({ pressure: { en: "Pressure", mn: "Дарамт", ko: "프레셔" }, outboxer: { en: "Outboxer", mn: "Аутбоксер", ko: "아웃복서" }, counter: { en: "Counter", mn: "Контр", ko: "카운터" }, explosive: { en: "Explosive", mn: "Тэсрэлт", ko: "폭발적" }, technician: { en: "Technician", mn: "Техникч", ko: "테크니션" } }[userArchetype]?.[locale] || userArchetype)}</span>}
                    {weeklyBestScore != null && <span style={{ color: "rgba(255,255,255,0.35)" }}> · {locale === "mn" ? "Шилдэг" : locale === "ko" ? "최고" : "Best"} {weeklyBestScore.toFixed(1)}</span>}
                  </div>
                </div>
              </div>
            )}

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

            {/* Featured Experiment — show when no active experiment */}
            {!currentExperiment && userArchetype && (() => {
              const pkg = getFeaturedPackage();
              if (!pkg) return null;
              const fighter = getPackageFighter(pkg);
              if (!fighter) return null;
              return (
                <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${pkg.accent}30`, background: `${pkg.accent}08` }}>
                  <div style={{ height: 2, background: `linear-gradient(90deg, ${pkg.accent}88, transparent)` }} />
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: pkg.accent, marginBottom: 3 }}>
                          {locale === "mn" ? "ЭНЭ ДОЛОО ХОНОГ" : locale === "ko" ? "이번 주 실험" : "THIS WEEK'S EXPERIMENT"}
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>
                          {pkg.week[locale] || pkg.week.en}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: pkg.accent, fontStyle: "italic", marginTop: 2 }}>
                          "{pkg.theme[locale] || pkg.theme.en}"
                        </div>
                      </div>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${pkg.accent}18`, border: `1px solid ${pkg.accent}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                        ⚗️
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: 10 }}>
                      {pkg.focus[locale] || pkg.focus.en}
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/fighters/${fighter.id}`)}
                      style={{ width: "100%", padding: "9px 0", borderRadius: 10, background: `${pkg.accent}20`, border: `1px solid ${pkg.accent}45`, color: pkg.accent, fontSize: 12, fontWeight: 900, cursor: "pointer" }}
                    >
                      {locale === "mn" ? `${pkg.week[locale] || pkg.week.en} эхлэх →` : locale === "ko" ? `${pkg.week[locale] || pkg.week.en} 시작 →` : `Start ${pkg.week.en} →`}
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

      {/* ── First Session Hook Overlay ───────────────────────────────── */}
      {firstSessionHook && (() => {
        const pb = firstSessionHook.poseMetrics?.punchBreakdown;
        const jabC   = pb?.jab?.count   || 0;
        const crossC = pb?.cross?.count || 0;
        const hookC  = pb?.hook?.count  || 0;
        const total  = jabC + crossC + hookC;

        const jabPct   = total > 0 ? Math.round((jabC   / total) * 100) : 0;
        const crossPct = total > 0 ? Math.round((crossC / total) * 100) : 0;
        const hookPct  = total > 0 ? 100 - jabPct - crossPct : 0;
        const hasSignals = total >= 3;

        // Derive suggested archetype
        let archKey = "pressure";
        if (hasSignals) {
          if (jabPct >= 45) archKey = "outboxer";
          else if (crossPct >= 35) archKey = "counter";
          else if (hookPct >= 35) archKey = "pressure";
          else if (total >= 25) archKey = "explosive";
          else archKey = "technician";
        }

        // Representative fighter per archetype
        const ARCH_FIGHTER = { pressure: "Mike Tyson", outboxer: "Muhammad Ali", counter: "Floyd Mayweather", explosive: "Naoya Inoue", technician: "Dmitry Bivol" };
        const ARCH_DISPLAY_S = {
          en: { pressure: "Pressure Fighter", outboxer: "Outboxer", counter: "Counter Fighter", explosive: "Explosive Fighter", technician: "Technician" },
          mn: { pressure: "Дарамт тулаанч", outboxer: "Аутбоксер", counter: "Контр тулаанч", explosive: "Тэсрэмтгий тулаанч", technician: "Техникч" },
          ko: { pressure: "프레셔 파이터", outboxer: "아웃복서", counter: "카운터 파이터", explosive: "폭발적 파이터", technician: "테크니션" },
        };
        const acc = ARCH_TRAINING_COLORS[archKey] || GOLD;
        const AD  = ARCH_DISPLAY_S[locale] || ARCH_DISPLAY_S.en;

        const sessionNum = firstSessionHook.sessionNum || 1;

        const SIG_L = {
          en: {
            aggr: "Aggression", range: "Range", counter: "Counter", volume: "Volume",
            high: "HIGH", medium: "MED", low: "LOW", long: "LONG", mid: "MID", close: "CLOSE", building: "BUILDING", emerging: "EMERGING",
            firstSignals: "YOUR FIRST SIGNALS", like: "Like ",
            mightBe:       "You might be a...",
            signalGrowing: "SIGNAL GROWING",
            archEmerging:  "YOUR ARCHETYPE IS EMERGING",
            dnaUnlocked:   "DNA ANALYSIS UNLOCKED",
            dnaReady:      "Your fighter identity is taking shape. Visit your profile to see the full analysis.",
            session2hint:  "1 more session unlocks your Fighter DNA",
            session3hint:  "3 sessions complete. Your DNA is ready to view.",
            trainAgain: "Train Again →", viewDNA: "View Your DNA →", viewProfile: "View Profile",
            title1: "SESSION 1 COMPLETE", title2: "SESSION 2 COMPLETE", title3: "DNA ANALYSIS UNLOCKED",
            dnaJourney: "DNA JOURNEY",
          },
          mn: {
            aggr: "Түрэмгийлэл", range: "Зай", counter: "Контр", volume: "Хэмжээ",
            high: "ӨНДӨР", medium: "ДУНД", low: "БАГ", long: "УРТ", mid: "ДУНД", close: "ОЙРХОН", building: "БҮРДЭЖ БАЙНА", emerging: "ГАРЧ ИРЭХ",
            firstSignals: "АНХНЫ ДОХИО", like: "Жишээ нь: ",
            mightBe:       "Та магадгүй...",
            signalGrowing: "ДОХИО ӨСЧ БАЙНА",
            archEmerging:  "ТАНЫ ARCHETYPE ГАРЧ ИРЭЖ БАЙНА",
            dnaUnlocked:   "ДНХ ШИНЖИЛГЭЭ НЭЭГДЛАА",
            dnaReady:      "Тулаанчийн мөн чанар тодорч байна. Профайлаа зочлоод бүрэн шинжилгээгээ харна уу.",
            session2hint:  "1 тренинг нэмбэл таны ДНХ нээгдэнэ",
            session3hint:  "3 тренинг дууслаа. ДНХ харахад бэлэн боллоо.",
            trainAgain: "Дахин бэлтгэл хий →", viewDNA: "ДНХ харах →", viewProfile: "Профайл харах",
            title1: "1-Р ТРЕНИНГ ДУУСЛАА", title2: "2-Р ТРЕНИНГ ДУУСЛАА", title3: "ДНХ ШИНЖИЛГЭЭ НЭЭГДЛАА",
            dnaJourney: "ДНХ АЯЛАЛ",
          },
          ko: {
            aggr: "공격성", range: "레인지", counter: "카운터", volume: "볼륨",
            high: "높음", medium: "중간", low: "낮음", long: "롱", mid: "미드", close: "클로즈", building: "구축 중", emerging: "성장 중",
            firstSignals: "첫 번째 신호", like: "예: ",
            mightBe:       "당신은...",
            signalGrowing: "신호 성장 중",
            archEmerging:  "아키타입이 형성되고 있습니다",
            dnaUnlocked:   "DNA 분석 잠금 해제",
            dnaReady:      "파이터 정체성이 형태를 갖추고 있습니다. 프로필을 방문하여 전체 분석을 확인하세요.",
            session2hint:  "1회 더 훈련하면 파이터 DNA가 잠금 해제됩니다",
            session3hint:  "3세션 완료. DNA를 확인할 준비가 되었습니다.",
            trainAgain: "다시 훈련 →", viewDNA: "DNA 보기 →", viewProfile: "프로필 보기",
            title1: "세션 1 완료", title2: "세션 2 완료", title3: "DNA 분석 잠금 해제",
            dnaJourney: "DNA 여정",
          },
        };
        const SL = SIG_L[locale] || SIG_L.en;

        const aggrLevel   = hookPct >= 35 ? "high" : hookPct >= 20 ? "medium" : "low";
        const rangeLevel  = jabPct  >= 45 ? "long" : hookPct >= 30 ? "close"  : "mid";
        const counterLevel = crossPct >= 35 ? "high" : crossPct >= 22 ? "emerging" : "low";
        const volumeLevel = total >= 25 ? "high" : total >= 12 ? "medium" : "building";

        const BAR_W = { high: 80, medium: 50, low: 20, long: 75, mid: 45, close: 30, building: 18, emerging: 40 };

        const signals = hasSignals ? [
          { label: SL.aggr,    level: SL[aggrLevel],    w: BAR_W[aggrLevel]    },
          { label: SL.range,   level: SL[rangeLevel],   w: BAR_W[rangeLevel]   },
          { label: SL.counter, level: SL[counterLevel], w: BAR_W[counterLevel] },
          { label: SL.volume,  level: SL[volumeLevel],  w: BAR_W[volumeLevel]  },
        ] : [];

        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(4,4,6,0.98)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", overflowY: "auto" }}>
            <div style={{ width: "100%", maxWidth: 360 }}>

              {/* Header — varies by session */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>
                  {sessionNum === 3 ? "🧬" : "🥊"}
                </div>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, color: acc, textTransform: "uppercase", marginBottom: 6 }}>
                  {sessionNum === 1 ? SL.title1 : sessionNum === 2 ? SL.title2 : SL.title3}
                </div>
                {firstSessionHook.score != null && (
                  <div style={{ fontSize: 32, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>
                    {firstSessionHook.score.toFixed(1)}<span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>/10</span>
                  </div>
                )}
              </div>

              {/* Signals — session 1 & 2 */}
              {sessionNum < 3 && signals.length > 0 && (
                <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 12 }}>
                    {sessionNum === 1 ? SL.firstSignals : SL.signalGrowing}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {signals.map(({ label, level, w }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 70, fontSize: 9.5, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", flexShrink: 0 }}>{label}</span>
                        <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${w}%`, height: "100%", background: acc, borderRadius: 3, boxShadow: `0 0 8px ${acc}55`, transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
                        </div>
                        <span style={{ width: 56, textAlign: "right", fontSize: 8.5, fontWeight: 900, color: acc, letterSpacing: 0.8, flexShrink: 0 }}>{level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Archetype card — all sessions, label changes by session */}
              <div style={{ borderRadius: 16, background: `${acc}10`, border: `1px solid ${acc}30`, padding: "16px", marginBottom: 16, textAlign: "center" }}>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 8 }}>
                  {sessionNum === 3 ? SL.archEmerging : SL.mightBe}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: sessionNum === 3 ? 10 : 8, height: sessionNum === 3 ? 10 : 8, borderRadius: "50%", background: acc, boxShadow: `0 0 ${sessionNum === 3 ? 14 : 10}px ${acc}` }} />
                  <span style={{ fontSize: sessionNum === 3 ? 26 : 20, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display,'Anton',sans-serif)", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                    {AD[archKey]}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
                  {SL.like}{ARCH_FIGHTER[archKey]}
                </div>
                {sessionNum === 3 && (
                  <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600, lineHeight: 1.5 }}>
                    {SL.dnaReady}
                  </div>
                )}
              </div>

              {/* DNA Journey progress bar */}
              <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${sessionNum === 3 ? `${acc}25` : "rgba(255,255,255,0.05)"}`, padding: "14px 16px", marginBottom: 24 }}>
                <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", marginBottom: 10 }}>
                  {SL.dnaJourney}
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      flex: 1, height: 6, borderRadius: 3,
                      background: i < sessionNum ? acc : "rgba(255,255,255,0.07)",
                      boxShadow: i < sessionNum ? `0 0 8px ${acc}66` : "none",
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", fontWeight: 700, lineHeight: 1.4 }}>
                  {sessionNum === 1 ? SL.session2hint : sessionNum === 2 ? SL.session2hint.replace("1", "2") : SL.session3hint}
                </div>
              </div>

              {/* CTAs — session 3 swaps primary/secondary */}
              {sessionNum === 3 ? (
                <>
                  <button
                    type="button"
                    onClick={() => { setFirstSessionHook(null); router.push(`/${locale}/fighter-profile`); }}
                    style={{ width: "100%", padding: "15px 0", borderRadius: 14, background: acc, border: "none", color: "#000", fontSize: 15, fontWeight: 900, letterSpacing: 0.5, cursor: "pointer", marginBottom: 12, boxShadow: `0 4px 24px ${acc}44` }}
                  >
                    {SL.viewDNA}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFirstSessionHook(null); handleTryAgain?.(); }}
                    style={{ width: "100%", padding: "11px 0", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                  >
                    {SL.trainAgain}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setFirstSessionHook(null); handleTryAgain?.(); }}
                    style={{ width: "100%", padding: "15px 0", borderRadius: 14, background: acc, border: "none", color: "#000", fontSize: 15, fontWeight: 900, letterSpacing: 0.5, cursor: "pointer", marginBottom: 12, boxShadow: `0 4px 24px ${acc}44` }}
                  >
                    {SL.trainAgain}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFirstSessionHook(null); router.push(`/${locale}/fighter-profile`); }}
                    style={{ width: "100%", padding: "11px 0", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                  >
                    {SL.viewProfile}
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })()}

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
