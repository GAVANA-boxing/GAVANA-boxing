"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocale, translate } from "@/lib/i18n";
import { getCurrentSeasonId, getSeasonLabel } from "@/lib/season";

const CHALLENGES = [
  { id: "jab-minute",   titleKey: "challengeJabTitle",   descKey: "challengeJabDesc" },
  { id: "speed-test",   titleKey: "challengeSpeedTitle",  descKey: "challengeSpeedDesc" },
  { id: "combo-master", titleKey: "challengeComboTitle",  descKey: "challengeComboDesc" },
];

const SEASON_BADGE = ["🥇", "🥈", "🥉"];

function getTimestampMs(timestamp) {
  if (!timestamp) return 0;
  if (timestamp.toMillis) return timestamp.toMillis();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(1).replace(/\.0$/, "");
}

function getChallengeRank(score) {
  const n = Number(score);
  if (n >= 9) return "S";
  if (n >= 8) return "A";
  if (n >= 7) return "B";
  if (n >= 6) return "C";
  return "D";
}

function getResultXP(result) {
  const stored = Number(result?.xpGained);
  if (Number.isFinite(stored) && stored > 0) return Math.round(stored);
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getPreviousLocalDateKey(date = new Date()) {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  return getLocalDateKey(prev);
}

function getActiveChallengeStreak(profile) {
  const lastDate = String(profile?.lastChallengeDate || "");
  if (lastDate !== getLocalDateKey() && lastDate !== getPreviousLocalDateKey()) return 0;
  return Number(profile?.challengeStreak) || 0;
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

  const [results, setResults] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [seasonTab, setSeasonTab] = useState("week"); // "week" | "alltime"
  const [mainTab, setMainTab] = useState("leaderboard"); // "leaderboard" | "battles"
  const [myBattles, setMyBattles] = useState([]);
  const [battlesLoading, setBattlesLoading] = useState(false);

  const currentSeasonId = useMemo(() => getCurrentSeasonId(), []);
  const seasonLabel = useMemo(() => getSeasonLabel(currentSeasonId), [currentSeasonId]);

  useEffect(() => {
    if (!user?.uid || mainTab !== "battles") return;
    let active = true;
    setBattlesLoading(true);
    async function loadBattles() {
      try {
        const [asChal, asOpp] = await Promise.all([
          getDocs(query(collection(db, "pvp_challenges"), where("challengerId", "==", user.uid))),
          getDocs(query(collection(db, "pvp_challenges"), where("opponentId", "==", user.uid))),
        ]);
        if (!active) return;
        const all = [
          ...asChal.docs.map((d) => ({ id: d.id, ...d.data(), role: "challenger" })),
          ...asOpp.docs.map((d) => ({ id: d.id, ...d.data(), role: "opponent" })),
        ].sort((a, b) => {
          const aMs = a.createdAt?.toMillis?.() || 0;
          const bMs = b.createdAt?.toMillis?.() || 0;
          return bMs - aMs;
        });
        setMyBattles(all);
      } catch (e) {
        console.error("battles load error", e);
      } finally {
        if (active) setBattlesLoading(false);
      }
    }
    loadBattles();
    return () => { active = false; };
  }, [user?.uid, mainTab]);

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "challenge_results"), (snap) => {
      setResults(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((r) => r.challengeId && Number.isFinite(Number(r.score)))
      );
    }, (err) => { console.error(err); setResults([]); });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const next = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        next[d.id] = {
          name: data.displayName || data.username || "",
          photoURL: data.photoURL || data.profileImageUrl || data.profileImage || data.avatarUrl || "",
          challengeStreak: Number(data.challengeStreak) || 0,
          lastChallengeDate: data.lastChallengeDate || "",
        };
      });
      setProfiles(next);
    }, (err) => { console.error(err); setProfiles({}); });
    return () => unsub();
  }, []);

  // All results grouped and ranked per challenge (best score per user)
  const allTimeByChallenge = useMemo(() => {
    const grouped = {};
    for (const c of CHALLENGES) {
      grouped[c.id] = dedupeByUser(
        results.filter((r) => r.challengeId === c.id)
      );
    }
    return grouped;
  }, [results]);

  // This week's results (seasonId matches)
  const weeklyByChallenge = useMemo(() => {
    const grouped = {};
    for (const c of CHALLENGES) {
      grouped[c.id] = dedupeByUser(
        results.filter((r) => r.challengeId === c.id && r.seasonId === currentSeasonId)
      );
    }
    return grouped;
  }, [results, currentSeasonId]);

  const displayByChallenge = seasonTab === "week" ? weeklyByChallenge : allTimeByChallenge;

  if (authLoading) return <div style={styles.loading}>{t("loading")}</div>;
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

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <p style={styles.kicker}>GAVANA</p>
          <h1 style={styles.title}>{t("challengesTitle")}</h1>
          <p style={styles.subtitle}>{t("challengesSubtitle")}</p>
          <div style={styles.streakPill}>
            <span style={styles.streakFlame}>🔥</span>
            {t("challengeStreak").replace("{n}", currentChallengeStreak)}
          </div>
        </header>

        {/* Main tabs: Leaderboard | My Battles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: 5, borderRadius: 16, background: "rgba(0,0,0,0.48)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
          <button type="button" style={{ ...styles.seasonTab, ...(mainTab === "leaderboard" ? styles.seasonTabActive : {}) }} onClick={() => setMainTab("leaderboard")}>
            🏆 {locale === "mn" ? "Тэргүүний самбар" : locale === "ko" ? "리더보드" : "Leaderboard"}
          </button>
          <button type="button" style={{ ...styles.seasonTab, ...(mainTab === "battles" ? styles.seasonTabActive : {}), ...(myBattles.some((b) => b.status === "pending" && b.role === "opponent") ? { color: "#A78BFA" } : {}) }} onClick={() => setMainTab("battles")}>
            ⚔️ {locale === "mn" ? "Миний тулаанууд" : locale === "ko" ? "내 배틀" : "My Battles"}
            {myBattles.some((b) => b.status === "pending" && b.role === "opponent") && <span style={{ marginLeft: 4, display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#A78BFA", verticalAlign: "middle" }} />}
          </button>
        </div>

        {mainTab === "battles" ? (
          <div style={{ display: "grid", gap: 10 }}>
            {battlesLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                {locale === "mn" ? "Уншиж байна..." : locale === "ko" ? "로딩 중..." : "Loading..."}
              </div>
            ) : myBattles.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 16px", textAlign: "center" }}>
                <span style={{ fontSize: 48, opacity: 0.5 }}>⚔️</span>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>
                  {locale === "mn" ? "Тулаан байхгүй байна" : locale === "ko" ? "배틀 없음" : "No battles yet"}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", maxWidth: 260, lineHeight: 1.6 }}>
                  {locale === "mn" ? "Fighter-ийн profile дээрх ⚔️ товчийг дараад тулааны шийдэл илгээгээрэй." : locale === "ko" ? "파이터의 프로필에서 ⚔️ 버튼으로 배틀을 신청하세요." : "Go to a fighter's profile and tap ⚔️ to send a challenge."}
                </p>
                <button type="button" style={{ padding: "11px 24px", borderRadius: 999, border: "none", background: "linear-gradient(135deg,#7C3AED,#4C1D95)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer" }} onClick={() => router.push(`/${locale}/fighters`)}>
                  {locale === "mn" ? "🥊 Fighter хайх" : locale === "ko" ? "🥊 파이터 찾기" : "🥊 Find Fighters"}
                </button>
              </div>
            ) : (
              myBattles.map((battle) => {
                const challengeInfo = CHALLENGES.find((c) => c.id === battle.challengeId);
                const isReceived = battle.role === "opponent";
                const isPending = battle.status === "pending";
                return (
                  <div key={battle.id} style={{ borderRadius: 16, border: `1px solid ${isPending && isReceived ? "rgba(167,139,250,0.35)" : "rgba(255,255,255,0.08)"}`, background: isPending && isReceived ? "rgba(167,139,250,0.07)" : "rgba(255,255,255,0.03)", padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>{isPending && isReceived ? "⚔️" : battle.status === "completed" ? "✅" : "🕐"}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{challengeInfo ? t(challengeInfo.titleKey) : battle.challengeId}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                          {isReceived
                            ? (locale === "mn" ? "Тулааны урилга ирлээ" : locale === "ko" ? "배틀 신청 받음" : "Challenge received")
                            : (locale === "mn" ? "Тулааны урилга илгээсэн" : locale === "ko" ? "배틀 신청 보냄" : "Challenge sent")}
                          {" · "}
                          {battle.status === "pending"
                            ? (locale === "mn" ? "Хүлээгдэж байна" : locale === "ko" ? "대기 중" : "Pending")
                            : battle.status === "completed"
                            ? (locale === "mn" ? "Дууссан" : locale === "ko" ? "완료" : "Completed")
                            : battle.status}
                        </div>
                      </div>
                      {isPending && isReceived && (
                        <button type="button" style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7C3AED,#4C1D95)", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer", flexShrink: 0 }} onClick={() => router.push(`/${locale}/train?challengeId=${battle.challengeId}`)}>
                          {locale === "mn" ? "Тулаан →" : locale === "ko" ? "배틀 →" : "Compete →"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}

        {mainTab === "leaderboard" && (
          <>
        {/* Season tabs */}
        <div style={styles.seasonTabRow}>
          <button
            type="button"
            style={{ ...styles.seasonTab, ...(seasonTab === "week" ? styles.seasonTabActive : {}) }}
            onClick={() => setSeasonTab("week")}
          >
            {t("seasonCurrentWeek")}
          </button>
          <button
            type="button"
            style={{ ...styles.seasonTab, ...(seasonTab === "alltime" ? styles.seasonTabActive : {}) }}
            onClick={() => setSeasonTab("alltime")}
          >
            {t("seasonAllTime")}
          </button>
        </div>

        {/* Season label */}
        {seasonTab === "week" && (
          <div style={styles.seasonLabel}>
            <span style={styles.seasonLabelText}>🗓 {seasonLabel}</span>
          </div>
        )}

        {/* Weekly champions banner */}
        {seasonTab === "week" && weeklyChampions.length > 0 && (
          <div style={styles.champBanner}>
            <p style={styles.champBannerTitle}>🏆 {t("seasonWeeklyChampion")}</p>
            <div style={styles.champList}>
              {weeklyChampions.map(({ challenge, result: res, profile }, i) => {
                const name = profile?.name || t("fighter");
                return (
                  <div key={challenge.id} style={styles.champItem}>
                    <span style={styles.champBadge}>{SEASON_BADGE[i] || `#${i + 1}`}</span>
                    <div style={styles.champInfo}>
                      <span style={styles.champName}>{name}</span>
                      <span style={styles.champChallenge}>{t(challenge.titleKey)}</span>
                    </div>
                    <span style={styles.champScore}>{formatScore(res.score)}/10</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Your rank bar */}
        <div style={styles.yourRankBar}>
          <span style={styles.yourRankLabel}>
            {bestUserRank
              ? t("challengeYouAreRank").replace("{rank}", bestUserRank.rank)
              : t("challengeYouAreUnranked")}
          </span>
          {bestUserRank && (
            <span style={styles.yourRankChallenge}>{t(bestUserRank.challenge.titleKey)}</span>
          )}
        </div>

        {/* Challenge cards */}
        <div style={styles.challengeList}>
          {CHALLENGES.map((challenge) => {
            const list = (displayByChallenge[challenge.id] || []).slice(0, 5);
            const isEmpty = list.length === 0;

            return (
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
                  {isEmpty ? (
                    <div style={styles.emptyLeaderboard}>
                      {seasonTab === "week" ? t("seasonNoResultsThisWeek") : t("challengeNoScores")}
                    </div>
                  ) : (
                    <div style={styles.scoreRows}>
                      {list.map((result, index) => {
                        const isCurrentUser = result.userId === user.uid;
                        const profile = profiles[result.userId] || {};
                        const displayName = isCurrentUser ? t("challengeYou") : profile.name || t("fighter");
                        const initial = (displayName || "F").charAt(0).toUpperCase();

                        return (
                          <div
                            key={result.id}
                            style={{ ...styles.scoreRow, ...(isCurrentUser ? styles.scoreRowCurrent : {}) }}
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
            );
          })}
        </div>
          </>
        )}
      </section>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
      <style>{`
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
    gap: 14,
  },
  header: { display: "grid", gap: 8 },
  kicker: { margin: 0, color: "#D4AF37", fontSize: 11, fontWeight: 950, letterSpacing: 2 },
  title: { margin: 0, fontSize: 38, lineHeight: 1, fontWeight: 1000, fontFamily: "var(--font-display, 'Anton', sans-serif)" },
  subtitle: { margin: 0, color: "rgba(255,255,255,0.66)", fontSize: 14, lineHeight: 1.45 },
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
  },
  streakFlame: { fontSize: 16, lineHeight: 1 },
  seasonTabRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
    padding: 5,
    borderRadius: 16,
    background: "rgba(0,0,0,0.48)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    position: "sticky",
    top: "calc(10px + env(safe-area-inset-top))",
    zIndex: 8,
  },
  seasonTab: {
    minHeight: 38,
    border: "none",
    borderRadius: 12,
    background: "transparent",
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: 950,
    cursor: "pointer",
  },
  seasonTabActive: {
    background: "linear-gradient(135deg, rgba(193,18,31,0.9), rgba(212,175,55,0.18))",
    color: "#fff",
    boxShadow: "0 10px 30px rgba(193,18,31,0.18)",
  },
  seasonLabel: {
    textAlign: "center",
    paddingBottom: 2,
  },
  seasonLabelText: {
    fontSize: 11,
    color: "#888",
    fontWeight: 700,
    letterSpacing: 0.4,
  },
  champBanner: {
    padding: "14px 16px",
    borderRadius: 18,
    background: "linear-gradient(135deg, rgba(212,175,55,0.16), rgba(11,11,11,0.95))",
    border: "1px solid rgba(212,175,55,0.3)",
    boxShadow: "0 8px 28px rgba(212,175,55,0.1)",
    display: "grid",
    gap: 10,
  },
  champBannerTitle: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  champList: { display: "grid", gap: 8 },
  champItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  champBadge: { fontSize: 20, flexShrink: 0, lineHeight: 1 },
  champInfo: { display: "grid", gap: 2, flex: 1, minWidth: 0 },
  champName: { fontSize: 13, fontWeight: 900, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  champChallenge: { fontSize: 10, color: "#888", fontWeight: 700 },
  champScore: { fontSize: 14, fontWeight: 1000, color: "#D4AF37", flexShrink: 0 },
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
  yourRankLabel: { color: "#fff", fontSize: 14, fontWeight: 1000 },
  yourRankChallenge: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: 900,
  },
  challengeList: { display: "grid", gap: 20 },
  card: {
    borderRadius: 20,
    padding: 16,
    background: "linear-gradient(145deg, rgba(193,18,31,0.13), rgba(11,11,11,0.98) 48%, rgba(212,175,55,0.08))",
    border: "1px solid rgba(255,255,255,0.09)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
  },
  cardTop: { display: "grid", gap: 16 },
  cardTitle: { margin: 0, color: "#fff", fontSize: 20, fontWeight: 950, fontFamily: "var(--font-display, 'Anton', sans-serif)" },
  cardDesc: { margin: "7px 0 0", color: "rgba(255,255,255,0.64)", fontSize: 13, lineHeight: 1.45 },
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
  leaderboard: { marginTop: 16, display: "grid", gap: 9 },
  leaderboardTitle: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  scoreRows: { display: "grid", gap: 7 },
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
  rankNum: { color: "#D4AF37", fontSize: 18, fontWeight: 950, textAlign: "center" },
  fighterCell: { minWidth: 0, display: "flex", alignItems: "center", gap: 9 },
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
  avatarImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  fighterText: { minWidth: 0, display: "grid", gap: 3 },
  fighterName: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "rgba(255,255,255,0.76)",
    fontSize: 13,
    fontWeight: 850,
  },
  resultMeta: { color: "rgba(255,255,255,0.52)", fontSize: 11, fontWeight: 850 },
  scoreStack: { display: "grid", justifyItems: "end", gap: 4 },
  scoreValue: { color: "#fff", fontSize: 16, fontWeight: 1000, textShadow: "0 0 18px rgba(212,175,55,0.3)" },
  xpValue: { color: "#D4AF37", fontSize: 11, fontWeight: 950 },
};
