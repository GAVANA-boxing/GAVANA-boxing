"use client";

import { GOLD } from "@/lib/tokens";
import styles from "@/components/challenges/challengesStyles";

/**
 * Props:
 *   seasonTab    — "week" | "alltime"
 *   onTabChange  — (tab: string) => void
 *   countdown    — formatted string e.g. "02:14:33"
 *   labels       — { currentWeek, allTime }
 */
export default function SeasonFilterRow({ seasonTab, onTabChange, countdown, labels }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <div style={styles.seasonTabRow}>
        <button
          type="button"
          style={{ ...styles.seasonTab, ...(seasonTab === "week" ? styles.seasonTabActive : {}) }}
          onClick={() => onTabChange("week")}
        >
          {labels.currentWeek}
        </button>
        <button
          type="button"
          style={{ ...styles.seasonTab, ...(seasonTab === "alltime" ? styles.seasonTabActive : {}) }}
          onClick={() => onTabChange("alltime")}
        >
          {labels.allTime}
        </button>
      </div>
      {seasonTab === "week" && (
        <span style={{ fontSize: 10, fontWeight: 900, color: GOLD, fontVariantNumeric: "tabular-nums", letterSpacing: 0.5, padding: "3px 10px", borderRadius: 999, background: "rgba(245,196,81,0.12)", border: "1px solid rgba(245,196,81,0.3)", whiteSpace: "nowrap", flexShrink: 0 }}>
          ⏱ {countdown}
        </span>
      )}
    </div>
  );
}
