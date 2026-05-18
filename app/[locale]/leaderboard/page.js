"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import { getLocale, translate } from "@/lib/i18n";
import { getFighterRank } from "@/lib/xp";

function useWeeklyCountdown() {
  const [ms, setMs] = useState(null);
  useEffect(() => {
    const getMs = () => {
      const now = new Date();
      const daysUntilMonday = (8 - now.getUTCDay()) % 7 || 7;
      const nextMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday));
      return Math.max(0, nextMonday - now);
    };
    setMs(getMs());
    const id = setInterval(() => setMs(getMs()), 1000);
    return () => clearInterval(id);
  }, []);
  return ms;
}

function formatCountdown(ms, locale) {
  if (ms === null) return "";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (locale === "mn") return d > 0 ? `${d}өд ${h}ц ${m}м` : `${h}ц ${m}м ${s}с`;
  if (locale === "ko") return d > 0 ? `${d}일 ${h}시 ${m}분` : `${h}시간 ${m}분 ${s}초`;
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;
}
import RankIcon from "@/components/RankIcon";
import { getCurrentSeasonId, getSeasonLabel } from "@/lib/season";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";

function getRankMedal(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

function formatCompact(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return String(num);
}

function getEntryBadges({ entry, rank, weeklyEntries, streakEntries, improvementEntries }) {
  const badges = [];
  if (weeklyEntries[0]?.userId === entry.userId)
    badges.push({ icon: "👑", label: "Weekly Champ", color: "#D4AF37" });
  if (rank <= 3)
    badges.push({ icon: "🏆", label: "Top 3", color: "#D4AF37" });
  else if (rank <= 10)
    badges.push({ icon: "🏅", label: "Top 10", color: "#60A5FA" });
  if (streakEntries[0]?.userId === entry.userId && streakEntries[0]?.bestScore >= 7)
    badges.push({ icon: "🔥", label: "Streak King", color: "#FB923C" });
  const impIdx = improvementEntries.findIndex((e) => e.userId === entry.userId);
  if (impIdx >= 0 && impIdx < 3)
    badges.push({ icon: "⚡", label: "Rising", color: "#34D399" });
  return badges.slice(0, 2);
}

function getScoreColor(score) {
  if (score >= 9) return "#D4AF37";
  if (score >= 7) return "#60A5FA";
  if (score >= 5) return "#A78BFA";
  return "#FB923C";
}

function getAvatarUrl(profile) {
  return (
    profile?.photoURL ||
    profile?.profileImageUrl ||
    profile?.profileImage ||
    profile?.avatarUrl ||
    ""
  );
}

function dedupeWeeklyByUser(results, seasonId) {
  const byUser = {};
  for (const r of results) {
    if (r.seasonId !== seasonId) continue;
    const uid = r.userId;
    const score = Number(r.score);
    if (Number.isNaN(score)) continue;
    if (!byUser[uid] || score > byUser[uid].bestScore) {
      byUser[uid] = { userId: uid, bestScore: score };
    }
  }
  return Object.values(byUser)
    .sort((a, b) => b.bestScore - a.bestScore)
    .slice(0, 50);
}

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [leaderboardTab, setLeaderboardTab] = useState("week");
  const [entries, setEntries] = useState([]);
  const [rawChallengeResults, setRawChallengeResults] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [archetypeFilter, setArchetypeFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [reelsStats, setReelsStats] = useState({});
  const [shareCopied, setShareCopied] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const weeklyCountdownMs = useWeeklyCountdown();

  const currentSeasonId = useMemo(() => getCurrentSeasonId(), []);
  const seasonLabel = useMemo(() => getSeasonLabel(currentSeasonId), [currentSeasonId]);

  useEffect(() => { setVisibleCount(20); }, [leaderboardTab, archetypeFilter, weightFilter]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const twentyEightDaysAgo = new Date(Date.now() - 28 * 86_400_000);

        // challenge_results: current season only (not all history)
        // training_sessions: last 28 days only (improvement tab needs 14+14 days)
        // reels: all (needed for views/likes leaderboard)
        // ai_feedback: skipped — use stored xp field from user profiles instead
        const [challengeSnapshot, usersSnapshot, trainingSnapshot, reelsSnapshot] = await Promise.all([
          getDocs(query(collection(db, "challenge_results"), where("seasonId", "==", currentSeasonId))),
          getDocs(collection(db, "users")),
          getDocs(query(collection(db, "training_sessions"), where("createdAt", ">", twentyEightDaysAgo))),
          getDocs(collection(db, "reels")),
        ]);

        const profileMap = {};
        usersSnapshot.forEach((userDoc) => {
          profileMap[userDoc.id] = { userId: userDoc.id, ...userDoc.data() };
        });

        // Store raw challenge results for weekly filtering
        const rawResults = [];
        challengeSnapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.userId && d.score != null) {
            rawResults.push({
              userId: d.userId,
              score: Number(d.score),
              seasonId: d.seasonId || null,
              challengeId: d.challengeId || null,
              createdAt: d.createdAt,
            });
          }
        });

        // Build userMap from stored profile XP (avoids loading entire ai_feedback collection)
        const userMap = {};
        Object.values(profileMap).forEach((p) => {
          const uid = p.userId;
          const storedXP = Number(p.xp) || 0;
          if (storedXP > 0 || p.displayName || p.username) {
            userMap[uid] = { userId: uid, xp: storedXP, challengeScores: [], latestTs: 0, latestScore: 0 };
          }
        });

        rawResults.forEach((r) => {
          const uid = r.userId;
          const score = r.score;
          if (Number.isNaN(score)) return;
          if (!userMap[uid]) {
            userMap[uid] = { userId: uid, xp: Number(profileMap[uid]?.xp) || 0, challengeScores: [], latestTs: 0, latestScore: 0 };
          }
          if (!userMap[uid].challengeScores) userMap[uid].challengeScores = [];
          userMap[uid].challengeScores.push(score);
          const ts = r.createdAt?.toMillis?.() || 0;
          if (ts >= userMap[uid].latestTs) {
            userMap[uid].latestTs = ts;
            userMap[uid].latestScore = score;
          }
        });

        const sorted = Object.values(userMap)
          .map((u) => {
            const scores = (u.challengeScores || []).filter((s) => Number.isFinite(s));
            return {
              userId: u.userId,
              bestScore: scores.length ? Math.max(...scores) : 0,
              latestScore: u.latestScore,
              sessions: (u.challengeScores || []).length,
              xp: u.xp,
            };
          })
          .sort((a, b) => b.xp - a.xp || b.bestScore - a.bestScore)
          .slice(0, 50);

        // Collect training sessions for improvement + streak tabs
        const sessions = [];
        trainingSnapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.userId && d.score != null) {
            sessions.push({ userId: d.userId, score: Number(d.score), createdAt: d.createdAt });
          }
        });

        // Build reels stats per user (views + likes)
        const reelsMap = {};
        reelsSnapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (!d.userId) return;
          if (!reelsMap[d.userId]) reelsMap[d.userId] = { totalViews: 0, totalLikes: 0 };
          reelsMap[d.userId].totalViews += Number(d.views || 0);
          reelsMap[d.userId].totalLikes += Number(d.likes || d.likesCount || 0);
        });

        if (!active) return;
        setEntries(sorted);
        setRawChallengeResults(rawResults);
        setProfiles(profileMap);
        setTrainingSessions(sessions);
        setReelsStats(reelsMap);
      } catch (err) {
        console.error("Leaderboard load error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user?.uid) { setFollowingIds(new Set()); return; }
    let active = true;
    async function loadFollowing() {
      try {
        const snap = await getDocs(query(collection(db, "follows"), where("followerId", "==", user.uid)));
        if (!active) return;
        const ids = new Set();
        snap.forEach((d) => { if (d.data().followingId) ids.add(d.data().followingId); });
        setFollowingIds(ids);
      } catch { setFollowingIds(new Set()); }
    }
    loadFollowing();
    return () => { active = false; };
  }, [user?.uid]);

  const weeklyEntries = useMemo(
    () => dedupeWeeklyByUser(rawChallengeResults, currentSeasonId),
    [rawChallengeResults, currentSeasonId]
  );

  // Improvement: biggest score jump in last 14 days vs previous 14 days
  const improvementEntries = useMemo(() => {
    const now = Date.now();
    const recent = now - 14 * 86400000;
    const prev = now - 28 * 86400000;
    const byUser = {};
    trainingSessions.forEach((s) => {
      const ms = s.createdAt?.toMillis?.() || 0;
      if (!byUser[s.userId]) byUser[s.userId] = { recentBest: null, prevBest: null };
      if (ms >= recent) {
        if (byUser[s.userId].recentBest === null || s.score > byUser[s.userId].recentBest) byUser[s.userId].recentBest = s.score;
      } else if (ms >= prev) {
        if (byUser[s.userId].prevBest === null || s.score > byUser[s.userId].prevBest) byUser[s.userId].prevBest = s.score;
      }
    });
    return Object.entries(byUser)
      .filter(([, v]) => v.recentBest !== null && v.prevBest !== null)
      .map(([uid, v]) => ({ userId: uid, bestScore: v.recentBest, improvement: Number((v.recentBest - v.prevBest).toFixed(1)) }))
      .filter((e) => e.improvement > 0)
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 50);
  }, [trainingSessions]);

  // Streak: ordered by user dailyStreak field
  const streakEntries = useMemo(() => {
    return Object.values(profiles)
      .filter((p) => (Number(p.dailyStreak) || 0) > 0)
      .map((p) => ({ userId: p.userId, bestScore: Number(p.dailyStreak) || 0 }))
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 50);
  }, [profiles]);

  const friendsEntries = useMemo(() => {
    if (!user?.uid || followingIds.size === 0) return [];
    return entries.filter((e) => followingIds.has(e.userId) || e.userId === user.uid);
  }, [entries, followingIds, user?.uid]);

  const viewsEntries = useMemo(() =>
    Object.entries(reelsStats)
      .map(([userId, stats]) => ({ userId, bestScore: stats.totalViews, totalLikes: stats.totalLikes }))
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 50),
    [reelsStats]
  );

  const likesEntries = useMemo(() =>
    Object.entries(reelsStats)
      .map(([userId, stats]) => ({ userId, bestScore: stats.totalLikes, totalViews: stats.totalViews }))
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 50),
    [reelsStats]
  );

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

  const currentUserAllTimeRank = useMemo(() => {
    if (!user?.uid) return null;
    const idx = entries.findIndex((e) => e.userId === user.uid);
    return idx >= 0 ? idx + 1 : null;
  }, [entries, user?.uid]);

  const currentUserWeeklyRank = useMemo(() => {
    if (!user?.uid) return null;
    const idx = weeklyEntries.findIndex((e) => e.userId === user.uid);
    return idx >= 0 ? idx + 1 : null;
  }, [weeklyEntries, user?.uid]);

  const currentUserAllTimeEntry = useMemo(() => {
    if (!user?.uid) return null;
    return entries.find((e) => e.userId === user.uid) || null;
  }, [entries, user?.uid]);

  const currentUserWeeklyEntry = useMemo(() => {
    if (!user?.uid) return null;
    return weeklyEntries.find((e) => e.userId === user.uid) || null;
  }, [weeklyEntries, user?.uid]);

  const weeklyChampion = weeklyEntries.length > 0 ? weeklyEntries[0] : null;

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
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, background: "rgba(193,18,31,0.1)", border: "1px solid rgba(193,18,31,0.25)" }}>
              <span style={{ fontSize: 10 }}>⏱</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#F87171", letterSpacing: 0.3 }}>
                {t("lbResets")}
                {weeklyCountdownMs !== null ? formatCountdown(weeklyCountdownMs, locale) : "—"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Archetype + weight filters */}
      <div style={styles.filterWrap}>
        <div style={styles.filterRow}>
          {[
            { key: "all", label: t("lbAllArchetype") },
            { key: "pressure", label: `${ARCHETYPE_DISPLAY.pressure.emoji} Pressure` },
            { key: "counter",  label: `${ARCHETYPE_DISPLAY.counter.emoji} Counter` },
            { key: "technical",label: `${ARCHETYPE_DISPLAY.technical.emoji} Technical` },
            { key: "brawler",  label: `${ARCHETYPE_DISPLAY.brawler.emoji} Brawler` },
          ].map(({ key, label }) => {
            const isActive = archetypeFilter === key;
            const color = key === "all" ? "#D4AF37" : ARCHETYPE_DISPLAY[key]?.color;
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
                  style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.08)", color: "#D4AF37", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
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
                <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, color: "#D4AF37" }}>
                  👑 {t("lbYouAreFirst")}
                </div>
              );
              const gap = Math.max(0, topScore - userScore).toFixed(1);
              return (
                <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.38)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "#C1121F", fontWeight: 900 }}>-{gap}</span>
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
              <div key={i} className="shimmer" style={{ height: 72, borderRadius: 14, background: "rgba(255,255,255,0.06)" }} />
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
              const colors = ["#D4AF37", "#C0C0C0", "#CD7F32"];
              if (!entry) return null;
              const avatarSize = isFirst ? 56 : 44;
              const glowShadow = isFirst
                ? `0 0 0 2.5px ${colors[0]}, 0 0 22px ${colors[0]}88`
                : `0 0 8px ${colors[rank - 1]}44`;
              return (
                <div key={rank} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }} onClick={() => router.push(`/${locale}/profile/${entry.userId}`)}>
                  <span style={{ fontSize: isFirst ? 20 : 16 }}>{medals[rank - 1]}</span>
                  {photo
                    ? <img src={photo} alt="" style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${colors[rank - 1]}`, boxShadow: glowShadow }} />
                    : <div style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: `2.5px solid ${colors[rank - 1]}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isFirst ? 22 : 16, fontWeight: 900, color: "#fff", boxShadow: glowShadow }}>{name[0]?.toUpperCase()}</div>
                  }
                  <span style={{ fontSize: isFirst ? 11 : 10, fontWeight: 800, color: isFirst ? "#fff" : "rgba(255,255,255,0.7)", maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>{name.split(" ")[0]}</span>
                  <span style={{ fontSize: isFirst ? 13 : 11, fontWeight: 900, color: colors[rank - 1], textAlign: "center" }}>{entry.bestScore}/10</span>
                  <div style={{ width: "100%", height: podiumH, borderRadius: "8px 8px 0 0", background: isFirst ? `linear-gradient(180deg, ${colors[0]}2a, ${colors[0]}08)` : `linear-gradient(180deg, ${colors[rank - 1]}18, ${colors[rank - 1]}06)`, border: `1px solid ${colors[rank - 1]}${isFirst ? "55" : "28"}`, borderBottom: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isFirst ? `0 -4px 20px ${colors[0]}22` : "none" }}>
                    <span style={{ fontSize: isFirst ? 22 : 18, fontWeight: 900, color: colors[rank - 1], opacity: isFirst ? 0.8 : 0.5 }}>#{rank}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Leaderboard list */}
        {!loading && filteredDisplayEntries.length > 0 && (
          <div style={styles.list}>
            {filteredDisplayEntries.slice(0, visibleCount).map((entry, index) => {
              const rank = index + 1;
              const medal = getRankMedal(rank);
              const profile = profiles[entry.userId] || {};
              const avatarUrl = getAvatarUrl(profile);
              const displayName = profile.displayName || profile.username || "Fighter";
              const username = profile.username ? `@${profile.username}` : "";
              const isCurrentUser = entry.userId === user?.uid;
              const scoreColor = getScoreColor(entry.bestScore);
              const allTimeEntry = entries.find((e) => e.userId === entry.userId);
              const entryRank = getFighterRank(allTimeEntry?.xp ?? 0);
              const allTimeRank = entries.findIndex((e) => e.userId === entry.userId);
              const entryBadges = getEntryBadges({ entry, rank, weeklyEntries, streakEntries, improvementEntries });
              const topStyle = rank === 1 ? styles.rowFirst : rank === 2 ? styles.rowSecond : rank === 3 ? styles.rowThird : {};

              return (
                <div
                  key={entry.userId}
                  role="button"
                  tabIndex={0}
                  style={{
                    ...styles.row,
                    ...(isCurrentUser ? styles.rowHighlight : {}),
                    ...topStyle,
                    cursor: "pointer",
                  }}
                  onClick={() => router.push(`/${locale}/profile/${entry.userId}`)}
                  onKeyDown={(e) => { if (e.key === "Enter") router.push(`/${locale}/profile/${entry.userId}`); }}
                >
                  {/* Rank */}
                  <div style={styles.rankWrap}>
                    {medal ? (
                      <span style={styles.medal}>{medal}</span>
                    ) : (
                      <span style={styles.rankNum}>#{rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    style={{
                      ...styles.avatar,
                      ...(rank === 1 ? { border: "2px solid #D4AF37" } : {}),
                      ...(rank === 2 ? { border: "2px solid #9CA3AF" } : {}),
                      ...(rank === 3 ? { border: "2px solid #FB923C" } : {}),
                      ...(isCurrentUser ? { border: "2px solid #C1121F" } : {}),
                    }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" style={styles.avatarImg} />
                    ) : (
                      <span style={styles.avatarInitial}>
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name + username */}
                  <div style={styles.nameBlock}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={styles.displayName}>
                        {displayName}
                        {isCurrentUser && <span style={styles.youTag}> YOU</span>}
                      </div>
                      {(() => {
                        const arch = profile.fighterArchetype;
                        const ad = ARCHETYPE_DISPLAY[arch];
                        if (!ad) return null;
                        return (
                          <span style={{
                            ...styles.archetypeChip,
                            color: ad.color,
                            background: `${ad.color}18`,
                            border: `1px solid ${ad.color}35`,
                          }}>
                            {ad.emoji}
                          </span>
                        );
                      })()}
                    </div>
                    {username ? <div style={styles.username}>{username}</div> : null}
                    <div style={styles.entryRankRow}>
                      <RankIcon rank={entryRank} size={15} animated={false} />
                      <span style={{ color: entryRank.color, fontSize: 9, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase" }}>
                        {t(entryRank.key)}
                      </span>
                      {leaderboardTab === "week" && allTimeRank >= 0 && (
                        <span style={styles.allTimeRankBadge}>
                          · #{allTimeRank + 1} {t("seasonAllTime")}
                        </span>
                      )}
                      {leaderboardTab === "alltime" && (
                        <span style={styles.sessionsBadge}>
                          · {entry.sessions} {t("leaderboardSessions").toLowerCase()}
                        </span>
                      )}
                    </div>
                    {entryBadges.length > 0 && (
                      <div style={styles.badgeRow}>
                        {entryBadges.map((b) => (
                          <span key={b.label} style={{ ...styles.badge, color: b.color, borderColor: b.color + "44", background: b.color + "12" }}>
                            {b.icon} {b.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Scores */}
                  <div style={styles.scoresBlock}>
                    {leaderboardTab === "improvement" ? (
                      <>
                        <div style={{ ...styles.bestScore, color: "#34D399" }}>
                          +{entry.improvement ?? 0}
                        </div>
                        <div style={styles.latestScore}>{t("lbImprovement")}</div>
                      </>
                    ) : leaderboardTab === "streak" ? (
                      <>
                        <div style={{ ...styles.bestScore, color: "#FB923C" }}>
                          🔥{entry.bestScore}
                        </div>
                        <div style={styles.latestScore}>{t("lbStreak")}</div>
                      </>
                    ) : leaderboardTab === "views" ? (
                      <>
                        <div style={{ ...styles.bestScore, color: "#60A5FA" }}>
                          👁 {formatCompact(entry.bestScore)}
                        </div>
                        <div style={styles.latestScore}>{t("lbTotalViews")}</div>
                      </>
                    ) : leaderboardTab === "likes" ? (
                      <>
                        <div style={{ ...styles.bestScore, color: "#F472B6" }}>
                          ❤️ {formatCompact(entry.bestScore)}
                        </div>
                        <div style={styles.latestScore}>{t("lbTotalLikes")}</div>
                      </>
                    ) : (
                      <>
                        <div style={{ ...styles.bestScore, color: scoreColor }}>
                          {entry.bestScore}/10
                        </div>
                        {leaderboardTab === "alltime" && (
                          <div style={styles.latestScore}>
                            {(allTimeEntry?.xp ?? 0).toLocaleString()} {t("xpLabel")}
                          </div>
                        )}
                        {leaderboardTab === "week" && (
                          <div style={styles.latestScore}>
                            {t("seasonWeeklyScoreLabel")}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #070707 0%, #0A0A0A 100%)",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    paddingBottom: 90,
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "grid",
    gridTemplateColumns: "64px 1fr 44px",
    alignItems: "center",
    gap: 12,
    padding: "calc(18px + env(safe-area-inset-top)) 16px 18px",
    background: "rgba(7,7,7,0.94)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(212,175,55,0.18)",
  },
  backBtn: {
    border: "1px solid rgba(212,175,55,0.28)",
    background: "transparent",
    color: "#fff",
    borderRadius: 10,
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  headerCenter: {
    textAlign: "center",
  },
  eyebrow: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
  },
  title: {
    margin: "4px 0 0",
    fontSize: 28,
    fontWeight: 950,
    lineHeight: 1.1,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
  },
  trophyBadge: {
    fontSize: 22,
    textAlign: "right",
  },
  tabsWrap: {
    background: "rgba(7,7,7,0.94)",
    position: "sticky",
    top: 90,
    zIndex: 9,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    padding: "10px 16px 8px",
  },
  tabsRow: {
    display: "flex",
    gap: 8,
    maxWidth: 640,
    margin: "0 auto",
  },
  tabBtn: {
    flex: 1,
    padding: "9px 0",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#aaa",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.18s",
  },
  tabBtnActive: {
    background: "rgba(212,175,55,0.16)",
    border: "1px solid rgba(212,175,55,0.45)",
    color: "#D4AF37",
  },
  tabBtnViews: {
    background: "rgba(96,165,250,0.16)",
    border: "1px solid rgba(96,165,250,0.45)",
    color: "#60A5FA",
  },
  tabBtnLikes: {
    background: "rgba(244,114,182,0.16)",
    border: "1px solid rgba(244,114,182,0.45)",
    color: "#F472B6",
  },
  seasonLabel: {
    margin: "6px auto 0",
    textAlign: "center",
    fontSize: 11,
    color: "#888",
    maxWidth: 640,
  },
  content: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "20px 16px",
  },
  yourRankCard: {
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(193,18,31,0.12)",
    border: "1px solid rgba(193,18,31,0.3)",
    marginBottom: 20,
  },
  yourRankTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  yourRankLabel: {
    fontSize: 14,
    fontWeight: 900,
    color: "#fff",
  },
  scorePill: {
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    color: "#fff",
  },
  yourRankSub: {
    fontSize: 12,
    color: "#aaa",
    lineHeight: 1.4,
  },
  weeklyChampionBanner: {
    padding: "16px 18px",
    borderRadius: 16,
    background: "linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 100%)",
    border: "1px solid rgba(212,175,55,0.4)",
    marginBottom: 20,
    textAlign: "center",
  },
  weeklyChampionTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 4,
  },
  weeklyChampionCrown: {
    fontSize: 18,
  },
  weeklyChampionTitle: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.5,
    color: "#D4AF37",
    textTransform: "uppercase",
  },
  weeklyChampionName: {
    fontSize: 20,
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1.2,
  },
  weeklyChampionScore: {
    fontSize: 14,
    color: "#D4AF37",
    fontWeight: 800,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionKicker: {
    margin: "0 0 4px",
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.8,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1.1,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
  },
  loading: {
    textAlign: "center",
    color: "#888",
    padding: 40,
    fontSize: 14,
  },
  emptyWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    margin: "0 0 8px",
    fontSize: 18,
    fontWeight: 800,
    color: "#fff",
  },
  emptyText: {
    margin: 0,
    fontSize: 14,
    color: "#888",
    maxWidth: 260,
    lineHeight: 1.55,
  },
  list: {
    display: "grid",
    gap: 8,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "44px 48px 1fr auto",
    alignItems: "center",
    gap: 12,
    padding: "14px 14px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  rowHighlight: {
    background: "rgba(193,18,31,0.1)",
    border: "1px solid rgba(193,18,31,0.28)",
  },
  rowFirst: {
    background: "linear-gradient(145deg, rgba(212,175,55,0.1), rgba(212,175,55,0.03))",
    border: "1px solid rgba(212,175,55,0.28)",
    borderLeft: "3px solid #D4AF37",
    borderRadius: "3px 16px 16px 3px",
  },
  rowSecond: {
    background: "linear-gradient(145deg, rgba(156,163,175,0.08), rgba(156,163,175,0.02))",
    border: "1px solid rgba(156,163,175,0.2)",
    borderLeft: "3px solid #9CA3AF",
    borderRadius: "3px 16px 16px 3px",
  },
  rowThird: {
    background: "linear-gradient(145deg, rgba(251,146,60,0.08), rgba(251,146,60,0.02))",
    border: "1px solid rgba(251,146,60,0.2)",
    borderLeft: "3px solid #FB923C",
    borderRadius: "3px 16px 16px 3px",
  },
  rankWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  medal: {
    fontSize: 22,
    lineHeight: 1,
  },
  rankNum: {
    fontSize: 13,
    fontWeight: 900,
    color: "#888",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "rgba(193,18,31,0.22)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 900,
    color: "#fff",
  },
  nameBlock: {
    minWidth: 0,
  },
  displayName: {
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  youTag: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1,
    color: "#C1121F",
    verticalAlign: "middle",
  },
  username: {
    fontSize: 11,
    color: "#777",
    marginTop: 1,
  },
  scoresBlock: {
    textAlign: "right",
    flexShrink: 0,
  },
  bestScore: {
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1.1,
  },
  latestScore: {
    fontSize: 10,
    color: "#888",
    marginTop: 2,
  },
  entryRankRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  sessionsBadge: {
    fontSize: 10,
    color: "#666",
  },
  allTimeRankBadge: {
    fontSize: 10,
    color: "#60A5FA",
  },
  filterWrap: {
    background: "rgba(7,7,7,0.92)",
    padding: "8px 16px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  filterRow: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  filterChip: {
    flexShrink: 0,
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
  },
  filterChipActiveWeight: {
    background: "rgba(96,165,250,0.15)",
    border: "1px solid #60A5FA",
    color: "#60A5FA",
  },
  archetypeChip: {
    flexShrink: 0,
    width: 20,
    height: 20,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
  },
  badgeRow: {
    display: "flex",
    gap: 4,
    marginTop: 5,
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    padding: "2px 7px",
    borderRadius: 999,
    border: "1px solid",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.2,
    whiteSpace: "nowrap",
  },
};
