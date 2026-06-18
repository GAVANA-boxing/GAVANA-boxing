"use client";

import styles from "@/components/leaderboard/leaderboardStyles";

/**
 * Props:
 *   leaderboardTab   string
 *   archetypeFilter  string
 *   weightFilter     string
 *   t                fn
 */
export default function LeaderboardEmptyState({ leaderboardTab, archetypeFilter, weightFilter, t }) {
  const hasActiveFilter = archetypeFilter !== "all" || weightFilter !== "all";

  const titleKey = hasActiveFilter
    ? "lbNoFightersFilter"
    : leaderboardTab === "week"      ? "seasonNoResultsThisWeek"
    : leaderboardTab === "improvement" ? "lbImprovementEmpty"
    : leaderboardTab === "streak"    ? "lbStreakEmpty"
    : leaderboardTab === "friends"   ? "followingEmptyHelp"
    : "leaderboardEmpty";

  const hintKey = hasActiveFilter ? "lbNoFightersFilterHint" : "leaderboardEmptyHelp";

  return (
    <div style={styles.emptyWrap}>
      <div style={styles.emptyIcon}>🏆</div>
      <p style={styles.emptyTitle}>{t(titleKey)}</p>
      <p style={styles.emptyText}>{t(hintKey)}</p>
    </div>
  );
}
