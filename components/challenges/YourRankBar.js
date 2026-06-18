"use client";

import styles from "@/components/challenges/challengesStyles";

export default function YourRankBar({ bestUserRank, labels, t }) {
  const isRanked = !!bestUserRank;

  return (
    <div style={{ ...styles.yourRankBar, ...(isRanked ? styles.yourRankBarGold : {}) }}>
      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {isRanked && <span style={{ fontSize: 15 }}>🏆</span>}
        <span style={isRanked ? styles.yourRankLabelGold : styles.yourRankLabel}>
          {isRanked ? labels.ranked : labels.unranked}
        </span>
      </span>
      {isRanked && (
        <span style={styles.yourRankChallenge}>{t(bestUserRank.challenge.titleKey)}</span>
      )}
    </div>
  );
}
