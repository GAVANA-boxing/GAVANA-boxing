"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, getDoc, doc, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";
import BottomNav from "@/components/BottomNav";

function getCreatedAtMs(obj) {
  const ts = obj?.createdAt;
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

function formatCompact(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return String(num);
}

function StatCard({ label, value, color = "#D4AF37", icon }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statIcon}>{icon}</span>
      <span style={{ ...styles.statValue, color }}>{formatCompact(value)}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

function ReelRow({ reel, stats, rank, maxViews, t, locale, router }) {
  const views = stats?.views || reel.views || 0;
  const likes = stats?.likes || reel.likes || 0;
  const attempts = stats?.challengeAttempts || 0;
  const engRate = views > 0 ? ((likes + attempts) / views * 100).toFixed(1) : "0.0";
  const barPct = maxViews > 0 ? Math.max(4, Math.round((views / maxViews) * 100)) : 4;
  return (
    <div style={styles.reelRow} onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}`)}>
      <div style={styles.reelRank}>#{rank}</div>
      <div style={styles.reelInfo}>
        <div style={styles.reelCaption} title={reel.description || reel.caption || ""}>
          {(reel.description || reel.caption || t("trainingReel")).slice(0, 55) || t("trainingReel")}
        </div>
        <div style={styles.reelBar}>
          <div style={{ ...styles.reelBarFill, width: `${barPct}%` }} />
        </div>
        <div style={styles.reelMeta}>
          <span>👁 {formatCompact(views)}</span>
          <span>❤ {formatCompact(likes)}</span>
          {attempts > 0 && <span>🥊 {formatCompact(attempts)}</span>}
          <span style={{ marginLeft: "auto", color: engRate >= 5 ? "#34D399" : engRate >= 2 ? "#D4AF37" : "#888" }}>{engRate}%</span>
        </div>
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
        // 1. Load user's reels
        const reelsSnap = await getDocs(query(collection(db, "reels"), where("userId", "==", user.uid), orderBy("createdAt", "desc")));
        if (!active) return;
        const reelDocs = reelsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
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

        // 5. Check whether this creator is currently featured
        const now = Timestamp.now();
        const featuredSnap = await getDocs(query(
          collection(db, "featured_creators"),
          where("userId", "==", user.uid),
          where("featuredUntil", ">=", now)
        ));
        if (!active) return;
        setIsFeatured(!featuredSnap.empty);
      } catch (err) {
        console.error("Creator dashboard load error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [authLoading, user?.uid]);

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

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button type="button" style={styles.backBtn} onClick={() => router.back()}>←</button>
        <div>
          <p style={styles.kicker}>{t("creatorDashboard")}</p>
          <p style={styles.sub}>{t("creatorDashboardSub")}</p>
        </div>
        {isFeatured && (
          <div style={styles.featuredBadge}>⭐ {t("featuredBadge")}</div>
        )}
      </header>

      {loading ? (
        <div style={styles.loadingText}>...</div>
      ) : (
        <div style={styles.content}>
          {/* Stats grid */}
          <div style={styles.statsGrid}>
            <StatCard label={t("creatorTotalViews")} value={totalViews} icon="👁" color="#60A5FA" />
            <StatCard label={t("creatorTotalLikes")} value={totalLikes} icon="❤" color="#F87171" />
            <StatCard label={t("creatorFollowers")} value={followerCount} icon="👥" color="#D4AF37" />
            <StatCard label={t("creatorChallengeAttempts")} value={externalAttempts.length} icon="🥊" color="#34D399" />
          </div>

          {/* Growth row */}
          <div style={styles.growthRow}>
            <div style={styles.growthItem}>
              <span style={styles.growthNum}>+{newFollowersThisWeek}</span>
              <span style={styles.growthLbl}>{t("creatorNewFollowers")}</span>
            </div>
            <div style={styles.growthItem}>
              <span style={{ ...styles.growthNum, color: Number(engagementRate) >= 5 ? "#34D399" : Number(engagementRate) >= 2 ? "#D4AF37" : "#F87171" }}>
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
            {avgScore != null && (
              <div style={styles.growthItem}>
                <span style={{ ...styles.growthNum, color: "#D4AF37" }}>{avgScore}/10</span>
                <span style={styles.growthLbl}>{t("creatorAvgScore")}</span>
              </div>
            )}
            {bestScore != null && (
              <div style={styles.growthItem}>
                <span style={{ ...styles.growthNum, color: "#D4AF37" }}>⭐ {bestScore}</span>
                <span style={styles.growthLbl}>{t("creatorBestScore")}</span>
              </div>
            )}
          </div>

          {/* Content type breakdown */}
          {reels.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>📊 {t("creatorContentBreakdown")}</h2>
              <div style={styles.breakdown}>
                {[
                  { key: "training", label: "🥊 Training", color: "#F87171" },
                  { key: "lifestyle", label: "🎬 Lifestyle", color: "#60A5FA" },
                  { key: "educational", label: "📚 Educational", color: "#D4AF37" },
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

          {/* Growth tip */}
          <div style={styles.tip}>
            <span style={styles.tipIcon}>💡</span>
            <span style={styles.tipText}>{growthTip}</span>
          </div>

          {reels.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>{t("creatorNoReels")}</p>
              <button type="button" style={styles.uploadBtn} onClick={() => router.push(`/${locale}/upload`)}>
                {t("creatorGoUpload")}
              </button>
            </div>
          ) : (
            <>
              {/* Reel performance list */}
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>📈 {t("creatorPerformance")}</h2>
                <div style={styles.reelList}>
                  {reelsByViews.map((reel, i) => (
                    <ReelRow key={reel.id} reel={reel} stats={reelStats[reel.id]} rank={i + 1} maxViews={maxViews} t={t} locale={locale} router={router} />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      )}

      <BottomNav locale={locale} activeTab="profile" />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "#050505",
    color: "#fff",
    fontFamily: "inherit",
    display: "flex",
    flexDirection: "column",
    paddingBottom: "calc(64px + env(safe-area-inset-bottom))",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "calc(16px + env(safe-area-inset-top)) 16px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: 20,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 8,
    lineHeight: 1,
  },
  kicker: {
    margin: 0,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#D4AF37",
  },
  sub: {
    margin: "2px 0 0",
    fontSize: 13,
    color: "#888",
  },
  featuredBadge: {
    marginLeft: "auto",
    padding: "5px 12px",
    borderRadius: 999,
    background: "rgba(212,175,55,0.15)",
    border: "1px solid rgba(212,175,55,0.4)",
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: 900,
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 16px 0",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  loadingText: {
    textAlign: "center",
    color: "#555",
    padding: 40,
    fontSize: 24,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  statCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: "16px 14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  statIcon: {
    fontSize: 20,
    lineHeight: 1,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 900,
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: 700,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  growthRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  growthItem: {
    flex: 1,
    minWidth: 90,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "12px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  growthNum: {
    fontSize: 20,
    fontWeight: 900,
    color: "#34D399",
    lineHeight: 1,
  },
  growthLbl: {
    fontSize: 10,
    color: "#888",
    fontWeight: 700,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#888",
  },
  breakdown: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  breakdownRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  breakdownLabel: {
    width: 110,
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  breakdownBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    background: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  breakdownFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.4s ease",
    opacity: 0.85,
  },
  breakdownCount: {
    width: 20,
    textAlign: "right",
    fontSize: 12,
    fontWeight: 700,
    color: "#888",
    flexShrink: 0,
  },
  tip: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "14px 16px",
    borderRadius: 14,
    background: "rgba(212,175,55,0.07)",
    border: "1px solid rgba(212,175,55,0.2)",
  },
  tipIcon: {
    fontSize: 16,
    flexShrink: 0,
    marginTop: 1,
  },
  tipText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.5,
  },
  reelList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  reelBar: {
    height: 3,
    borderRadius: 999,
    background: "rgba(255,255,255,0.07)",
    overflow: "hidden",
    margin: "2px 0",
  },
  reelBarFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #C1121F, #D4AF37)",
  },
  reelRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    cursor: "pointer",
  },
  reelRank: {
    width: 28,
    textAlign: "center",
    fontSize: 12,
    fontWeight: 900,
    color: "#555",
    flexShrink: 0,
  },
  reelInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  reelCaption: {
    fontSize: 13,
    fontWeight: 700,
    color: "#eee",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  reelMeta: {
    display: "flex",
    gap: 12,
    fontSize: 11,
    color: "#666",
    fontWeight: 700,
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  emptyText: {
    margin: 0,
    color: "#666",
    fontSize: 14,
  },
  uploadBtn: {
    padding: "12px 28px",
    borderRadius: 999,
    background: "#C1121F",
    border: "none",
    color: "#fff",
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
};
