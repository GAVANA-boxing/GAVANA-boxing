"use client";

import styles from "@/components/challenges/challengesStyles";

export default function YourRankBar({ bestUserRank, labels, t }) {
  const isRanked = !!bestUserRank;

  return (
    <div style={{
      ...styles.yourRankBar,
      ...(isRanked ? styles.yourRankBarGold : styles.yourRankBarRed),
    }}>
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {isRanked
            ? <span style={{ fontSize: 15 }}>🏆</span>
            : <span style={{ fontSize: 13 }}>🔴</span>}
          <span style={isRanked ? styles.yourRankLabelGold : styles.yourRankLabelRed}>
            {isRanked ? labels.ranked : labels.unranked}
          </span>
        </span>
        {!isRanked && (
          <span style={styles.yourRankSubLabel}>{t("challengeNotOnBoardSub")}</span>
        )}
      </span>
      {isRanked && (
        <span style={styles.yourRankChallenge}>{t(bestUserRank.challenge.titleKey)}</span>
      )}
    </div>
  );
}
