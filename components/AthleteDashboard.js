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
import { RED, GOLD, goldAlpha } from "@/lib/tokens";
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
  const [fighterArchetype, setFighterArchetype] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [reelsCount, setReelsCount] = useState(0);

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
      } catch (e) {
        console.error("Dashboard load error:", e);
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

  const fighterScore = useMemo(() =>
    computeFighterScore(stats.scores, xp, dailyStreak),
    [stats.scores, xp, dailyStreak]
  );

  const displayScore = useCountUp(fighterScore, rankReady);
  const visibleSessions = showAllSessions ? trainingSessions : trainingSessions.slice(0, 5);

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
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070707" }}>
        <div style={{ width: 28, height: 28, border: "2px solid #C1121F", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div
      className="page-enter"
      style={{ background: `radial-gradient(ellipse at top center, rgba(193,18,31,0.07) 0%, transparent 48%), #070707`, minHeight: "100dvh", color: "#fff" }}
    >
      <style>{`
        @keyframes rankFill { from { width: 0 !important; } }
        @keyframes radarFade { from { opacity: 0; transform-origin: center; transform: scale(0.82); } to { opacity: 1; transform: scale(1); } }
        .radar-polygon { animation: radarFade 750ms cubic-bezier(0.16,1,0.3,1) both; }
        .graph-line { animation: radarFade 600ms cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "calc(20px + env(safe-area-inset-top)) 16px calc(96px + env(safe-area-inset-bottom))" }}>

        <div style={{ marginBottom: 22 }}>
          <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 900, color: "rgba(193,18,31,0.7)", letterSpacing: 3, textTransform: "uppercase" }}>
            GAVANA
          </p>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1, fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>
            {userData?.username || user?.displayName || (locale === "mn" ? "Тамирчны ахиц" : locale === "ko" ? "선수 현황" : "My Progress")}
          </h1>
        </div>

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
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", color: "#34D399", fontSize: 12, fontWeight: 900 }}>
                🥊 {weekSessions.length} {locale === "mn" ? "сесс" : locale === "ko" ? "세션" : "sessions"}
              </span>
              {weekXP > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, background: `${goldAlpha(0.1)}`, border: `1px solid ${goldAlpha(0.25)}`, color: GOLD, fontSize: 12, fontWeight: 900 }}>
                  ⚡ +{weekXP} XP
                </span>
              )}
              {weekScores.length > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", color: "#60A5FA", fontSize: 12, fontWeight: 900 }}>
                  ⭐ {weekAvg?.toFixed(1)}/10 avg
                </span>
              )}
              {scoreTrend !== null && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, background: scoreTrend >= 0 ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${scoreTrend >= 0 ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`, color: scoreTrend >= 0 ? "#34D399" : "#F87171", fontSize: 12, fontWeight: 900 }}>
                  {scoreTrend >= 0 ? "📈" : "📉"} {scoreTrend >= 0 ? "+" : ""}{scoreTrend.toFixed(1)} {locale === "mn" ? "оноо" : locale === "ko" ? "점" : "pts"}
                </span>
              )}
              {dailyStreak >= 3 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)", color: "#FB923C", fontSize: 12, fontWeight: 900 }}>
                  🔥 {dailyStreak}{locale === "mn" ? "ш streak" : locale === "ko" ? "일 스트릭" : "d streak"}
                </span>
              )}
            </div>
          </div>
        )}

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
          <div style={{ background: `radial-gradient(ellipse at center, rgba(193,18,31,0.06) 0%, transparent 70%)`, padding: "4px 0 0" }}>
            <RadarChart stats={radarStats} />
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

        {/* ── Activity Feed ── */}
        <PanelCard label={t("activityFeedTitle") || "Following Activity"} accent="#60A5FA">
          <ActivityFeed user={user} t={t} maxItems={10} />
        </PanelCard>

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
    </div>
  );
}
