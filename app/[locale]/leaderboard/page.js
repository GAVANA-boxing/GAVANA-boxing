"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import { getLocale, translate } from "@/lib/i18n";
import { calculateUserXP, getFighterRank } from "@/lib/xp";
import RankIcon from "@/components/RankIcon";

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

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [entries, setEntries] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [snapshot, challengeSnapshot, usersSnapshot] = await Promise.all([
          getDocs(collection(db, "ai_feedback")),
          getDocs(collection(db, "challenge_results")),
          getDocs(collection(db, "users")),
        ]);

        const profileMap = {};
        usersSnapshot.forEach((userDoc) => {
          profileMap[userDoc.id] = { userId: userDoc.id, ...userDoc.data() };
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

        challengeSnapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (!d.userId || d.score == null) return;
          const uid = d.userId;
          const score = Number(d.score);
          if (Number.isNaN(score)) return;

          if (!userMap[uid]) {
            userMap[uid] = { userId: uid, docs: [], challengeScores: [], latestTs: 0, latestScore: 0 };
          }
          if (!userMap[uid].challengeScores) userMap[uid].challengeScores = [];
          userMap[uid].challengeScores.push(score);

          const ts = d.createdAt?.toMillis?.() || 0;
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

        if (!active) return;
        setEntries(sorted);

        if (!active) return;
        setProfiles(profileMap);
      } catch (err) {
        console.error("Leaderboard load error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

  const currentUserRank = useMemo(() => {
    if (!user?.uid) return null;
    const idx = entries.findIndex((e) => e.userId === user.uid);
    return idx >= 0 ? idx + 1 : null;
  }, [entries, user?.uid]);

  const currentUserEntry = useMemo(() => {
    if (!user?.uid) return null;
    return entries.find((e) => e.userId === user.uid) || null;
  }, [entries, user?.uid]);

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

      <div style={styles.content}>
        {/* Current user rank card */}
        {!authLoading && user && currentUserEntry && (
          <div style={styles.yourRankCard}>
            <div style={styles.yourRankTop}>
              <span style={styles.yourRankLabel}>{t("leaderboardYourRank").replace("{rank}", currentUserRank ?? "—")}</span>
              <span style={{ ...styles.scorePill, background: getScoreColor(currentUserEntry.bestScore) }}>
                {currentUserEntry.bestScore}/10
              </span>
            </div>
            <div style={styles.yourRankSub}>
              {t("leaderboardBestLabel")}: {currentUserEntry.bestScore}/10
              {"  ·  "}
              {currentUserEntry.xp.toLocaleString()} {t("xpLabel")}
              {"  ·  "}
              {currentUserEntry.sessions} {t("leaderboardSessions").toLowerCase()}
            </div>
          </div>
        )}

        {/* Section header */}
        <div style={styles.sectionHeader}>
          <p style={styles.sectionKicker}>{t("leaderboardKicker")}</p>
          <h2 style={styles.sectionTitle}>{t("leaderboardTopFighters")}</h2>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={styles.loading}>{t("leaderboardLoading")}</div>
        )}

        {/* Empty state */}
        {!loading && entries.length === 0 && (
          <div style={styles.emptyWrap}>
            <div style={styles.emptyIcon}>🏆</div>
            <p style={styles.emptyTitle}>{t("leaderboardEmpty")}</p>
            <p style={styles.emptyText}>{t("leaderboardEmptyHelp")}</p>
          </div>
        )}

        {/* Leaderboard list */}
        {!loading && entries.length > 0 && (
          <div style={styles.list}>
            {entries.map((entry, index) => {
              const rank = index + 1;
              const medal = getRankMedal(rank);
              const profile = profiles[entry.userId] || {};
              const avatarUrl = getAvatarUrl(profile);
              const displayName = profile.displayName || profile.username || "Fighter";
              const username = profile.username ? `@${profile.username}` : "";
              const isCurrentUser = entry.userId === user?.uid;
              const scoreColor = getScoreColor(entry.bestScore);
              const entryRank = getFighterRank(entry.xp);

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
                      <span style={styles.sessionsBadge}>
                        · {entry.sessions} {t("leaderboardSessions").toLowerCase()}
                      </span>
                    </div>
                  </div>

                  {/* Scores */}
                  <div style={styles.scoresBlock}>
                    <div style={{ ...styles.bestScore, color: scoreColor }}>
                      {entry.bestScore}/10
                    </div>
                    <div style={styles.latestScore}>
                      {entry.xp.toLocaleString()} {t("xpLabel")}
                    </div>
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
    marginBottom: 24,
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
};
