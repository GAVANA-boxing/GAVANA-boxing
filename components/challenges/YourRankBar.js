"use client";

import styles from "@/components/challenges/challengesStyles";

/**
 * Props:
 *   bestUserRank — null | { challenge: { titleKey }, rank: number }
 *   labels       — { ranked: string (with {rank} substituted), unranked: string }
 *   t            — (key: string) => string
 */
export default function YourRankBar({ bestUserRank, labels, t }) {
  return (
    <div style={styles.yourRankBar}>
      <span style={styles.yourRankLabel}>
        {bestUserRank ? labels.ranked : labels.unranked}
      </span>
      {bestUserRank && (
        <span style={styles.yourRankChallenge}>{t(bestUserRank.challenge.titleKey)}</span>
      )}
    </div>
  );
}
