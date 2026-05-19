"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocale, translate } from "@/lib/i18n";
import { getCurrentSeasonId, getSeasonLabel } from "@/lib/season";
import { RED, GOLD, PURPLE, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/challenges/challengesStyles";
import { getLocalDateKey, getTimestampMs } from "@/lib/utils";

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

const SEASON_BADGE = ["🥇", "🥈", "🥉"];


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
  const [resultsLoading, setResultsLoading] = useState(true);
  const [profiles, setProfiles] = useState({});
  const profileRequestsRef = useRef(new Set());
  const [seasonTab, setSeasonTab] = useState("week"); // "week" | "alltime"
  const [mainTab, setMainTab] = useState("leaderboard"); // "leaderboard" | "battles"
  const [myBattles, setMyBattles] = useState([]);
  const [battlesLoading, setBattlesLoading] = useState(false);
  const [countdown, setCountdown] = useState(() => formatCountdown(getWeekEndMs() - Date.now()));

  const currentSeasonId = useMemo(() => getCurrentSeasonId(), []);
  const seasonLabel = useMemo(() => getSeasonLabel(currentSeasonId), [currentSeasonId]);

  useEffect(() => {
    const id = setInterval(() => setCountdown(formatCountdown(getWeekEndMs() - Date.now())), 1000);
    return () => clearInterval(id);
  }, []);

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

  // Load current user's own profile for streak display
  useEffect(() => {
    if (!user?.uid || profiles[user.uid]) return;
    let active = true;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (!active || !snap.exists()) return;
      const data = snap.data();
      setProfiles((prev) => ({
        ...prev,
        [user.uid]: {
          name: data.displayName || data.username || "",
          photoURL: data.photoURL || data.profileImageUrl || "",
          challengeStreak: Number(data.challengeStreak) || 0,
          lastChallengeDate: data.lastChallengeDate || "",
        },
      }));
    }).catch(() => {});
    return () => { active = false; };
  }, [user?.uid]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "challenge_results"), (snap) => {
      setResults(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((r) => r.challengeId && Number.isFinite(Number(r.score)))
      );
      setResultsLoading(false);
    }, (err) => { console.error(err); setResults([]); setResultsLoading(false); });
    return () => unsub();
  }, []);

  // Load only profiles for users who appear in results (not entire users collection)
  useEffect(() => {
    if (!results.length) return;
    const uids = [...new Set(results.map((r) => r.userId).filter(Boolean))];
    const missing = uids.filter((uid) => !profiles[uid] && !profileRequestsRef.current.has(uid));
    if (!missing.length) return;
    let active = true;
    missing.forEach((uid) => profileRequestsRef.current.add(uid));
    Promise.all(missing.map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        const data = snap.exists() ? snap.data() : {};
        return [uid, {
          name: data.displayName || data.username || "",
          photoURL: data.photoURL || data.profileImageUrl || data.profileImage || data.avatarUrl || "",
          challengeStreak: Number(data.challengeStreak) || 0,
          lastChallengeDate: data.lastChallengeDate || "",
        }];
      } catch { return [uid, {}]; }
    })).then((entries) => {
      if (!active) return;
      setProfiles((prev) => {
        const next = { ...prev };
        entries.forEach(([uid, data]) => { next[uid] = data; });
        return next;
      });
    });
    return () => { active = false; };
  }, [results]);

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

  if (authLoading) return (
    <div style={styles.page}>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 14 }}>
        <div className="shimmer" style={{ height: 40, width: 40, borderRadius: 10 }} />
        <div className="shimmer" style={{ height: 100, borderRadius: 16 }} />
        <div className="shimmer" style={{ height: 48, borderRadius: 14 }} />
        {[1,2,3].map((i) => <div key={i} className="shimmer" style={{ height: 220, borderRadius: 20 }} />)}
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

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <button type="button" style={styles.backBtn} onClick={() => router.back()} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
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
            {t("battleLeaderboardTab")}
          </button>
          <button type="button" style={{ ...styles.seasonTab, ...(mainTab === "battles" ? styles.seasonTabActive : {}), ...(myBattles.some((b) => b.status === "pending" && b.role === "opponent") ? { color: PURPLE } : {}) }} onClick={() => setMainTab("battles")}>
            {t("battleMyBattlesTab")}
            {myBattles.some((b) => b.status === "pending" && b.role === "opponent") && <span style={{ marginLeft: 4, display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: PURPLE, verticalAlign: "middle" }} />}
          </button>
        </div>

        {mainTab === "battles" ? (
          <div style={{ display: "grid", gap: 10 }}>
            {battlesLoading ? (
              <div style={{ display: "grid", gap: 10 }}>
                {[1,2,3].map((i) => <div key={i} className="shimmer" style={{ height: 80, borderRadius: 16 }} />)}
              </div>
            ) : myBattles.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 16px", textAlign: "center" }}>
                <span style={{ fontSize: 48, opacity: 0.5 }}>⚔️</span>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>
                  {t("battleNoneYet")}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", maxWidth: 260, lineHeight: 1.6 }}>
                  {t("battleNoneDesc")}
                </p>
                <button type="button" style={{ padding: "11px 24px", borderRadius: 999, border: "none", background: "linear-gradient(135deg,#7C3AED,#4C1D95)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer" }} onClick={() => router.push(`/${locale}/fighters`)}>
                  {t("battleFindFighters")}
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
                          {isReceived ? t("battleChallengeReceived") : t("battleChallengeSent")}
                          {" · "}
                          {battle.status === "pending"
                            ? t("battlePending")
                            : battle.status === "completed"
                            ? t("battleCompleted")
                            : battle.status}
                        </div>
                      </div>
                      {isPending && isReceived && (
                        <button type="button" style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7C3AED,#4C1D95)", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer", flexShrink: 0 }} onClick={() => router.push(`/${locale}/train?challengeId=${battle.challengeId}`)}>
                          {t("battleCompete")}
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

        {/* Season label + countdown */}
        {seasonTab === "week" && (
          <div style={{ ...styles.seasonLabel, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 2px" }}>
            <span style={styles.seasonLabelText}>🗓 {seasonLabel}</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: GOLD, fontVariantNumeric: "tabular-nums", letterSpacing: 0.5 }}>
              ⏱ {countdown}
            </span>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 28 }}>{challenge.emoji}</span>
                      <h2 style={{ ...styles.cardTitle, margin: 0 }}>{t(challenge.titleKey)}</h2>
                    </div>
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
                        const rankLetter = result.rank || getChallengeRank(result.score);
                        const rankColor = rankLetter === "S" ? GOLD : rankLetter === "A" ? "#60A5FA" : rankLetter === "B" ? PURPLE : rankLetter === "C" ? "#34D399" : "#888";

                        return (
                          <div
                            key={result.id}
                            role="button"
                            tabIndex={0}
                            style={{ ...styles.scoreRow, ...(isCurrentUser ? styles.scoreRowCurrent : {}), cursor: "pointer" }}
                            onClick={() => !isCurrentUser && router.push(`/${locale}/profile/${result.userId}`)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !isCurrentUser) router.push(`/${locale}/profile/${result.userId}`); }}
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
                                  {t("challengeRank")}: <span style={{ color: rankColor, fontWeight: 900 }}>{rankLetter}</span>
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

