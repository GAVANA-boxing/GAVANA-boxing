"use client";

import styles from "@/components/leaderboard/leaderboardStyles";

/**
 * Props:
 *   champion   object  – leaderboard entry for the weekly champion
 *   profiles   object  – { [userId]: profileData }
 *   t          fn
 */
export default function WeeklyChampionBanner({ champion, profiles, t }) {
  if (!champion) return null;

  const name =
    profiles[champion.userId]?.displayName ||
    profiles[champion.userId]?.username ||
    "Fighter";

  return (
    <div style={styles.weeklyChampionBanner} className="section-reveal stagger-2">
      <div style={styles.weeklyChampionTop}>
        <span style={styles.weeklyChampionCrown}>👑</span>
        <span style={styles.weeklyChampionTitle}>{t("leaderboardWeeklyChampion")}</span>
      </div>
      <div style={styles.weeklyChampionName}>{name}</div>
      <div style={styles.weeklyChampionScore}>{champion.bestScore}/10</div>
    </div>
  );
}
