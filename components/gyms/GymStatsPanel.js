"use client";

import { RED } from "@/lib/tokens";
import styles from "@/components/gyms/gymsDashboardStyles";

export default function GymStatsPanel({ gym, joinRequests, t, locale, router, setActiveTab }) {
  return (
    <div style={styles.statsPanel}>
      <button type="button" style={styles.statCellBtn} onClick={() => setActiveTab("members")}>
        <span style={styles.statNum}>{gym.memberCount || 0}</span>
        <span style={styles.statLbl}>{t("gymMembers")}</span>
      </button>
      <div style={styles.statDivider} />
      <button type="button" style={styles.statCellBtn} onClick={() => router.push(`/${locale}/gyms/${gym.id}#reviews`)}>
        <span style={styles.statNum}>{gym.totalReviews || 0}</span>
        <span style={styles.statLbl}>{t("gymReviews")}</span>
      </button>
      <div style={styles.statDivider} />
      <button type="button" style={styles.statCellBtn} onClick={() => router.push(`/${locale}/gyms/${gym.id}#reviews`)}>
        <span style={styles.statNum}>{gym.rating ? gym.rating.toFixed(1) : "—"}</span>
        <span style={styles.statLbl}>{t("gymRating")}</span>
      </button>
      <div style={styles.statDivider} />
      <button type="button" style={{ ...styles.statCellBtn, ...(joinRequests.length > 0 ? { color: RED } : {}) }} onClick={() => setActiveTab("requests")}>
        <span style={{ ...styles.statNum, ...(joinRequests.length > 0 ? { color: "#F87171" } : {}) }}>{joinRequests.length}</span>
        <span style={styles.statLbl}>{t("gymJoinRequests")}</span>
      </button>
    </div>
  );
}
