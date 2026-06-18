"use client";

import styles from "@/components/challenges/challengesStyles";

/**
 * Props:
 *   seasonTab    — "week" | "alltime"
 *   onTabChange  — (tab: string) => void
 *   countdown    — formatted string e.g. "02:14:33" or "3d 08h"
 *   labels       — { currentWeek, allTime, seasonEnds }
 */
export default function SeasonFilterRow({ seasonTab, onTabChange, countdown, labels }) {
  const isUrgent = seasonTab === "week" && countdown.includes(":");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
          <span style={{
            fontSize: 11, fontWeight: 900,
            color: isUrgent ? "#F87171" : "rgba(245,196,81,0.9)",
            fontVariantNumeric: "tabular-nums", letterSpacing: 0.5,
            padding: "4px 11px", borderRadius: 999,
            background: isUrgent ? "rgba(239,68,68,0.1)" : "rgba(245,196,81,0.1)",
            border: isUrgent ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(245,196,81,0.28)",
            whiteSpace: "nowrap", flexShrink: 0,
          }}>
            {isUrgent ? "🔴" : "⏳"} {countdown}
          </span>
        )}
      </div>
      {seasonTab === "week" && (
        <div style={{ ...styles.countdownBanner, ...(isUrgent ? styles.countdownBannerUrgent : {}) }}>
          <span style={{ ...styles.countdownLabel, ...(isUrgent ? styles.countdownLabelUrgent : {}) }}>
            {labels.seasonEnds}
          </span>
          <span style={{ ...styles.countdownValue, ...(isUrgent ? styles.countdownValueUrgent : {}) }}>
            {countdown}
          </span>
        </div>
      )}
    </div>
  );
}
