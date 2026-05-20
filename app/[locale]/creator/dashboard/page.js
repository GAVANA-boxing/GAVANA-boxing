"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, getDoc, doc, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";
import SkeletonBlock from "@/components/SkeletonBlock";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/creator/creatorDashboardStyles";
import { formatCompact } from "@/lib/utils";
import { cleanCaption } from "@/lib/reelHelpers";

function getCreatedAtMs(obj) {
  const ts = obj?.createdAt;
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}


function StatCard({ label, value, color = GOLD, icon }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statIcon}>{icon}</span>
      <span style={{ ...styles.statValue, color }}>{formatCompact(value)}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}


function ReelRow({ reel, stats, rank, maxViews, t, locale, router }) {
  const [mediaErr, setMediaErr] = useState(false);
  const src = reel.thumbnailUrl || reel.thumbnail || reel.videoUrl || "";
  const views = stats?.views || reel.views || 0;
  const likes = stats?.likes || reel.likes || 0;
  const attempts = stats?.challengeAttempts || 0;
  const engRate = views > 0 ? ((likes + attempts) / views * 100).toFixed(1) : "0.0";
  const barPct = maxViews > 0 ? Math.min(100, Math.max(4, Math.round((views / maxViews) * 100))) : 4;
  const typeEmoji = reel.contentType === "educational" ? "📚" : reel.contentType === "lifestyle" ? "🎬" : "🥊";
  const typeColor = reel.contentType === "educational" ? GOLD : reel.contentType === "lifestyle" ? "#60A5FA" : RED;
  const dateStr = reel.createdAt?.toDate ? reel.createdAt.toDate().toLocaleDateString() : "";

  return (
    <div style={styles.reelRow} onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}`)}>
      <div style={styles.reelThumb}>
        {src && !mediaErr ? (
          <video src={src} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, display: "block" }} preload="none" muted playsInline onError={() => setMediaErr(true)} />
        ) : (
          <div style={{ width: "100%", height: "100%", borderRadius: 8, background: typeColor + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{typeEmoji}</div>
        )}
      </div>
      <div style={styles.reelRank}>#{rank}</div>
      <div style={styles.reelInfo}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
          <span style={{ fontSize: 10, color: typeColor, fontWeight: 900 }}>{typeEmoji}</span>
          <span style={styles.reelCaption} title={reel.description || reel.caption || ""}>
            {cleanCaption(reel.description || reel.caption || "").slice(0, 46) || t("trainingReel")}
          </span>
        </div>
        <div style={styles.reelBar}>
          <div style={{ ...styles.reelBarFill, width: `${barPct}%` }} />
        </div>
        <div style={styles.reelMeta}>
          <span>👁 {formatCompact(views)}</span>
          <span>❤ {formatCompact(likes)}</span>
          {attempts > 0 && <span>🥊 {formatCompact(attempts)}</span>}
          <span style={{ marginLeft: "auto", color: Number(engRate) >= 5 ? "#34D399" : Number(engRate) >= 2 ? GOLD : "#888" }}>{engRate}%</span>
        </div>
        {dateStr && <div style={{ fontSize: 10, color: "#444" }}>{dateStr}</div>}
      </div>
    </div>
  );
}

export default function CreatorDashboard() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [activeTab, setActiveTab] = useState("overview"); // overview | reels | audience
  const [loading, setLoading] = useState(true);
  const [reels, setReels] = useState([]);
  const [reelStats, setReelStats] = useState({});       // reelId → stats doc
  const [challengeAttempts, setChallengeAttempts] = useState([]); // all attempts on creator's reels
  const [followerCount, setFollowerCount] = useState(0);
  const [newFollowersThisWeek, setNewFollowersThisWeek] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (authLoading || !user?.uid) return;
    let active = true;

    async function load() {
      try {
        // 1. Load user's reels — sort JS-side to avoid composite index
        const reelsSnap = await getDocs(query(collection(db, "reels"), where("userId", "==", user.uid)));
        if (!active) return;
        const reelDocs = reelsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
        setReels(reelDocs);

        const reelIds = reelDocs.map((r) => r.id);

        // 2. Load reel_stats for each reel in parallel
        const statsMap = {};
        if (reelIds.length > 0) {
          const statSnaps = await Promise.all(reelIds.map((id) => getDoc(doc(db, "reel_stats", id))));
          statSnaps.forEach((snap) => { if (snap.exists()) statsMap[snap.id] = snap.data(); });
        }
        if (!active) return;
        setReelStats(statsMap);

        // 3. Load challenge attempts for creator's reels (Firestore `in` limit = 30)
        const attemptsAll = [];
        if (reelIds.length > 0) {
          const chunks = [];
          for (let i = 0; i < reelIds.length; i += 30) chunks.push(reelIds.slice(i, i + 30));
          for (const chunk of chunks) {
            const attSnap = await getDocs(query(collection(db, "challenge_attempts"), where("reelId", "in", chunk)));
            attSnap.forEach((d) => attemptsAll.push(d.data()));
          }
        }
        if (!active) return;
        setChallengeAttempts(attemptsAll);

        // 4. Follower count + new followers this week
        const followSnap = await getDocs(query(collection(db, "follows"), where("followingId", "==", user.uid)));
        if (!active) return;
        const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
        let weekNew = 0;
        followSnap.forEach((d) => {
          const ts = getCreatedAtMs(d.data());
          if (ts >= weekAgo) weekNew += 1;
        });
        setFollowerCount(followSnap.size);
        setNewFollowersThisWeek(weekNew);

        // 5. Check whether this creator is currently featured — single-field + JS filter
        const featuredSnap = await getDocs(query(
          collection(db, "featured_creators"),
          where("userId", "==", user.uid)
        ));
        if (!active) return;
        const nowMs = Date.now();
        const isCurrentlyFeatured = featuredSnap.docs.some((d) => {
          const until = d.data().featuredUntil;
          const untilMs = until?.toMillis?.() || until?.toDate?.().getTime?.() || 0;
          return untilMs > nowMs;
        });
        setIsFeatured(isCurrentlyFeatured);
      } catch (err) {
        console.error("Creator dashboard load error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [authLoading, user?.uid]);

  // Best post day analysis — must be before any early return (Rules of Hooks)
  const bestPostDay = useMemo(() => {
    const dayLabels = locale === "mn"
      ? ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"]
      : locale === "ko"
      ? ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]
      : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const byDay = {};
    reels.forEach((r) => {
      if (!r.createdAt?.toDate) return;
      const day = r.createdAt.toDate().getDay();
      const v = reelStats[r.id]?.views || r.views || 0;
      if (!byDay[day]) byDay[day] = { count: 0, views: 0 };
      byDay[day].count += 1;
      byDay[day].views += v;
    });
    return Object.entries(byDay).reduce((best, [day, data]) => {
      const avg = data.count > 0 ? data.views / data.count : 0;
      return avg > (best?.avg || 0) ? { day: dayLabels[Number(day)], avg: Math.round(avg) } : best;
    }, null);
  }, [reels, reelStats, locale]);

  if (authLoading || (!user && !authLoading)) {
    return <div style={styles.page}><div style={styles.loadingText}>...</div></div>;
  }

  // Derived stats
  const totalViews = reels.reduce((s, r) => s + (reelStats[r.id]?.views || r.views || 0), 0);
  const totalLikes = reels.reduce((s, r) => s + (reelStats[r.id]?.likes || r.likes || 0), 0);
  const externalAttempts = challengeAttempts.filter((a) => a.userId !== user?.uid);
  const uniqueStudents = new Set(externalAttempts.map((a) => a.userId)).size;
  const avgScore = externalAttempts.length > 0
    ? (externalAttempts.reduce((s, a) => s + (Number(a.score) || 0), 0) / externalAttempts.length).toFixed(1)
    : null;
  const bestScore = externalAttempts.length > 0
    ? Math.max(...externalAttempts.map((a) => Number(a.score) || 0)).toFixed(1)
    : null;
  const engagementRate = totalViews > 0
    ? ((totalLikes + externalAttempts.length) / totalViews * 100).toFixed(1)
    : "0.0";
  const weekAgoMs = Date.now() - 7 * 24 * 3600 * 1000;
  const attemptsThisWeek = externalAttempts.filter((a) => {
    const ms = a.createdAt?.toMillis?.() || a.createdAt?.toDate?.().getTime?.() || 0;
    return ms >= weekAgoMs;
  }).length;

  // Content type breakdown
  const ctCounts = reels.reduce((acc, r) => {
    const ct = r.contentType || (r.type === "training" ? "training" : "lifestyle");
    acc[ct] = (acc[ct] || 0) + 1;
    return acc;
  }, {});
  const ctTotal = reels.length || 1;

  // Growth tip
  const hasNoChallengeReels = reels.every((r) => !r.challengeEnabled && r.type !== "training");
  const growthTip = hasNoChallengeReels
    ? t("creatorTipNoChallenge")
    : Number(engagementRate) < 2
    ? t("creatorTipLowEngagement")
    : t("creatorTipGood");

  // Top reel by views
  const reelsByViews = [...reels].sort((a, b) => (reelStats[b.id]?.views || b.views || 0) - (reelStats[a.id]?.views || a.views || 0));
  const maxViews = reelsByViews.length > 0 ? (reelStats[reelsByViews[0].id]?.views || reelsByViews[0].views || 1) : 1;
  // Most challenged reel
  const attemptsByReel = {};
  externalAttempts.forEach((a) => { attemptsByReel[a.reelId] = (attemptsByReel[a.reelId] || 0) + 1; });
  const reelsByAttempts = [...reels].sort((a, b) => (attemptsByReel[b.id] || 0) - (attemptsByReel[a.id] || 0));
  const mostChallengedReel = reelsByAttempts[0] && attemptsByReel[reelsByAttempts[0].id] > 0 ? reelsByAttempts[0] : null;

  // Score distribution across all external attempts
  const scoreDistrib = externalAttempts.reduce((acc, a) => {
    const s = Number(a.score) || 0;
    if (s >= 8) acc.excellent += 1;
    else if (s >= 6) acc.good += 1;
    else acc.poor += 1;
    return acc;
  }, { excellent: 0, good: 0, poor: 0 });
  const distribTotal = externalAttempts.length || 1;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button type="button" style={styles.backBtn} onClick={() => router.back()} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <p style={styles.kicker}>{t("creatorDashboard")}</p>
          <p style={styles.sub}>{t("creatorDashboardSub")}</p>
        </div>
        {isFeatured && (
          <div style={styles.featuredBadge}>⭐ {t("featuredBadge")}</div>
        )}
      </header>

      {/* ── Tab bar ── */}
      <div style={styles.tabBar}>
        {[
          { key: "overview", label: t("creatorOverviewTab") },
          { key: "reels",    label: t("creatorReelsTab") },
          { key: "audience", label: t("creatorAudienceTab") },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            style={activeTab === key ? styles.tabActive : styles.tabInactive}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.content}>
          <div style={styles.statsGrid}>
            {[1, 2, 3, 4].map((i) => <SkeletonBlock key={i} height={96} />)}
          </div>
          <SkeletonBlock height={64} />
          <SkeletonBlock height={120} />
          <SkeletonBlock height={200} />
        </div>
      ) : (
        <div style={styles.content}>

          {/* ══ OVERVIEW TAB ══ */}
          {activeTab === "overview" && (<>
            <div style={styles.statsGrid}>
              <StatCard label={t("creatorTotalViews")} value={totalViews} icon="👁" color="#60A5FA" />
              <StatCard label={t("creatorTotalLikes")} value={totalLikes} icon="❤" color="#F87171" />
              <StatCard label={t("creatorFollowers")} value={followerCount} icon="👥" color={GOLD} />
              <StatCard label={t("creatorChallengeAttempts")} value={externalAttempts.length} icon="🥊" color="#34D399" />
            </div>

            <div style={styles.growthRow}>
              <div style={styles.growthItem}>
                <span style={styles.growthNum}>+{newFollowersThisWeek}</span>
                <span style={styles.growthLbl}>{t("creatorNewFollowers")}</span>
              </div>
              <div style={styles.growthItem}>
                <span style={{ ...styles.growthNum, color: Number(engagementRate) >= 5 ? "#34D399" : Number(engagementRate) >= 2 ? GOLD : "#F87171" }}>
                  {engagementRate}%
                </span>
                <span style={styles.growthLbl}>{t("creatorEngagementRate")}</span>
              </div>
              <div style={styles.growthItem}>
                <span style={{ ...styles.growthNum, color: "#60A5FA" }}>+{attemptsThisWeek}</span>
                <span style={styles.growthLbl}>{t("creatorAttemptsWeek")}</span>
              </div>
              {uniqueStudents > 0 && (
                <div style={styles.growthItem}>
                  <span style={styles.growthNum}>{uniqueStudents}</span>
                  <span style={styles.growthLbl}>{t("creatorTotalStudents")}</span>
                </div>
              )}
            </div>

            {bestPostDay && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 14, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.18)", borderLeft: "3px solid #60A5FA" }}>
                <span style={{ fontSize: 20 }}>📅</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>
                    {t("creatorBestPostDay")} <span style={{ color: "#60A5FA" }}>{bestPostDay.day}</span>
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#888" }}>
                    {locale === "mn" ? `Дундажаар ${formatCompact(bestPostDay.avg)} үзэлт` : locale === "ko" ? `평균 ${formatCompact(bestPostDay.avg)} 조회수` : `~${formatCompact(bestPostDay.avg)} avg views`}
                  </p>
                </div>
              </div>
            )}

            <div style={styles.tip}>
              <span style={styles.tipIcon}>💡</span>
              <span style={styles.tipText}>{growthTip}</span>
            </div>

            {mostChallengedReel && (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>🔥 {t("creatorMostChallenged")}</h2>
                <div
                  style={{ background: "linear-gradient(145deg, #1c0202, #0e0000)", border: `1px solid ${redAlpha(0.2)}`, borderLeft: "3px solid #C1121F", borderRadius: "3px 14px 14px 3px", padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
                  onClick={() => router.push(`/${locale}/reels?reelId=${mostChallengedReel.id}`)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cleanCaption(mostChallengedReel.description || mostChallengedReel.caption || "") || t("trainingReel")}
                    </div>
                    <div style={{ fontSize: 11, color: "#888" }}>
                      🥊 {attemptsByReel[mostChallengedReel.id]} {locale === "mn" ? "оролдлого" : locale === "ko" ? "도전" : "challenges"}
                      {avgScore && <span style={{ marginLeft: 10, color: GOLD }}>⭐ avg {avgScore}/10</span>}
                    </div>
                  </div>
                  <span style={{ color: RED, fontSize: 18, flexShrink: 0 }}>→</span>
                </div>
              </section>
            )}

            <button type="button" style={styles.uploadBtn} onClick={() => router.push(`/${locale}/upload`)}>
              + {t("creatorUploadNew")}
            </button>
          </>)}

          {/* ══ REELS TAB ══ */}
          {activeTab === "reels" && (<>
            {reels.length === 0 ? (
              <EmptyState
                title={t("creatorNoReels")}
                action={
                  <button type="button" style={styles.uploadBtn} onClick={() => router.push(`/${locale}/upload`)}>
                    {t("creatorGoUpload")}
                  </button>
                }
              />
            ) : (<>
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>📈 {t("creatorPerformance")} · {reels.length} reels</h2>
                <div style={styles.reelList}>
                  {reelsByViews.map((reel, i) => (
                    <ReelRow key={reel.id} reel={reel} stats={reelStats[reel.id]} rank={i + 1} maxViews={maxViews} t={t} locale={locale} router={router} />
                  ))}
                </div>
              </section>
              <button type="button" style={styles.uploadBtn} onClick={() => router.push(`/${locale}/upload`)}>
                + {t("creatorUploadNew")}
              </button>
            </>)}
          </>)}

          {/* ══ AUDIENCE TAB ══ */}
          {activeTab === "audience" && (<>
            <div style={styles.statsGrid}>
              <StatCard label={t("creatorFollowers")} value={followerCount} icon="👥" color={GOLD} />
              <StatCard label={t("creatorNewFollowers")} value={newFollowersThisWeek} icon="📈" color="#34D399" />
              {avgScore != null && <StatCard label={t("creatorAvgScore")} value={avgScore} icon="⭐" color={GOLD} />}
              {bestScore != null && <StatCard label={t("creatorBestScore")} value={bestScore} icon="🏆" color="#60A5FA" />}
            </div>

            {reels.length > 0 && (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>📊 {t("creatorContentBreakdown")}</h2>
                <div style={styles.breakdown}>
                  {[
                    { key: "training", label: "🥊 Training", color: "#F87171" },
                    { key: "lifestyle", label: "🎬 Lifestyle", color: "#60A5FA" },
                    { key: "educational", label: "📚 Educational", color: GOLD },
                  ].map(({ key, label, color }) => {
                    const count = ctCounts[key] || 0;
                    const pct = Math.round((count / ctTotal) * 100);
                    return count > 0 ? (
                      <div key={key} style={styles.breakdownRow}>
                        <span style={{ ...styles.breakdownLabel, color }}>{label}</span>
                        <div style={styles.breakdownBar}>
                          <div style={{ ...styles.breakdownFill, width: `${pct}%`, background: color }} />
                        </div>
                        <span style={styles.breakdownCount}>{count}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </section>
            )}

            {externalAttempts.length > 0 && (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>🎯 {t("creatorScoreDistrib")}</h2>
                <div style={{ background: "linear-gradient(145deg, #111012, #0a0a0a)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: "2.5px solid #D4AF37", borderRadius: "3px 14px 14px 3px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { key: "excellent", label: t("creatorScoreExcellent"), count: scoreDistrib.excellent, color: "#34D399" },
                    { key: "good",      label: t("creatorScoreGood"),      count: scoreDistrib.good,      color: GOLD },
                    { key: "poor",      label: t("creatorScorePoor"),      count: scoreDistrib.poor,      color: "#F87171" },
                  ].map(({ key, label, count, color }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color, width: 140, flexShrink: 0 }}>{label}</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 999, background: color, width: `${Math.round((count / distribTotal) * 100)}%`, transition: "width 0.5s ease" }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 900, color, width: 24, textAlign: "right", flexShrink: 0 }}>{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {externalAttempts.length === 0 && followerCount === 0 && (
              <EmptyState emoji="👥" title={t("creatorNoAudience")} />
            )}
          </>)}

        </div>
      )}

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </div>
  );
}

