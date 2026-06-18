"use client";

import { PURPLE } from "@/lib/tokens";
import styles from "@/components/challenges/challengesStyles";

export default function MainTabBar({ mainTab, onTabChange, hasPendingBattle, labels }) {
  return (
    <div style={styles.mainTabRow}>
      <button
        type="button"
        style={{ ...styles.mainTab, ...(mainTab === "leaderboard" ? styles.mainTabActive : {}) }}
        onClick={() => onTabChange("leaderboard")}
      >
        {labels.leaderboard}
      </button>
      <button
        type="button"
        style={{
          ...styles.mainTab,
          ...(mainTab === "battles" ? styles.mainTabActive : {}),
          ...(hasPendingBattle ? { color: PURPLE } : {}),
        }}
        onClick={() => onTabChange("battles")}
      >
        {labels.battles}
        {hasPendingBattle && (
          <span style={{ marginLeft: 5, display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: PURPLE, verticalAlign: "middle" }} />
        )}
      </button>
    </div>
  );
}
