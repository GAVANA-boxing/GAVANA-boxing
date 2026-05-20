"use client";


import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import SkeletonBlock from "@/components/SkeletonBlock";
import { getLocale, translate } from "@/lib/i18n";
import { getCurrentSeasonId, getSeasonLabel } from "@/lib/season";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/leaderboard/leaderboardStyles";
import { useWeeklyCountdown, formatCountdown, getScoreColor, getAvatarUrl } from "@/lib/leaderboardHelpers";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { LeaderboardEntry } from "@/components/leaderboard/LeaderboardEntry";
import RankBadge from "@/components/RankBadge";
import { getFighterRank } from "@/lib/xp";
import Image from "next/image";

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [leaderboardTab, setLeaderboardTab] = useState("week");
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
    currentUserAllTimeRank,
    currentUserWeeklyRank,
    currentUserAllTimeEntry,
    currentUserWeeklyEntry,
    weeklyChampion,
  } = useLeaderboardData({ user, currentSeasonId });

  useEffect(() => { setVisibleCount(20); }, [leaderboardTab, archetypeFilter, weightFilter]);

  const displayEntries =
    leaderboardTab === "week" ? weeklyEntries
    : leaderboardTab === "improvement" ? improvementEntries
    : leaderboardTab === "streak" ? streakEntries
    : leaderboardTab === "friends" ? friendsEntries
    : leaderboardTab === "views" ? viewsEntries
    : leaderboardTab === "likes" ? likesEntries
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

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <button
          type="button"
          style={styles.backBtn}
          onClick={() => router.push(`/${locale}/discover`)}
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={styles.headerCenter}>
          <p style={styles.eyebrow}>GAVANA BOXING</p>
          <h1 style={styles.title}>{t("leaderboardTitle")}</h1>
        </div>
        <div style={styles.trophyBadge} aria-hidden="true">🏆</div>
      </header>

      {/* Season tabs */}
      <div style={styles.tabsWrap}>
        <div style={styles.tabsRow}>
          <button
            type="button"
            style={{ ...styles.tabBtn, ...(leaderboardTab === "week" ? styles.tabBtnActive : {}) }}
            onClick={() => setLeaderboardTab("week")}
          >
            {t("leaderboardTabWeek")}
          </button>
          <button
            type="button"
            style={{ ...styles.tabBtn, ...(leaderboardTab === "alltime" ? styles.tabBtnActive : {}) }}
            onClick={() => setLeaderboardTab("alltime")}
          >
            {t("leaderboardTabAllTime")}
          </button>
          <button
            type="button"
            style={{ ...styles.tabBtn, ...(leaderboardTab === "improvement" ? styles.tabBtnActive : {}) }}
            onClick={() => setLeaderboardTab("improvement")}
          >
            {t("lbImprovement")}
          </button>
          <button
            type="button"
            style={{ ...styles.tabBtn, ...(leaderboardTab === "streak" ? styles.tabBtnActive : {}) }}
            onClick={() => setLeaderboardTab("streak")}
          >
            {t("lbStreak")}
          </button>
          <button
            type="button"
            style={{ ...styles.tabBtn, ...(leaderboardTab === "friends" ? styles.tabBtnActive : {}) }}
            onClick={() => {
              if (!user?.uid) { router.push(`/${locale}/login`); return; }
              setLeaderboardTab("friends");
            }}
          >
            {t("friendsLeaderboard")}
          </button>
          <button
            type="button"
            style={{ ...styles.tabBtn, ...(leaderboardTab === "views" ? styles.tabBtnViews : {}) }}
            onClick={() => setLeaderboardTab("views")}
          >
            👁 {t("lbViews")}
          </button>
          <button
            type="button"
            style={{ ...styles.tabBtn, ...(leaderboardTab === "likes" ? styles.tabBtnLikes : {}) }}
            onClick={() => setLeaderboardTab("likes")}
          >
            ❤️ {t("lbLikes")}
          </button>
        </div>
        {leaderboardTab === "week" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 4px 0" }}>
            <p style={{ ...styles.seasonLabel, margin: 0 }}>{seasonLabel}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, background: `${redAlpha(0.1)}`, border: `1px solid ${redAlpha(0.25)}` }}>
              <span style={{ fontSize: 10 }}>⏱</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#F87171", letterSpacing: 0.3 }}>
                {t("lbResets")}
                {weeklyCountdownMs !== null ? formatCountdown(weeklyCountdownMs, locale) : "—"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Archetype + weight filters — collapsible */}
      <div style={styles.filterWrap}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, border: `1px solid ${(archetypeFilter !== "all" || weightFilter !== "all") ? redAlpha(0.55) : "rgba(255,255,255,0.1)"}`, background: (archetypeFilter !== "all" || weightFilter !== "all") ? redAlpha(0.1) : "rgba(255,255,255,0.04)", color: (archetypeFilter !== "all" || weightFilter !== "all") ? "#F87171" : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            {t("lbFilter") || "Шүүлтүүр"}
            {(archetypeFilter !== "all" || weightFilter !== "all") && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F87171", flexShrink: 0 }} />
            )}
          </button>
          {(archetypeFilter !== "all" || weightFilter !== "all") && (
            <button
              type="button"
              onClick={() => { setArchetypeFilter("all"); setWeightFilter("all"); }}
              style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >
              ✕ {t("lbClearFilter") || "Арилгах"}
            </button>
          )}
        </div>

        {showFilters && (
          <>
            <div style={styles.filterRow}>
              {[
                { key: "all", label: t("lbAllArchetype") },
                { key: "pressure", label: `${ARCHETYPE_DISPLAY.pressure.emoji} Pressure` },
                { key: "counter",  label: `${ARCHETYPE_DISPLAY.counter.emoji} Counter` },
                { key: "technical",label: `${ARCHETYPE_DISPLAY.technical.emoji} Technical` },
                { key: "brawler",  label: `${ARCHETYPE_DISPLAY.brawler.emoji} Brawler` },
              ].map(({ key, label }) => {
                const isActive = archetypeFilter === key;
                const color = key === "all" ? GOLD : ARCHETYPE_DISPLAY[key]?.color;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setArchetypeFilter(key)}
                    style={{
                      ...styles.filterChip,
                      ...(isActive ? {
                        background: `${color}22`,
                        border: `1px solid ${color}`,
                        color,
                      } : {}),
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div style={styles.filterRow}>
              {["all", "-54", "-60", "-67", "-75", "-81", "+91"].map((wt) => (
                <button
                  key={wt}
                  type="button"
                  onClick={() => setWeightFilter(wt)}
                  style={{
                    ...styles.filterChip,
                    ...(weightFilter === wt ? styles.filterChipActiveWeight : {}),
                  }}
                >
                  {wt === "all" ? t("lbAllWeights") : `${wt}kg`}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={styles.content}>
        {/* Current user rank card */}
        {hasUserData && (
          <div style={styles.yourRankCard}>
            <div style={styles.yourRankTop}>
              <span style={styles.yourRankLabel}>
                {leaderboardTab === "week"
                  ? (currentUserWeeklyRank
                    ? t("seasonWeeklyRank").replace("{rank}", currentUserWeeklyRank)
                    : t("seasonNoResultsThisWeek").split(".")[0])
                  : t("leaderboardYourRank").replace("{rank}", currentUserAllTimeRank ?? "—")}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ ...styles.scorePill, background: getScoreColor(leaderboardTab === "week" ? (currentUserWeeklyEntry?.bestScore ?? 0) : (currentUserAllTimeEntry?.bestScore ?? 0)) }}>
                  {leaderboardTab === "week"
                    ? `${currentUserWeeklyEntry?.bestScore ?? 0}/10`
                    : `${currentUserAllTimeEntry?.bestScore ?? 0}/10`}
                </span>
                <button
                  type="button"
                  onClick={handleShareRank}
                  style={{ padding: "4px 10px", borderRadius: 999, border: `1px solid ${goldAlpha(0.3)}`, background: `${goldAlpha(0.08)}`, color: GOLD, fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                >
                  {shareCopied ? "✓" : t("lbShare")}
                </button>
              </div>
            </div>
            <div style={styles.yourRankSub}>
              {currentUserWeeklyRank && (
                <span style={{ color: "#60A5FA" }}>
                  {t("seasonWeeklyRank").replace("{rank}", currentUserWeeklyRank)}
                </span>
              )}
              {currentUserWeeklyRank && currentUserAllTimeRank && "  ·  "}
              {currentUserAllTimeRank && (
                <span>
                  {t("seasonAllTimeRank").replace("{rank}", currentUserAllTimeRank)}
                </span>
              )}
              {(currentUserWeeklyRank || currentUserAllTimeRank) && currentUserAllTimeEntry && "  ·  "}
              {currentUserAllTimeEntry && `${currentUserAllTimeEntry.xp.toLocaleString()} ${t("xpLabel")}`}
            </div>
            {(() => {
              const topEntry = leaderboardTab === "week" ? weeklyEntries[0] : entries[0];
              const userScore = leaderboardTab === "week" ? (currentUserWeeklyEntry?.bestScore ?? null) : (currentUserAllTimeEntry?.bestScore ?? null);
              const topScore = topEntry?.bestScore ?? null;
              if (!topEntry || userScore === null || topScore === null) return null;
              if (topEntry.userId === user?.uid) return (
                <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, color: GOLD }}>
                  👑 {t("lbYouAreFirst")}
                </div>
              );
              const gap = Math.max(0, topScore - userScore).toFixed(1);
              return (
                <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.38)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: RED, fontWeight: 900 }}>-{gap}</span>
                  <span>{t("lbPtsFromFirst")}</span>
                  <span style={{ color: "rgba(255,255,255,0.25)" }}>· #{1}</span>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>
                    {profiles[topEntry.userId]?.displayName?.split(" ")[0] || profiles[topEntry.userId]?.username || "Fighter"}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.25)" }}>({topScore}/10)</span>
                </div>
              );
            })()}
          </div>
        )}

        {/* Weekly champion banner */}
        {leaderboardTab === "week" && !loading && weeklyChampion && (
          <div style={styles.weeklyChampionBanner}>
            <div style={styles.weeklyChampionTop}>
              <span style={styles.weeklyChampionCrown}>👑</span>
              <span style={styles.weeklyChampionTitle}>{t("leaderboardWeeklyChampion")}</span>
            </div>
            <div style={styles.weeklyChampionName}>
              {profiles[weeklyChampion.userId]?.displayName ||
                profiles[weeklyChampion.userId]?.username ||
                "Fighter"}
            </div>
            <div style={styles.weeklyChampionScore}>
              {weeklyChampion.bestScore}/10
            </div>
          </div>
        )}

        {/* Section header */}
        <div style={styles.sectionHeader}>
          <p style={styles.sectionKicker}>
            {leaderboardTab === "week" ? t("seasonCurrentWeek").toUpperCase() : t("leaderboardKicker")}
          </p>
          <h2 style={styles.sectionTitle}>{t("leaderboardTopFighters")}</h2>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonBlock key={i} height={72} radius={14} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredDisplayEntries.length === 0 && (
          <div style={styles.emptyWrap}>
            <div style={styles.emptyIcon}>🏆</div>
            <p style={styles.emptyTitle}>
              {archetypeFilter !== "all" || weightFilter !== "all"
                ? t("lbNoFightersFilter")
                : leaderboardTab === "week" ? t("seasonNoResultsThisWeek") : leaderboardTab === "improvement" ? t("lbImprovementEmpty") : leaderboardTab === "streak" ? t("lbStreakEmpty") : leaderboardTab === "friends" ? t("followingEmptyHelp") : t("leaderboardEmpty")}
            </p>
            <p style={styles.emptyText}>
              {archetypeFilter !== "all" || weightFilter !== "all"
                ? t("lbNoFightersFilterHint")
                : t("leaderboardEmptyHelp")}
            </p>
          </div>
        )}

        {/* Top-3 Podium Card */}
        {!loading && filteredDisplayEntries.length >= 3 && (leaderboardTab === "week" || leaderboardTab === "alltime") && (
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 8, marginBottom: 20, padding: "0 8px" }}>
            {[1, 0, 2].map((idx) => {
              const entry = filteredDisplayEntries[idx];
              const rank = idx + 1;
              const profile = profiles[entry?.userId] || {};
              const name = profile.displayName || profile.username || "Fighter";
              const photo = getAvatarUrl(profile);
              const isFirst = rank === 1;
              const podiumH = idx === 0 ? 128 : idx === 1 ? 100 : 84;
              const medals = ["🥇", "🥈", "🥉"];
              const colors = [GOLD, "#C0C0C0", "#CD7F32"];
              if (!entry) return null;
              const avatarSize = isFirst ? 56 : 44;
              const glowShadow = isFirst
                ? `0 0 0 2.5px ${colors[0]}, 0 0 22px ${colors[0]}88`
                : `0 0 8px ${colors[rank - 1]}44`;
              const fighterRank = getFighterRank(entry.xp ?? 0);
              return (
                <div key={rank} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }} onClick={() => router.push(`/${locale}/profile/${entry.userId}`)}>
                  <span style={{ fontSize: isFirst ? 20 : 16 }}>{medals[rank - 1]}</span>
                  {photo
                    ? <Image src={photo} alt="" width={avatarSize} height={avatarSize} style={{ borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${colors[rank - 1]}`, boxShadow: glowShadow }} />
                    : <div style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: `2.5px solid ${colors[rank - 1]}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isFirst ? 22 : 16, fontWeight: 900, color: "#fff", boxShadow: glowShadow }}>{name[0]?.toUpperCase()}</div>
                  }
                  <span style={{ fontSize: isFirst ? 11 : 10, fontWeight: 800, color: isFirst ? "#fff" : "rgba(255,255,255,0.7)", maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center", fontFamily: "var(--font-condensed)" }}>{name.split(" ")[0]}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <RankBadge rank={fighterRank} size={isFirst ? 14 : 12} glowEnabled={isFirst} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: fighterRank.color, fontFamily: "var(--font-condensed)", letterSpacing: "0.05em", maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t(fighterRank.key)}</span>
                  </div>
                  <span style={{ fontSize: isFirst ? 13 : 11, fontWeight: 900, color: colors[rank - 1], textAlign: "center", fontFamily: "var(--font-display)" }}>{entry.bestScore}/10</span>
                  <div style={{ width: "100%", height: podiumH, borderRadius: "8px 8px 0 0", background: isFirst ? `linear-gradient(180deg, ${colors[0]}44, ${colors[0]}18)` : `linear-gradient(180deg, ${colors[rank - 1]}2a, ${colors[rank - 1]}0e)`, border: `1px solid ${colors[rank - 1]}${isFirst ? "88" : "44"}`, borderBottom: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isFirst ? `0 -4px 20px ${colors[0]}33` : `0 -2px 10px ${colors[rank-1]}18` }}>
                    <span style={{ fontSize: isFirst ? 22 : 18, fontWeight: 900, color: colors[rank - 1], opacity: isFirst ? 0.8 : 0.5, fontFamily: "var(--font-display)" }}>#{rank}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Leaderboard list */}
        {!loading && filteredDisplayEntries.length > 0 && (
          <div style={styles.list}>
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
        activeTab="discover"
      />
    </main>
  );
}

