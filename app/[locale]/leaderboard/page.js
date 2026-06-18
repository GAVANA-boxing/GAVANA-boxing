"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import SkeletonBlock from "@/components/SkeletonBlock";
import { getLocale, translate } from "@/lib/i18n";
import { getCurrentSeasonId, getSeasonLabel } from "@/lib/season";
import styles from "@/components/leaderboard/leaderboardStyles";
import { useWeeklyCountdown } from "@/lib/leaderboardHelpers";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { LeaderboardEntry } from "@/components/leaderboard/LeaderboardEntry";

import LeaderboardHeader from "@/components/leaderboard/LeaderboardHeader";
import LeaderboardTabs from "@/components/leaderboard/LeaderboardTabs";
import LeaderboardFilters from "@/components/leaderboard/LeaderboardFilters";
import YourRankCard from "@/components/leaderboard/YourRankCard";
import WeeklyChampionBanner from "@/components/leaderboard/WeeklyChampionBanner";
import LeaderboardPodium from "@/components/leaderboard/LeaderboardPodium";
import LeaderboardEmptyState from "@/components/leaderboard/LeaderboardEmptyState";

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [leaderboardTab, setLeaderboardTab] = useState("week");
  const [socialSubTab, setSocialSubTab] = useState("active");
  const [archetypeFilter, setArchetypeFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const weeklyCountdownMs = useWeeklyCountdown();

  const currentSeasonId = useMemo(() => getCurrentSeasonId(), []);
  const seasonLabel = useMemo(() => getSeasonLabel(currentSeasonId), [currentSeasonId]);

  const {
    entries,
    profiles,
    loading,
    weeklyEntries,
    improvementEntries,
    streakEntries,
    friendsEntries,
    viewsEntries,
    likesEntries,
    activeEntries,
    respondersEntries,
    currentUserAllTimeRank,
    currentUserWeeklyRank,
    currentUserAllTimeEntry,
    currentUserWeeklyEntry,
    weeklyChampion,
  } = useLeaderboardData({ user, currentSeasonId });

  useEffect(() => { setVisibleCount(20); }, [leaderboardTab, archetypeFilter, weightFilter, socialSubTab]);

  const displayEntries =
    leaderboardTab === "week"        ? weeklyEntries
    : leaderboardTab === "improvement" ? improvementEntries
    : leaderboardTab === "streak"    ? streakEntries
    : leaderboardTab === "friends"   ? friendsEntries
    : leaderboardTab === "views"     ? viewsEntries
    : leaderboardTab === "likes"     ? likesEntries
    : leaderboardTab === "social"    ? (socialSubTab === "responders" ? respondersEntries : activeEntries)
    : entries;

  const filteredDisplayEntries = useMemo(() => {
    let result = displayEntries;
    if (archetypeFilter !== "all") {
      result = result.filter((e) => profiles[e.userId]?.fighterArchetype === archetypeFilter);
    }
    if (weightFilter !== "all") {
      result = result.filter((e) => profiles[e.userId]?.weightClass === weightFilter);
    }
    return result;
  }, [displayEntries, archetypeFilter, weightFilter, profiles]);

  const hasUserData = !authLoading && user && (currentUserAllTimeEntry || currentUserWeeklyEntry);

  // Send "You're #X this week" push once per day when rank loads
  useEffect(() => {
    if (!currentUserWeeklyRank || !user?.uid) return;
    const storageKey = `rank_notified_${user.uid}`;
    const last = parseInt(localStorage.getItem(storageKey) || "0", 10);
    if (Date.now() - last < 20 * 60 * 60 * 1000) return;
    localStorage.setItem(storageKey, String(Date.now()));
    import("firebase/auth").then(({ getAuth }) => {
      getAuth().currentUser?.getIdToken().then((token) => {
        fetch("/api/rank-notify", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ rank: currentUserWeeklyRank, locale }),
        }).catch(() => {});
      }).catch(() => {});
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserWeeklyRank, user?.uid]);

  const handleShareRank = async () => {
    const rank = leaderboardTab === "week" ? currentUserWeeklyRank : currentUserAllTimeRank;
    const score = leaderboardTab === "week"
      ? (currentUserWeeklyEntry?.bestScore ?? 0)
      : (currentUserAllTimeEntry?.bestScore ?? 0);
    if (!rank) return;
    const text = locale === "mn"
      ? `GAVANA BOXING дээр миний rank #${rank} байна, score ${score}/10 🥊 gavana.app`
      : locale === "ko"
      ? `GAVANA BOXING에서 내 랭킹 #${rank}, 점수 ${score}/10 🥊 gavana.app`
      : `I'm ranked #${rank} on GAVANA BOXING with ${score}/10 🥊 gavana.app`;
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
    } catch {}
    try { await navigator.clipboard.writeText(text); } catch {}
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const showPodium =
    !loading &&
    filteredDisplayEntries.length >= 3 &&
    (leaderboardTab === "week" || leaderboardTab === "alltime");

  return (
    <main style={styles.page} className="page-enter">
      <LeaderboardHeader
        onBack={() => router.push(`/${locale}/discover`)}
        title={t("leaderboardTitle")}
      />

      <LeaderboardTabs
        leaderboardTab={leaderboardTab}
        setLeaderboardTab={setLeaderboardTab}
        socialSubTab={socialSubTab}
        setSocialSubTab={setSocialSubTab}
        seasonLabel={seasonLabel}
        weeklyCountdownMs={weeklyCountdownMs}
        locale={locale}
        t={t}
        onFriendsClick={() => {
          if (!user?.uid) { router.push(`/${locale}/login`); return; }
          setLeaderboardTab("friends");
        }}
      />

      <LeaderboardFilters
        archetypeFilter={archetypeFilter}
        setArchetypeFilter={setArchetypeFilter}
        weightFilter={weightFilter}
        setWeightFilter={setWeightFilter}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        t={t}
      />

      <div style={styles.content}>
        {hasUserData && (
          <YourRankCard
            leaderboardTab={leaderboardTab}
            currentUserWeeklyRank={currentUserWeeklyRank}
            currentUserAllTimeRank={currentUserAllTimeRank}
            currentUserWeeklyEntry={currentUserWeeklyEntry}
            currentUserAllTimeEntry={currentUserAllTimeEntry}
            weeklyEntries={weeklyEntries}
            entries={entries}
            profiles={profiles}
            userId={user.uid}
            shareCopied={shareCopied}
            onShare={handleShareRank}
            t={t}
          />
        )}

        {leaderboardTab === "week" && !loading && weeklyChampion && (
          <WeeklyChampionBanner champion={weeklyChampion} profiles={profiles} t={t} />
        )}

        {/* Section header */}
        <div style={styles.sectionHeader}>
          <p style={styles.sectionKicker}>
            {leaderboardTab === "week" ? t("seasonCurrentWeek").toUpperCase() : t("leaderboardKicker")}
          </p>
          <h2 style={styles.sectionTitle}>{t("leaderboardTopFighters")}</h2>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonBlock key={i} height={72} radius={14} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredDisplayEntries.length === 0 && (
          <LeaderboardEmptyState
            leaderboardTab={leaderboardTab}
            archetypeFilter={archetypeFilter}
            weightFilter={weightFilter}
            t={t}
          />
        )}

        {/* Top-3 podium */}
        {showPodium && (
          <LeaderboardPodium
            entries={filteredDisplayEntries}
            profiles={profiles}
            locale={locale}
            t={t}
            onSelect={(userId) => router.push(`/${locale}/profile/${userId}`)}
          />
        )}

        {/* Leaderboard list */}
        {!loading && filteredDisplayEntries.length > 0 && (
          <div key={leaderboardTab} style={styles.list} className="stagger-list">
            {filteredDisplayEntries.slice(0, visibleCount).map((entry, index) => (
              <LeaderboardEntry
                key={entry.userId}
                entry={entry}
                index={index}
                profiles={profiles}
                user={user}
                entries={entries}
                weeklyEntries={weeklyEntries}
                streakEntries={streakEntries}
                improvementEntries={improvementEntries}
                leaderboardTab={leaderboardTab}
                locale={locale}
                router={router}
                t={t}
                styles={styles}
              />
            ))}
            {filteredDisplayEntries.length > visibleCount && (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 20)}
                style={{ width: "100%", padding: "14px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 800, cursor: "pointer", marginTop: 4 }}
              >
                {t("lbLoadMore").replace("{n}", Math.min(20, filteredDisplayEntries.length - visibleCount))}
              </button>
            )}
          </div>
        )}
      </div>

      <BottomNav
        router={router}
        user={user}
        currentLocale={locale}
        activeTab=""
      />
    </main>
  );
}
