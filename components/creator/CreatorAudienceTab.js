"use client";

import { GOLD } from "@/lib/tokens";
import styles from "@/components/creator/creatorDashboardStyles";
import StatCard from "@/components/creator/StatCard";
import EmptyState from "@/components/EmptyState";

const CONTENT_TYPES = [
  { key: "training",    label: "🥊 Training",    color: "#F87171" },
  { key: "lifestyle",   label: "🎬 Lifestyle",   color: "#60A5FA" },
  { key: "educational", label: "📚 Educational", color: GOLD },
];

const SCORE_ROWS = [
  { key: "excellent", color: "#34D399" },
  { key: "good",      color: GOLD },
  { key: "poor",      color: "#F87171" },
];

/**
 * @param {{
 *   t: (key: string) => string,
 *   followerCount: number,
 *   newFollowersThisWeek: number,
 *   avgScore: string | null,
 *   bestScore: string | null,
 *   hasReels: boolean,
 *   ctCounts: Record<string, number>,
 *   ctTotal: number,
 *   hasExternalAttempts: boolean,
 *   scoreDistrib: { excellent: number, good: number, poor: number },
 *   distribTotal: number,
 * }} props
 */
export default function CreatorAudienceTab({
  t,
  followerCount,
  newFollowersThisWeek,
  avgScore,
  bestScore,
  hasReels,
  ctCounts,
  ctTotal,
  hasExternalAttempts,
  scoreDistrib,
  distribTotal,
}) {
  const showEmpty = !hasExternalAttempts && followerCount === 0;

  return (
    <>
      <div style={styles.statsGrid}>
        <StatCard label={t("creatorFollowers")}    value={followerCount}       icon="👥" color={GOLD} />
        <StatCard label={t("creatorNewFollowers")} value={newFollowersThisWeek} icon="📈" color="#34D399" />
        {avgScore  != null && <StatCard label={t("creatorAvgScore")}  value={avgScore}  icon="⭐" color={GOLD} />}
        {bestScore != null && <StatCard label={t("creatorBestScore")} value={bestScore} icon="🏆" color="#60A5FA" />}
      </div>

      {hasReels && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>📊 {t("creatorContentBreakdown")}</h2>
          <div style={styles.breakdown}>
            {CONTENT_TYPES.map(({ key, label, color }) => {
              const count = ctCounts[key] || 0;
              if (count === 0) return null;
              const pct = Math.round((count / ctTotal) * 100);
              return (
                <div key={key} style={styles.breakdownRow}>
                  <span style={{ ...styles.breakdownLabel, color }}>{label}</span>
                  <div style={styles.breakdownBar}>
                    <div style={{ ...styles.breakdownFill, width: `${pct}%`, background: color }} />
                  </div>
                  <span style={styles.breakdownCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {hasExternalAttempts && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🎯 {t("creatorScoreDistrib")}</h2>
          <div style={{ background: "#141416", border: "1px solid rgba(255,255,255,0.06)", borderLeft: "2.5px solid #F5C451", borderRadius: "3px 14px 14px 3px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {SCORE_ROWS.map(({ key, color }) => {
              const count = scoreDistrib[key];
              const label = t(`creatorScore${key.charAt(0).toUpperCase() + key.slice(1)}`);
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color, width: 140, flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 999, background: color, width: `${Math.round((count / distribTotal) * 100)}%`, transition: "width 0.5s ease" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 900, color, width: 24, textAlign: "right", flexShrink: 0 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {showEmpty && <EmptyState emoji="👥" title={t("creatorNoAudience")} />}
    </>
  );
}
