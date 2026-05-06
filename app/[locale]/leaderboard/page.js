"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import { getLocale, translate } from "@/lib/i18n";
import { calculateUserXP, getFighterRank } from "@/lib/xp";
import RankIcon from "@/components/RankIcon";
import { getCurrentSeasonId, getSeasonLabel } from "@/lib/season";

function getRankMedal(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
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

  const currentSeasonId = useMemo(() => getCurrentSeasonId(), []);
  const seasonLabel = useMemo(() => getSeasonLabel(currentSeasonId), [currentSeasonId]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [snapshot, challengeSnapshot, usersSnapshot, trainingSnapshot] = await Promise.all([
          getDocs(collection(db, "ai_feedback")),
          getDocs(collection(db, "challenge_results")),
          getDocs(collection(db, "users")),
          getDocs(collection(db, "training_sessions")),
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

        const userMap = {};
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (!d.userId || d.score == null) return;
          const uid = d.userId;
          const score = Number(d.score);
          if (Number.isNaN(score)) return;

          if (!userMap[uid]) {
            userMap[uid] = { userId: uid, docs: [], latestTs: 0, latestScore: 0 };
          }
          userMap[uid].docs.push({ score: d.score, createdAt: d.createdAt });

          const ts = d.createdAt?.toMillis?.() || 0;
          if (ts >= userMap[uid].latestTs) {
            userMap[uid].latestTs = ts;
            userMap[uid].latestScore = score;
          }
        });

        rawResults.forEach((r) => {
          const uid = r.userId;
          const score = r.score;
          if (Number.isNaN(score)) return;

          if (!userMap[uid]) {
            userMap[uid] = { userId: uid, docs: [], challengeScores: [], latestTs: 0, latestScore: 0 };
          }
          if (!userMap[uid].challengeScores) userMap[uid].challengeScores = [];
          userMap[uid].challengeScores.push(score);

          const ts = r.createdAt?.toMillis?.() || 0;
          if (ts >= userMap[uid].latestTs) {
            userMap[uid].latestTs = ts;
            userMap[uid].latestScore = score;
          }
        });

        Object.keys(profileMap).forEach((uid) => {
          const storedXP = Number(profileMap[uid]?.xp) || 0;
          if (storedXP > 0 && !userMap[uid]) {
            userMap[uid] = { userId: uid, docs: [], challengeScores: [], latestTs: 0, latestScore: 0 };
          }
        });

        const sorted = Object.values(userMap)
          .map((u) => {
            const aiScores = u.docs.map((d) => Number(d.score)).filter((s) => Number.isFinite(s));
            const scores = [...aiScores, ...(u.challengeScores || [])].filter((s) => Number.isFinite(s));
            const storedChallengeXP = Number(profileMap[u.userId]?.xp) || 0;
            const xp = storedChallengeXP + calculateUserXP({ aiFeedbackDocs: u.docs });
            return {
              userId: u.userId,
              bestScore: scores.length ? Math.max(...scores) : 0,
              latestScore: u.latestScore,
              sessions: u.docs.length + (u.challengeScores || []).length,
              xp,
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

        if (!active) return;
        setEntries(sorted);
        setRawChallengeResults(rawResults);
        setProfiles(profileMap);
        setTrainingSessions(sessions);
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

  const displayEntries =
    leaderboardTab === "week" ? weeklyEntries
    : leaderboardTab === "improvement" ? improvementEntries
    : leaderboardTab === "streak" ? streakEntries
    : leaderboardTab === "friends" ? friendsEntries
    : entries;

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

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <button
          type="button"
          style={styles.backBtn}
          onClick={() => router.push(`/${locale}/discover`)}
        >
          {t("back")}
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
        </div>
        {leaderboardTab === "week" && (
          <p style={styles.seasonLabel}>{seasonLabel}</p>
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
              <span style={{ ...styles.scorePill, background: getScoreColor(leaderboardTab === "week" ? (currentUserWeeklyEntry?.bestScore ?? 0) : (currentUserAllTimeEntry?.bestScore ?? 0)) }}>
                {leaderboardTab === "week"
                  ? `${currentUserWeeklyEntry?.bestScore ?? 0}/10`
                  : `${currentUserAllTimeEntry?.bestScore ?? 0}/10`}
              </span>
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
          <div style={styles.loading}>{t("leaderboardLoading")}</div>
        )}

        {/* Empty state */}
        {!loading && displayEntries.length === 0 && (
          <div style={styles.emptyWrap}>
            <div style={styles.emptyIcon}>🏆</div>
            <p style={styles.emptyTitle}>
              {leaderboardTab === "week" ? t("seasonNoResultsThisWeek") : leaderboardTab === "improvement" ? t("lbImprovementEmpty") : leaderboardTab === "streak" ? t("lbStreakEmpty") : leaderboardTab === "friends" ? t("followingEmptyHelp") : t("leaderboardEmpty")}
            </p>
            <p style={styles.emptyText}>{t("leaderboardEmptyHelp")}</p>
          </div>
        )}

        {/* Leaderboard list */}
        {!loading && displayEntries.length > 0 && (
          <div style={styles.list}>
            {displayEntries.map((entry, index) => {
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

              return (
                <div
                  key={entry.userId}
                  role="button"
                  tabIndex={0}
                  style={{
                    ...styles.row,
                    ...(isCurrentUser ? styles.rowHighlight : {}),
                    ...(rank <= 3 ? styles.rowTop : {}),
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
                    <div style={styles.displayName}>
                      {displayName}
                      {isCurrentUser && <span style={styles.youTag}> YOU</span>}
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
    padding: "18px 16px",
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
    padding: "8px 10px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
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
  rowTop: {
    background: "rgba(212,175,55,0.06)",
    border: "1px solid rgba(212,175,55,0.18)",
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
};
