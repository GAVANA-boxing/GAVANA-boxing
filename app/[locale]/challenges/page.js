"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocale, translate } from "@/lib/i18n";

const CHALLENGES = [
  {
    id: "jab-minute",
    titleKey: "challengeJabTitle",
    descKey: "challengeJabDesc",
  },
  {
    id: "speed-test",
    titleKey: "challengeSpeedTitle",
    descKey: "challengeSpeedDesc",
  },
  {
    id: "combo-master",
    titleKey: "challengeComboTitle",
    descKey: "challengeComboDesc",
  },
];

function getTimestampMs(timestamp) {
  if (!timestamp) return 0;
  if (timestamp.toMillis) return timestamp.toMillis();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatScore(score) {
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) return "0";
  return numeric.toFixed(1).replace(/\.0$/, "");
}

function getChallengeRank(score) {
  const numeric = Number(score);
  if (numeric >= 9) return "S";
  if (numeric >= 8) return "A";
  if (numeric >= 7) return "B";
  if (numeric >= 6) return "C";
  return "D";
}

function getResultXP(result) {
  const storedXP = Number(result?.xpGained);
  if (Number.isFinite(storedXP)) return Math.max(0, Math.round(storedXP));

  const score = Number(result?.score);
  const rank = String(result?.rank || getChallengeRank(score)).toUpperCase();
  const base = Number.isFinite(score) ? Math.round(score * 50) : 0;
  const bonus = rank === "A" ? 100 : rank === "B" ? 50 : rank === "C" ? 20 : 0;
  return base + bonus;
}

function getRankIcon(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPreviousLocalDateKey(date = new Date()) {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return getLocalDateKey(previous);
}

function getActiveChallengeStreak(profile) {
  const lastDate = String(profile?.lastChallengeDate || "");
  if (lastDate !== getLocalDateKey() && lastDate !== getPreviousLocalDateKey()) return 0;
  return Number(profile?.challengeStreak) || 0;
}

export default function ChallengesPage() {
  const params = useParams();
  const router = useRouter();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);
  const { user, loading: authLoading } = useAuth();
  const [results, setResults] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [leaderboardFilter, setLeaderboardFilter] = useState("global");
  const [showStreakInfo, setShowStreakInfo] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "challenge_results"), (snapshot) => {
      const nextResults = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((result) => result.challengeId && Number.isFinite(Number(result.score)));
      setResults(nextResults);
    }, (error) => {
      console.error("Failed to load challenge results:", error);
      setResults([]);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const nextProfiles = {};
      snapshot.docs.forEach((userDoc) => {
        const data = userDoc.data();
        nextProfiles[userDoc.id] = {
          name: data.displayName || data.username || "",
          photoURL: data.photoURL || data.profileImageUrl || data.profileImage || data.avatarUrl || "",
          challengeStreak: Number(data.challengeStreak) || 0,
          lastChallengeDate: data.lastChallengeDate || "",
        };
      });
      setProfiles(nextProfiles);
    }, (error) => {
      console.error("Failed to load challenge profiles:", error);
      setProfiles({});
    });

    return () => unsubscribe();
  }, []);

  const rankedScoresByChallenge = useMemo(() => {
    const grouped = {};

    for (const challenge of CHALLENGES) {
      const bestByUser = new Map();

      results
        .filter((result) => result.challengeId === challenge.id)
        .forEach((result) => {
          const existing = bestByUser.get(result.userId);
          if (!existing) {
            bestByUser.set(result.userId, result);
            return;
          }

          const scoreDelta = Number(result.score) - Number(existing.score);
          if (scoreDelta > 0 || (scoreDelta === 0 && getTimestampMs(result.createdAt) > getTimestampMs(existing.createdAt))) {
            bestByUser.set(result.userId, result);
          }
        });

      grouped[challenge.id] = [...bestByUser.values()].sort((a, b) => {
          const scoreDelta = Number(b.score) - Number(a.score);
          if (scoreDelta !== 0) return scoreDelta;
          return getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt);
        });
    }

    return grouped;
  }, [results]);

  const topScoresByChallenge = useMemo(() => {
    const grouped = {};
    for (const challenge of CHALLENGES) {
      const ranked = rankedScoresByChallenge[challenge.id] || [];
      grouped[challenge.id] = leaderboardFilter === "friends" ? [] : ranked.slice(0, 5);
    }
    return grouped;
  }, [leaderboardFilter, rankedScoresByChallenge, user?.uid]);

  if (authLoading) {
    return <div style={styles.loading}>{t("loading")}</div>;
  }

  if (!user) return null;

  const currentChallengeStreak = getActiveChallengeStreak(profiles[user.uid]);
  const currentUserRanks = CHALLENGES
    .map((challenge) => {
      const rankIndex = (rankedScoresByChallenge[challenge.id] || [])
        .findIndex((result) => result.userId === user.uid);
      return rankIndex >= 0 ? { challenge, rank: rankIndex + 1 } : null;
    })
    .filter(Boolean);
  const bestCurrentUserRank = currentUserRanks.sort((a, b) => a.rank - b.rank)[0] || null;

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <p style={styles.kicker}>GAVANA</p>
          <h1 style={styles.title}>{t("challengesTitle")}</h1>
          <p style={styles.subtitle}>{t("challengesSubtitle")}</p>
          <button type="button" style={styles.streakPill} onClick={() => setShowStreakInfo(true)}>
            <span style={styles.streakFlame}>🔥</span>
            {t("challenge.streak")} · {currentChallengeStreak}
          </button>
        </header>

        <div style={styles.leaderboardTools}>
          <div style={styles.filterGroup} role="tablist" aria-label={t("challengeFilter")}>
            <button
              type="button"
              style={{
                ...styles.filterButton,
                ...(leaderboardFilter === "global" ? styles.filterButtonActive : {}),
              }}
              onClick={() => setLeaderboardFilter("global")}
            >
              {t("challenge.global")}
            </button>
            <button
              type="button"
              style={{
                ...styles.filterButton,
                ...(leaderboardFilter === "friends" ? styles.filterButtonActive : {}),
              }}
              onClick={() => setLeaderboardFilter("friends")}
            >
              {t("challenge.friends")}
            </button>
          </div>
        </div>

        <div style={styles.yourRankBar}>
          <span style={styles.yourRankLabel}>
            {leaderboardFilter === "friends"
              ? t("challengeFriendsComingSoon")
              : bestCurrentUserRank
              ? `${t("challenge.yourRank")} #${bestCurrentUserRank.rank}`
              : t("challengeYouAreUnranked")}
          </span>
          {leaderboardFilter !== "friends" && bestCurrentUserRank && (
            <span style={styles.yourRankChallenge}>{t(bestCurrentUserRank.challenge.titleKey)}</span>
          )}
        </div>

        <div style={styles.challengeList}>
          {CHALLENGES.map((challenge) => (
            <article key={challenge.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <h2 style={styles.cardTitle}>{t(challenge.titleKey)}</h2>
                  <p style={styles.cardDesc}>{t(challenge.descKey)}</p>
                </div>
                <button
                  type="button"
                  style={styles.startButton}
                  onClick={() => router.push(`/${locale}/train?challengeId=${challenge.id}`)}
                >
                  {t("challengeStart")}
                </button>
              </div>

              <div style={styles.leaderboard}>
                <h3 style={styles.leaderboardTitle}>{t("challengeLeaderboard")}</h3>
                {leaderboardFilter === "friends" ? (
                  <div style={styles.emptyLeaderboard}>{t("challengeFriendsComingSoon")}</div>
                ) : (topScoresByChallenge[challenge.id] || []).length === 0 ? (
                  <div style={styles.emptyLeaderboard}>{t("challengeNoScores")}</div>
                ) : (
                  <div style={styles.scoreRows}>
                    {topScoresByChallenge[challenge.id].map((result, index) => {
                      const isCurrentUser = result.userId === user.uid;
                      const profile = profiles[result.userId] || {};
                      const displayName = isCurrentUser
                        ? t("challengeYou")
                        : profile.name || t("fighter");
                      const initial = (displayName || "F").charAt(0).toUpperCase();

                      return (
                        <div
                          key={result.id}
                          style={{
                            ...styles.scoreRow,
                            ...(isCurrentUser ? styles.scoreRowCurrent : {}),
                          }}
                        >
                          <span style={styles.rankNum}>{getRankIcon(index)}</span>
                          <span style={styles.fighterCell}>
                            <span style={styles.avatar}>
                              {profile.photoURL
                                ? <img src={profile.photoURL} alt="" style={styles.avatarImg} />
                                : initial}
                            </span>
                            <span style={styles.fighterText}>
                              <span style={styles.fighterName}>{displayName}</span>
                              <span style={styles.resultMeta}>
                                {t("challengeRank")}: {result.rank || getChallengeRank(result.score)}
                              </span>
                            </span>
                          </span>
                          <span style={styles.scoreStack}>
                            <strong style={styles.scoreValue}>{formatScore(result.score)}/10</strong>
                            <span style={styles.xpValue}>+{getResultXP(result).toLocaleString()} {t("xpLabel")}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
      {showStreakInfo && (
        <div style={styles.streakModalWrap}>
          <div style={styles.streakModalOverlay} onClick={() => setShowStreakInfo(false)} />
          <section style={styles.streakModal}>
            <div style={styles.streakModalHeader}>
              <h2 style={styles.streakModalTitle}>{t("challenge.streak")}</h2>
              <button type="button" style={styles.streakCloseButton} onClick={() => setShowStreakInfo(false)}>
                ×
              </button>
            </div>
            <div style={styles.streakInfoList}>
              <p>{t("challengeStreakExplain1")}</p>
              <p>{t("challengeStreakExplain2")}</p>
              <p>{t("challengeStreakExplain3")}</p>
            </div>
          </section>
        </div>
      )}
      <style jsx global>{`
        @keyframes challengeScoreGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(212,175,55,0); }
          50% { box-shadow: 0 0 24px rgba(212,175,55,0.28); }
        }
      `}</style>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 50% 0%, rgba(193,18,31,0.2), transparent 34%), linear-gradient(180deg, #080808 0%, #0B0B0B 100%)",
    color: "#fff",
    padding: "calc(28px + env(safe-area-inset-top)) 16px calc(92px + env(safe-area-inset-bottom))",
    fontFamily: "sans-serif",
  },
  loading: {
    minHeight: "100vh",
    background: "#070707",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  shell: {
    maxWidth: 760,
    margin: "0 auto",
    display: "grid",
    gap: 18,
  },
  header: {
    display: "grid",
    gap: 8,
  },
  kicker: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 2,
  },
  title: {
    margin: 0,
    fontSize: 38,
    lineHeight: 1,
    fontWeight: 1000,
  },
  subtitle: {
    margin: 0,
    color: "rgba(255,255,255,0.66)",
    fontSize: 14,
    lineHeight: 1.45,
  },
  streakPill: {
    width: "fit-content",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 999,
    background: "rgba(251,146,60,0.13)",
    border: "1px solid rgba(251,146,60,0.3)",
    color: "#FED7AA",
    fontSize: 13,
    fontWeight: 950,
    cursor: "pointer",
  },
  streakFlame: {
    fontSize: 16,
    lineHeight: 1,
  },
  leaderboardTools: {
    position: "sticky",
    top: "calc(10px + env(safe-area-inset-top))",
    zIndex: 8,
  },
  filterGroup: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
    padding: 5,
    borderRadius: 16,
    background: "rgba(0,0,0,0.48)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  filterButton: {
    minHeight: 38,
    border: "none",
    borderRadius: 12,
    background: "transparent",
    color: "rgba(255,255,255,0.64)",
    fontSize: 13,
    fontWeight: 950,
    cursor: "pointer",
  },
  filterButtonActive: {
    background: "linear-gradient(135deg, rgba(193,18,31,0.9), rgba(212,175,55,0.18))",
    color: "#fff",
    boxShadow: "0 10px 30px rgba(193,18,31,0.18)",
  },
  yourRankBar: {
    position: "sticky",
    top: "calc(62px + env(safe-area-inset-top))",
    zIndex: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 44,
    padding: "0 14px",
    borderRadius: 16,
    background: "linear-gradient(135deg, rgba(212,175,55,0.16), rgba(10,10,10,0.76))",
    border: "1px solid rgba(212,175,55,0.25)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 14px 36px rgba(0,0,0,0.26)",
  },
  yourRankLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: 1000,
  },
  yourRankChallenge: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: 900,
  },
  challengeList: {
    display: "grid",
    gap: 20,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    background: "linear-gradient(145deg, rgba(193,18,31,0.13), rgba(11,11,11,0.98) 48%, rgba(212,175,55,0.08))",
    border: "1px solid rgba(255,255,255,0.09)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
  },
  cardTop: {
    display: "grid",
    gap: 16,
  },
  cardTitle: {
    margin: 0,
    color: "#fff",
    fontSize: 20,
    fontWeight: 950,
  },
  cardDesc: {
    margin: "7px 0 0",
    color: "rgba(255,255,255,0.64)",
    fontSize: 13,
    lineHeight: 1.45,
  },
  startButton: {
    width: "100%",
    minHeight: 58,
    padding: "0 20px",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 16,
    background: "linear-gradient(135deg, #F02234, #B80F1D 48%, #7d0812)",
    boxShadow: "0 18px 42px rgba(193,18,31,0.36)",
    color: "#fff",
    fontSize: 16,
    fontWeight: 1000,
    whiteSpace: "nowrap",
    cursor: "pointer",
    textTransform: "uppercase",
  },
  leaderboard: {
    marginTop: 16,
    display: "grid",
    gap: 9,
  },
  leaderboardTitle: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  scoreRows: {
    display: "grid",
    gap: 7,
  },
  scoreRow: {
    minHeight: 62,
    display: "grid",
    gridTemplateColumns: "42px minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 10,
    padding: "9px 11px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.07)",
    animation: "challengeScoreGlow 2.8s ease-in-out infinite",
  },
  scoreRowCurrent: {
    background: "rgba(212,175,55,0.14)",
    borderColor: "rgba(212,175,55,0.38)",
    boxShadow: "0 0 0 1px rgba(212,175,55,0.1), 0 14px 32px rgba(212,175,55,0.12)",
  },
  emptyLeaderboard: {
    padding: "14px 12px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.07)",
    color: "rgba(255,255,255,0.58)",
    fontSize: 13,
    fontWeight: 800,
    textAlign: "center",
  },
  rankNum: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: 950,
    textAlign: "center",
  },
  fighterCell: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: 9,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    overflow: "hidden",
    background: "rgba(193,18,31,0.28)",
    border: "1px solid rgba(212,175,55,0.24)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 950,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  fighterName: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "rgba(255,255,255,0.76)",
    fontSize: 13,
    fontWeight: 850,
  },
  fighterText: {
    minWidth: 0,
    display: "grid",
    gap: 3,
  },
  resultMeta: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 11,
    fontWeight: 850,
  },
  scoreStack: {
    display: "grid",
    justifyItems: "end",
    gap: 4,
  },
  scoreValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: 1000,
    textShadow: "0 0 18px rgba(212,175,55,0.3)",
  },
  xpValue: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 950,
  },
  streakModalWrap: {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  streakModalOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.68)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },
  streakModal: {
    position: "relative",
    width: "100%",
    maxWidth: 420,
    padding: 18,
    borderRadius: 20,
    background: "linear-gradient(180deg, #151111, #080808)",
    border: "1px solid rgba(212,175,55,0.22)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.5)",
  },
  streakModalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  streakModalTitle: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: 1000,
  },
  streakCloseButton: {
    width: 34,
    height: 34,
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 20,
    lineHeight: 1,
    cursor: "pointer",
  },
  streakInfoList: {
    display: "grid",
    gap: 10,
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 1.5,
  },
};
