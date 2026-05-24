"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  collection, doc, query, where,
  getDocs, getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import {
  calculateUserXP, getFighterRank,
  getNextRank, getRankProgress,
} from "@/lib/xp";
import { RED, GOLD, goldAlpha, RADIUS} from "@/lib/tokens";
import {
  deriveRadarStats, computeFighterScore, getInsight,
} from "@/lib/dashboardHelpers";
import BottomNav from "@/components/BottomNav";
import ActivityFeed from "@/components/ActivityFeed";
import FighterStyleQuiz, { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import FighterPath from "@/components/FighterPath";
import {
  RadarChart, StyleDNA, FighterHero, StatPill, ScoreChart,
  SessionRow, PanelCard, ghostBtnStyle,
} from "@/components/dashboard/DashboardWidgets";
import { BodyProgressSection } from "@/components/dashboard/BodyProgressSection";
import { FIGHTERS } from "@/lib/fighters";
import { getPersonalConnection } from "@/lib/fighterPersonalConnection";
import { buildCoachSnapshot, buildCoachContext } from "@/lib/buildCoachContext";
import WeeklyPlanSection from "@/components/dashboard/WeeklyPlanSection";
import BadgesSection from "@/components/dashboard/BadgesSection";
import FourWeekProgram from "@/components/dashboard/FourWeekProgram";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import LastSessionRecap from "@/components/dashboard/LastSessionRecap";
import GoalTracker from "@/components/dashboard/GoalTracker";
import TrainingCalendar from "@/components/dashboard/TrainingCalendar";
import MonthlyReport from "@/components/dashboard/MonthlyReport";
import AdaptiveRecommendations from "@/components/dashboard/AdaptiveRecommendations";
import FighterStudyRoadmap from "@/components/dashboard/FighterStudyRoadmap";
import TrainingLoadStatus from "@/components/dashboard/TrainingLoadStatus";
import dynamic from "next/dynamic";
const ProgressShareCard = dynamic(() => import("@/components/dashboard/ProgressShareCard"), { ssr: false });

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

function useCountUp(target, ready, duration = 1100) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!ready) return;
    if (target === 0) { setVal(0); return; }
    let startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min(1, (ts - startTime) / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(ease * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, ready, duration]);
  return val;
}

function formatScore(s) {
  const n = Number(s);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(1);
}

export default function AthleteDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);

  const [userData, setUserData] = useState(null);
  const [xp, setXp] = useState(0);
  const [rankReady, setRankReady] = useState(false);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [challengeCount, setChallengeCount] = useState(0);
  const [sessionsReady, setSessionsReady] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [fighterArchetype, setFighterArchetype] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [reelsCount, setReelsCount] = useState(0);
  const [coachSnapshot, setCoachSnapshot] = useState(null);
  const [coachContextStr, setCoachContextStr] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { router.replace(`/${locale}/login`); return; }

    let active = true;
    async function load() {
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const uData = userSnap.exists() ? userSnap.data() : {};

        const feedbackSnap = await getDocs(
          query(collection(db, "ai_feedback"), where("userId", "==", user.uid))
        );
        const feedbackDocs = feedbackSnap.docs.map((d) => d.data());

        const sessSnap = await getDocs(
          query(collection(db, "training_sessions"), where("userId", "==", user.uid))
        );
        const allSessions = sessSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => s.type === "training")
          .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));

        const trainingSessionXP = allSessions.reduce((sum, s) => sum + (Number(s.xpGained) || 0), 0);
        const storedChallengeXP = Number(uData.xp) || 0;
        const streakDays = Number(uData.streakCount) || Number(uData.dailyStreak) || 0;
        const totalXP = storedChallengeXP + trainingSessionXP + calculateUserXP({
          aiFeedbackDocs: feedbackDocs,
          streakDays,
        });

        if (!active) return;
        setUserData(uData);
        setXp(totalXP);
        setTrainingSessions(allSessions.slice(0, 25));
        setRankReady(true);
        setFighterArchetype(uData.fighterArchetype || null);
        if (!uData.fighterArchetype && uData.onboarding?.completed) setShowQuiz(true);

        getDocs(query(collection(db, "challenge_results"), where("userId", "==", user.uid)))
          .then((snap) => { if (active) setChallengeCount(snap.size); })
          .catch(() => {});
        getDocs(query(collection(db, "reels"), where("userId", "==", user.uid)))
          .then((snap) => { if (active) setReelsCount(snap.size); })
          .catch(() => {});
        setSessionsReady(true);

        // Build coach snapshot for weekly plan
        const snap = buildCoachSnapshot({ sessions: allSessions, profileData: uData });
        const ctx = buildCoachContext({ snapshot: snap, profileData: uData, locale });
        setCoachSnapshot(snap);
        setCoachContextStr(ctx);
      } catch (e) {
        if (active) setRankReady(true);
      }
    }
    load();
    return () => { active = false; };
  }, [authLoading, user?.uid, locale, router]);

  const stats = useMemo(() => {
    const scores = trainingSessions
      .map((s) => Number(s.score))
      .filter(Number.isFinite);
    const bestScore = scores.length ? Math.max(...scores) : null;
    const chronoScores = [...scores].reverse();
    return { scores, bestScore, chronoScores };
  }, [trainingSessions]);

  const dailyStreak = Number(userData?.dailyStreak || userData?.streakCount) || 0;
  const bestStreak = Number(userData?.bestDailyStreak) || 0;
  const rank = getFighterRank(xp);
  const nextRank = getNextRank(xp);
  const xpProgress = getRankProgress(xp);

  const insight = useMemo(() =>
    getInsight(locale, stats.scores, dailyStreak),
    [locale, stats.scores, dailyStreak]
  );

  const radarStats = useMemo(() =>
    deriveRadarStats(stats.scores, trainingSessions, dailyStreak),
    [stats.scores, trainingSessions, dailyStreak]
  );

  // Older half of sessions for radar progress comparison
  const prevRadarStats = useMemo(() => {
    if (trainingSessions.length < 6) return null;
    const half = Math.floor(trainingSessions.length / 2);
    const older = trainingSessions.slice(half);
    const olderScores = older.map((s) => Number(s.score)).filter(Number.isFinite);
    return deriveRadarStats(olderScores, older, 0);
  }, [trainingSessions]);

  const fighterScore = useMemo(() =>
    computeFighterScore(stats.scores, xp, dailyStreak),
    [stats.scores, xp, dailyStreak]
  );

  const displayScore = useCountUp(fighterScore, rankReady);
  const visibleSessions = showAllSessions ? trainingSessions : trainingSessions.slice(0, 5);
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const h = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // Weekly recap
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
  const recapDismissKey = `gavana_recap_dismissed_W${weekNumber}`;
  const [recapDismissed, setRecapDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(recapDismissKey) === "1";
  });
  const weekAgoMs = Date.now() - 7 * 24 * 3600 * 1000;
  const prevWeekAgoMs = weekAgoMs - 7 * 24 * 3600 * 1000;
  const weekSessions = trainingSessions.filter((s) => getTs(s.createdAt) >= weekAgoMs);
  const prevWeekSessions = trainingSessions.filter((s) => {
    const ts = getTs(s.createdAt);
    return ts >= prevWeekAgoMs && ts < weekAgoMs;
  });
  const weekXP = weekSessions.reduce((s, sess) => s + (Number(sess.xpGained) || 0), 0);
  const weekScores = weekSessions.map((s) => Number(s.score)).filter(Number.isFinite);
  const prevWeekScores = prevWeekSessions.map((s) => Number(s.score)).filter(Number.isFinite);
  const weekAvg = weekScores.length ? weekScores.reduce((a, b) => a + b, 0) / weekScores.length : null;
  const prevAvg = prevWeekScores.length ? prevWeekScores.reduce((a, b) => a + b, 0) / prevWeekScores.length : null;
  const scoreTrend = weekAvg !== null && prevAvg !== null ? weekAvg - prevAvg : null;
  const showRecap = weekSessions.length > 0 && !recapDismissed;
  const dismissRecap = () => {
    localStorage.setItem(recapDismissKey, "1");
    setRecapDismissed(true);
  };

  if (authLoading || !rankReady) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0B0B0C" }}>
        <div style={{ width: 28, height: 28, border: "2px solid #FF3B30", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div
      className="page-enter"
      style={{ background: `radial-gradient(ellipse at 50% -8%, rgba(255,59,48,0.14) 0%, transparent 50%), #0B0B0C`, minHeight: "100dvh", color: "#fff" }}
    >
      <style>{`
        @keyframes rankFill { from { width: 0 !important; } }
        @keyframes radarFade { from { opacity: 0; transform-origin: center; transform: scale(0.82); } to { opacity: 1; transform: scale(1); } }
        .radar-polygon { animation: radarFade 750ms cubic-bezier(0.16,1,0.3,1) both; }
        .graph-line { animation: radarFade 600ms cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div style={{ maxWidth: isDesktop ? "100%" : 540, margin: "0 auto", padding: isDesktop ? "28px 32px calc(32px)" : "calc(20px + env(safe-area-inset-top)) 16px calc(96px + env(safe-area-inset-bottom))" }}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 900, color: "#FF3B30", letterSpacing: 3, textTransform: "uppercase" }}>
              COMBAT · OS
            </p>
            <h1 style={{ margin: 0, fontSize: isDesktop ? 28 : 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1, fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>
              {userData?.username || user?.displayName || (locale === "mn" ? "Тамирчны ахиц" : locale === "ko" ? "선수 현황" : "My Progress")}
            </h1>
          </div>
          {sessionsReady && trainingSessions.length >= 3 && (
            <button
              type="button"
              onClick={() => setShowShareCard(true)}
              style={{
                marginTop: 4, padding: "7px 12px", borderRadius: 10,
                background: goldAlpha(0.1), border: `1px solid ${goldAlpha(0.3)}`,
                color: GOLD, fontSize: 11, fontWeight: 900, cursor: "pointer",
                letterSpacing: 0.3, whiteSpace: "nowrap",
              }}
            >
              {locale === "mn" ? "📤 Share" : "📤 Share"}
            </button>
          )}
        </div>

        {/* ── Welcome Banner (first-time users) ── */}
        {sessionsReady && trainingSessions.length === 0 && (() => {
          try { if (localStorage.getItem("gavana_welcome_dismissed") === "1") return null; } catch { /* */ }
          return (
            <WelcomeBanner
              locale={locale}
              router={router}
              username={userData?.username || user?.displayName}
            />
          );
        })()}

        {/* ── Last Session Recap (7A) ── */}
        {sessionsReady && trainingSessions.length >= 1 && (
          <LastSessionRecap
            trainingSessions={trainingSessions}
            coachSnapshot={coachSnapshot}
            coachContextStr={coachContextStr}
            locale={locale}
            router={router}
            userId={user?.uid}
          />
        )}

        {/* ── Smart Reminder Banner (7C) ── */}
        {sessionsReady && trainingSessions.length >= 1 && (() => {
          const lastTs = getTs(trainingSessions[0]?.createdAt);
          const daysSince = lastTs ? (Date.now() - lastTs) / (24 * 3600 * 1000) : 99;
          if (daysSince < 2) return null;
          const mn = locale === "mn";
          const ko = locale === "ko";
          const days = Math.floor(daysSince);
          return (
            <div style={{
              marginBottom: 20,
              padding: "12px 14px",
              borderRadius: "3px 14px 14px 3px",
              background: "rgba(251,146,60,0.07)",
              border: "1px solid rgba(251,146,60,0.2)",
              borderLeft: "3px solid #FB923C",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#FB923C", marginBottom: 2 }}>
                  {mn ? `${days} өдөр болж байна` : ko ? `${days}일 지났습니다` : `${days} days since your last session`}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                  {mn ? "Streak алдахгүйн тулд өнөөдөр дасгал хийгээрэй" : "Train today to keep your momentum going"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/train`)}
                style={{ padding: "8px 14px", borderRadius: 10, background: "#FB923C", border: "none", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                {mn ? "Дасгал" : "Train"}
              </button>
            </div>
          );
        })()}

        {/* ── Training Load Status (11C) ── */}
        {sessionsReady && trainingSessions.length >= 1 && (
          <TrainingLoadStatus
            trainingSessions={trainingSessions}
            locale={locale}
            router={router}
          />
        )}

        {/* ── Weekly Recap Card ── */}
        {showRecap && (
          <div style={{
            position: "relative",
            background: "linear-gradient(145deg, #0e1a12 0%, #080d09 100%)",
            border: "1px solid rgba(52,211,153,0.18)",
            borderLeft: "3px solid #34D399",
            borderRadius: "3px 16px 16px 3px",
            padding: "14px 14px 12px",
            marginBottom: 20,
            boxShadow: "0 4px 24px rgba(52,211,153,0.08)",
          }}>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={dismissRecap}
              style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 0 }}
            >×</button>
            <p style={{ margin: "0 0 10px", fontSize: 9, fontWeight: 900, color: "#34D399", letterSpacing: 2.5, textTransform: "uppercase" }}>
              🗓 {locale === "mn" ? "7 хоногийн ахиц" : locale === "ko" ? "주간 요약" : "Weekly Recap"}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: RADIUS.full, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", color: "#34D399", fontSize: 12, fontWeight: 900 }}>
                🥊 {weekSessions.length} {locale === "mn" ? "сесс" : locale === "ko" ? "세션" : "sessions"}
              </span>
              {weekXP > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: RADIUS.full, background: `${goldAlpha(0.1)}`, border: `1px solid ${goldAlpha(0.25)}`, color: GOLD, fontSize: 12, fontWeight: 900 }}>
                  ⚡ +{weekXP} XP
                </span>
              )}
              {weekScores.length > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: RADIUS.full, background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", color: "#60A5FA", fontSize: 12, fontWeight: 900 }}>
                  ⭐ {weekAvg?.toFixed(1)}/10 avg
                </span>
              )}
              {scoreTrend !== null && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: RADIUS.full, background: scoreTrend >= 0 ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${scoreTrend >= 0 ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`, color: scoreTrend >= 0 ? "#34D399" : "#F87171", fontSize: 12, fontWeight: 900 }}>
                  {scoreTrend >= 0 ? "📈" : "📉"} {scoreTrend >= 0 ? "+" : ""}{scoreTrend.toFixed(1)} {locale === "mn" ? "оноо" : locale === "ko" ? "점" : "pts"}
                </span>
              )}
              {dailyStreak >= 3 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: RADIUS.full, background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)", color: "#FB923C", fontSize: 12, fontWeight: 900 }}>
                  🔥 {dailyStreak}{locale === "mn" ? "ш streak" : locale === "ko" ? "일 스트릭" : "d streak"}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Today's Focus ── */}
        {sessionsReady && stats.scores.length >= 3 && (() => {
          const weakAreas = Object.entries(radarStats)
            .sort(([, a], [, b]) => a - b);
          const miniSnapshot = { weakAreas, radarStats };
          const top = FIGHTERS
            .map((f) => ({ fighter: f, connection: getPersonalConnection(miniSnapshot, f) }))
            .filter((x) => x.connection?.isDirectlyRelevant)
            .sort((a, b) => (b.connection?.relevantWeak?.length || 0) - (a.connection?.relevantWeak?.length || 0))[0];
          if (!top) return null;
          const { fighter, connection } = top;
          const acc = fighter.accent;
          const drill = connection.focusDrills?.[0] || connection.focusStudy?.[0];
          return (
            <div style={{
              position: "relative",
              background: `linear-gradient(135deg, ${acc}12 0%, rgba(0,0,0,0) 100%)`,
              border: `1px solid ${acc}30`,
              borderLeft: `3px solid ${acc}`,
              borderRadius: "3px 16px 16px 3px",
              padding: "14px 14px 12px",
              marginBottom: 20,
            }}>
              <p style={{ margin: "0 0 10px", fontSize: 9, fontWeight: 900, color: acc, letterSpacing: 2.5, textTransform: "uppercase" }}>
                {locale === "mn" ? "⚡ Өнөөдрийн анхаарал" : locale === "ko" ? "⚡ 오늘의 집중" : "⚡ Today's Focus"}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: drill ? 10 : 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${acc}20`, border: `1px solid ${acc}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
                  🥊
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{fighter.name}</div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                    {locale === "mn"
                      ? `Таны ${connection.primaryFocus} — ${connection.primaryValue?.toFixed(1)}/10`
                      : `Your ${connection.primaryFocus} · ${connection.primaryValue?.toFixed(1)}/10`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/fighters/${fighter.id}`)}
                  style={{ background: `${acc}22`, border: `1px solid ${acc}45`, borderRadius: 10, padding: "7px 13px", color: acc, fontSize: 11, fontWeight: 900, cursor: "pointer" }}
                >
                  {locale === "mn" ? "Үзэх" : locale === "ko" ? "보기" : "Study"}
                </button>
              </div>
              {drill && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "9px 11px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 }}>
                  <svg width="9" height="11" viewBox="0 0 13 16" fill={acc} style={{ marginTop: 1.5, flexShrink: 0 }}>
                    <path d="M7 0L0 9h6l-1 7 7-9H6L7 0z"/>
                  </svg>
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>{drill}</span>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/drills`)}
                  style={{ padding: "9px 0", borderRadius: 10, background: `${acc}12`, border: `1px solid ${acc}30`, color: acc, fontSize: 11, fontWeight: 900, cursor: "pointer" }}
                >
                  {locale === "mn" ? "⚡ Дасгал" : "⚡ Drills"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const area = connection.primaryFocus || weakAreas[0]?.[0] || "Guard";
                    const q = locale === "mn"
                      ? `Миний ${area} оноог хэрхэн сайжруулах вэ?`
                      : `How can I improve my ${area} score?`;
                    router.push(`/${locale}/coach/chat?q=${encodeURIComponent(q)}`);
                  }}
                  style={{ padding: "9px 0", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 900, cursor: "pointer" }}
                >
                  {locale === "mn" ? "💬 Coach" : "💬 Ask Coach"}
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── Weekly Training Plan ── */}
        <WeeklyPlanSection
          coachSnapshot={coachSnapshot}
          coachContextStr={coachContextStr}
          locale={locale}
          router={router}
          weekNumber={weekNumber}
          userId={user?.uid}
        />

        {/* ── 4-Week Program ── */}
        <FourWeekProgram
          coachSnapshot={coachSnapshot}
          locale={locale}
          router={router}
        />

        {/* ── Adaptive Recommendations (11A) ── */}
        {sessionsReady && coachSnapshot && (
          <AdaptiveRecommendations
            coachSnapshot={coachSnapshot}
            locale={locale}
            router={router}
            userId={user?.uid}
            trainingSessions={trainingSessions}
          />
        )}

        {/* ── Fighter Study Roadmap (11B) ── */}
        {sessionsReady && coachSnapshot && trainingSessions.length >= 3 && (
          <FighterStudyRoadmap
            coachSnapshot={coachSnapshot}
            locale={locale}
            router={router}
            userId={user?.uid}
          />
        )}

        {/* ── Goal Tracker (8A) ── */}
        <div id="goal-tracker-section">
        {sessionsReady && (
          <GoalTracker
            userId={user?.uid}
            radarStats={radarStats}
            locale={locale}
            coachSnapshot={coachSnapshot}
          />
        )}

        </div>{/* /goal-tracker-section */}

        {/* ── Training Calendar (8C) ── */}
        {sessionsReady && trainingSessions.length > 0 && (
          <TrainingCalendar
            trainingSessions={trainingSessions}
            locale={locale}
          />
        )}

        {/* ── Monthly Report (9A) ── */}
        {sessionsReady && (
          <MonthlyReport
            coachSnapshot={coachSnapshot}
            coachContextStr={coachContextStr}
            locale={locale}
            userId={user?.uid}
            trainingSessions={trainingSessions}
          />
        )}

        {/* ── Desktop: 2-col grid ── */}
        <div style={isDesktop ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px", alignItems: "start" } : {}}>
        <div> {/* Left col */}

        {/* ── Fighter Score Hero ── */}
        <FighterHero
          displayScore={displayScore}
          fighterScore={fighterScore}
          xp={xp}
          rank={rank}
          nextRank={nextRank}
          xpProgress={xpProgress}
          insight={insight}
          t={t}
        />

        {/* ── Fighter Style Archetype chip ── */}
        {fighterArchetype && ARCHETYPE_DISPLAY[fighterArchetype] && (() => {
          const arch = ARCHETYPE_DISPLAY[fighterArchetype];
          return (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: 12, marginBottom: 14,
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.065)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{arch.emoji}</span>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: 1.2 }}>
                    {t("dashboardFighterStyleLabel")}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: arch.color }}>{arch.name}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuiz(true)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.22)", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "4px 8px" }}
              >
                {t("dashboardChangeStyle")}
              </button>
            </div>
          );
        })()}

        {/* ── 4 Stat Pills ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 32 }}>
          <StatPill
            label={t("dashboardTrainingStreak")}
            value={`${dailyStreak}d`}
            sub={bestStreak > 0 ? `${t("dashboardBestStreak")} ${bestStreak}d` : undefined}
            color="#FB923C"
          />
          <StatPill
            label={t("dashboardBestScore")}
            value={stats.bestScore != null ? formatScore(stats.bestScore) : "—"}
            sub="/10"
            color={GOLD}
          />
          <StatPill
            label={t("dashboardTotalSessions")}
            value={trainingSessions.length}
            color="#fff"
          />
          <StatPill
            label={t("dashboardXP")}
            value={xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : xp}
            color={GOLD}
          />
        </div>

        {/* ── Fighter Mastery ── */}
        {(() => {
          const studied = userData?.studiedFighters || [];
          if (!studied.length) return null;
          const pct = Math.round((studied.length / FIGHTERS.length) * 100);
          return (
            <div style={{ marginBottom: 20, padding: "11px 14px", borderRadius: 13, background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.14)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.8, color: "#34D399", textTransform: "uppercase" }}>
                  ⚔️ {locale === "mn" ? "Fighter Mastery" : "Fighter Mastery"}
                </span>
                <span style={{ fontSize: 12, fontWeight: 900, color: "#34D399" }}>
                  {studied.length}/{FIGHTERS.length} · {pct}%
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #34D399, #10B981)", animation: "rankFill 850ms cubic-bezier(0.16,1,0.3,1) both" }} />
              </div>
              {pct === 100 && (
                <div style={{ marginTop: 8, fontSize: 10.5, fontWeight: 800, color: "#34D399", textAlign: "center" }}>
                  🏆 {locale === "mn" ? "Бүх тулаанчдыг судалсан!" : "All fighters studied!"}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Fighter Path ── */}
        <FighterPath
          pathData={{
            photoURL: userData?.photoURL || user?.photoURL,
            bio: userData?.bio,
            reelsCount,
            challengesCount: challengeCount,
            streakDays: dailyStreak,
            coachId: userData?.coachId,
            hasCoach: userData?.hasCoach,
          }}
          locale={locale}
          router={router}
        />

        {/* ── Combat Profile (Radar) ── */}
        <PanelCard
          label={locale === "mn" ? "Дайны профайл" : locale === "ko" ? "전투 프로필" : "Combat Profile"}
          accent={RED}
          tag="6 METRICS"
        >
          <div style={{ background: `radial-gradient(ellipse at center, rgba(255,59,48,0.06) 0%, transparent 70%)`, padding: "4px 0 0" }}>
            <RadarChart stats={radarStats} prevStats={prevRadarStats} />
          </div>
        </PanelCard>

        {/* ── Style DNA ── */}
        <PanelCard
          label={locale === "mn" ? "Тоглолтын хэв маяг" : locale === "ko" ? "스타일 DNA" : "Style DNA"}
          accent={GOLD}
          tag="5 ATTRS"
        >
          <StyleDNA radarStats={radarStats} />
        </PanelCard>

        </div> {/* /Left col */}
        <div> {/* Right col */}

        {/* ── Score Trend ── */}
        <PanelCard
          label={locale === "mn" ? "Оноогийн чиглэл" : locale === "ko" ? "점수 추세" : "Score Trend"}
          accent={RED}
          tag={`${stats.chronoScores.length} SESS`}
        >
          <div style={{ padding: "2px 0 0" }}>
            <ScoreChart scores={stats.chronoScores} t={t} />
          </div>
        </PanelCard>

        {/* ── Session History ── */}
        <PanelCard
          label={t("dashboardTrainingHistory")}
          accent="rgba(255,255,255,0.22)"
          tag={`${trainingSessions.length} TOTAL`}
        >
          {trainingSessions.length === 0 ? (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", margin: 0 }}>{t("dashboardNoSessions")}</p>
          ) : (
            <>
              {visibleSessions.map((s) => (
                <SessionRow key={s.id} session={s} t={t} />
              ))}
              {trainingSessions.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllSessions(!showAllSessions)}
                  style={{ ...ghostBtnStyle, marginTop: 10, width: "100%", flex: "unset" }}
                >
                  {showAllSessions
                    ? t("dashboardShowLess")
                    : `${t("dashboardShowAll")} ${trainingSessions.length}`}
                </button>
              )}
            </>
          )}
        </PanelCard>

        {/* ── Body Stats ── */}
        <PanelCard
          label={t("dashboardBodyProgress")}
          accent="#60A5FA"
        >
          <BodyProgressSection userId={user?.uid} t={t} />
        </PanelCard>

        {/* ── Achievements ── */}
        <BadgesSection
          sessionCount={trainingSessions.length}
          bestScore={stats.bestScore ?? 0}
          streakDays={dailyStreak}
          studiedCount={(userData?.studiedFighters || []).length}
          totalFighters={FIGHTERS.length}
          radarStats={radarStats}
          locale={locale}
        />

        {/* ── Activity Feed ── */}
        <PanelCard label={t("activityFeedTitle") || "Following Activity"} accent="#60A5FA">
          <ActivityFeed user={user} t={t} maxItems={10} />
        </PanelCard>

        </div> {/* /Right col */}
        </div> {/* /Desktop grid */}

      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />

      {showQuiz && (
        <FighterStyleQuiz
          user={user}
          onComplete={(archetype) => {
            setFighterArchetype(archetype);
            setShowQuiz(false);
          }}
        />
      )}

      {showShareCard && (() => {
        const { computeEarnedBadges } = require("@/lib/badges");
        const earned = computeEarnedBadges({
          sessionCount: trainingSessions.length,
          bestScore: stats.bestScore ?? 0,
          streakDays: dailyStreak,
          studiedCount: (userData?.studiedFighters || []).length,
          totalFighters: FIGHTERS.length,
          radarStats,
        });
        return (
          <ProgressShareCard
            username={userData?.username || user?.displayName || "Fighter"}
            fighterScore={fighterScore}
            rank={rank}
            xp={xp}
            dailyStreak={dailyStreak}
            radarStats={radarStats}
            badgeCount={earned.length}
            weekSessions={weekSessions.length}
            locale={locale}
            onClose={() => setShowShareCard(false)}
          />
        );
      })()}
    </div>
  );
}
