"use client";

import { PURPLE } from "@/lib/tokens";
import styles from "@/components/challenges/challengesStyles";

const mainTabRow = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 6,
  padding: 5,
  borderRadius: 16,
  background: "rgba(0,0,0,0.48)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};

/**
 * Props:
 *   mainTab        — "leaderboard" | "battles"
 *   onTabChange    — (tab: string) => void
 *   hasPendingBattle — boolean — whether a pending battle exists (shows purple dot)
 *   labels         — { leaderboard, battles }
 */
export default function MainTabBar({ mainTab, onTabChange, hasPendingBattle, labels }) {
  return (
    <div style={mainTabRow}>
      <button
        type="button"
        style={{ ...styles.seasonTab, ...(mainTab === "leaderboard" ? styles.seasonTabActive : {}) }}
        onClick={() => onTabChange("leaderboard")}
      >
        {labels.leaderboard}
      </button>
      <button
        type="button"
        style={{
          ...styles.seasonTab,
          ...(mainTab === "battles" ? styles.seasonTabActive : {}),
          ...(hasPendingBattle ? { color: PURPLE } : {}),
        }}
        onClick={() => onTabChange("battles")}
      >
        {labels.battles}
        {hasPendingBattle && (
          <span style={{ marginLeft: 4, display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: PURPLE, verticalAlign: "middle" }} />
        )}
      </button>
    </div>
  );
}
