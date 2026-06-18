"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { useChallengesData } from "@/hooks/useChallengesData";
import { getLocale, translate } from "@/lib/i18n";
import { getCurrentSeasonId } from "@/lib/season";
import styles from "@/components/challenges/challengesStyles";
import { getTimestampMs, getActiveChallengeStreak } from "@/lib/utils";

import ChallengesHeader from "@/components/challenges/ChallengesHeader";
import MainTabBar from "@/components/challenges/MainTabBar";
import BattlesList from "@/components/challenges/BattlesList";
import SeasonFilterRow from "@/components/challenges/SeasonFilterRow";
import WeeklyChampionsBanner from "@/components/challenges/WeeklyChampionsBanner";
import YourRankBar from "@/components/challenges/YourRankBar";
import ChallengeCard from "@/components/challenges/ChallengeCard";

const CHALLENGES = [
  { id: "jab-minute",   titleKey: "challengeJabTitle",   descKey: "challengeJabDesc",   emoji: "🥊" },
  { id: "speed-test",   titleKey: "challengeSpeedTitle",  descKey: "challengeSpeedDesc",  emoji: "⚡" },
  { id: "combo-master", titleKey: "challengeComboTitle",  descKey: "challengeComboDesc",  emoji: "🎯" },
];

function getWeekEndMs() {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const weekEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday));
  return weekEnd.getTime();
}

function formatCountdown(msLeft) {
  if (msLeft <= 0) return "00:00:00";
  const totalSecs = Math.floor(msLeft / 1000);
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (d > 0) return `${d}d ${String(h).padStart(2, "0")}h`;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Deduplicate: keep only best score per user per challenge
function dedupeByUser(results) {
  const best = new Map();
  for (const r of results) {
    const key = r.userId;
    const prev = best.get(key);
    if (!prev || Number(r.score) > Number(prev.score)) best.set(key, r);
  }
  return [...best.values()].sort((a, b) => {
    const d = Number(b.score) - Number(a.score);
    return d !== 0 ? d : getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt);
  });
}

export default function ChallengesPage() {
  const params = useParams();
  const router = useRouter();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);
  const { user, loading: authLoading } = useAuth();

  const [seasonTab, setSeasonTab] = useState("week"); // "week" | "alltime"
  const [mainTab, setMainTab] = useState("leaderboard"); // "leaderboard" | "battles"
  const [countdown, setCountdown] = useState(() => formatCountdown(getWeekEndMs() - Date.now()));
  const { results, resultsLoading, profiles, myBattles, battlesLoading } = useChallengesData({ user, authLoading, mainTab });

  const currentSeasonId = useMemo(() => getCurrentSeasonId(), []);

  useEffect(() => {
    const id = setInterval(() => setCountdown(formatCountdown(getWeekEndMs() - Date.now())), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  // All results grouped and ranked per challenge (best score per user)
  const allTimeByChallenge = useMemo(() => {
    const grouped = {};
    for (const c of CHALLENGES) {
      grouped[c.id] = dedupeByUser(results.filter((r) => r.challengeId === c.id));
    }
    return grouped;
  }, [results]);

  // This week's results (seasonId matches)
  const weeklyByChallenge = useMemo(() => {
    const grouped = {};
    for (const c of CHALLENGES) {
      grouped[c.id] = dedupeByUser(results.filter((r) => r.challengeId === c.id && r.seasonId === currentSeasonId));
    }
    return grouped;
  }, [results, currentSeasonId]);

  const displayByChallenge = seasonTab === "week" ? weeklyByChallenge : allTimeByChallenge;

  if (authLoading) return (
    <div style={styles.page}>
      <div style={{ maxWidth: 540, margin: "0 auto", display: "grid", gap: 14 }}>
        <div className="shimmer" style={{ height: 40, width: 40, borderRadius: 10 }} />
        <div className="shimmer" style={{ height: 100, borderRadius: 16 }} />
        <div className="shimmer" style={{ height: 48, borderRadius: 14 }} />
        {[1, 2, 3].map((i) => <div key={i} className="shimmer" style={{ height: 220, borderRadius: 20 }} />)}
      </div>
    </div>
  );
  if (!user) return null;

  const currentChallengeStreak = getActiveChallengeStreak(profiles[user.uid]);

  // User's best rank across all challenges in current view
  const userRanks = CHALLENGES.map((c) => {
    const list = displayByChallenge[c.id] || [];
    const idx = list.findIndex((r) => r.userId === user.uid);
    return idx >= 0 ? { challenge: c, rank: idx + 1 } : null;
  }).filter(Boolean);
  const bestUserRank = userRanks.sort((a, b) => a.rank - b.rank)[0] || null;

  // Weekly champions (rank 1 per challenge this week)
  const weeklyChampions = CHALLENGES.map((c) => {
    const top = (weeklyByChallenge[c.id] || [])[0];
    return top ? { challenge: c, result: top, profile: profiles[top.userId] } : null;
  }).filter(Boolean);

  const hasPendingBattle = myBattles.some((b) => b.status === "pending" && b.role === "opponent");

  return (
    <main style={styles.page} className="page-enter cinematic-bg">
      <section style={styles.shell}>
        <button type="button" style={styles.backBtn} onClick={() => router.back()} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <ChallengesHeader
          labels={{
            kicker: "COMBAT · MISSIONS",
            title: t("challengesTitle"),
            subtitle: t("challengesSubtitle"),
            streakText: t("challengeStreak").replace("{n}", currentChallengeStreak),
          }}
        />

        <MainTabBar
          mainTab={mainTab}
          onTabChange={setMainTab}
          hasPendingBattle={hasPendingBattle}
          labels={{ leaderboard: t("battleLeaderboardTab"), battles: t("battleMyBattlesTab") }}
        />

        {mainTab === "battles" && (
          <BattlesList
            battles={myBattles}
            battlesLoading={battlesLoading}
            challenges={CHALLENGES}
            locale={locale}
            router={router}
            t={t}
          />
        )}

        {mainTab === "leaderboard" && (
          <>
            <SeasonFilterRow
              seasonTab={seasonTab}
              onTabChange={setSeasonTab}
              countdown={countdown}
              labels={{ currentWeek: t("seasonCurrentWeek"), allTime: t("seasonAllTime") }}
            />

            {seasonTab === "week" && (
              <WeeklyChampionsBanner champions={weeklyChampions} t={t} />
            )}

            <YourRankBar
              bestUserRank={bestUserRank}
              labels={{
                ranked: bestUserRank ? t("challengeYouAreRank").replace("{rank}", bestUserRank.rank) : "",
                unranked: t("challengeYouAreUnranked"),
              }}
              t={t}
            />

            <div style={styles.challengeList}>
              {CHALLENGES.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  list={(displayByChallenge[challenge.id] || []).slice(0, 5)}
                  profiles={profiles}
                  currentUserId={user.uid}
                  seasonTab={seasonTab}
                  locale={locale}
                  router={router}
                  t={t}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="challenges" />
      <style>{`
        @keyframes challengeScoreGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(245,196,81,0); }
          50% { box-shadow: 0 0 24px rgba(245,196,81,0.28); }
        }
      `}</style>
    </main>
  );
}
