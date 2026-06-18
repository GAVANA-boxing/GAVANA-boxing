"use client";

import styles from "@/components/gyms/gymIdStyles";

export default function GymStatsRow({ gym, t }) {
  if (!gym.rating && !gym.totalReviews && !gym.memberCount) return null;

  return (
    <div style={styles.statsRow}>
      {gym.rating > 0 && (
        <div style={styles.statCell}>
          <span style={styles.statNum}>⭐ {gym.rating.toFixed(1)}</span>
          <span style={styles.statLbl}>{t("gymRating")}</span>
        </div>
      )}
      {gym.totalReviews > 0 && (
        <div style={styles.statCell}>
          <span style={styles.statNum}>{gym.totalReviews}</span>
          <span style={styles.statLbl}>{t("gymReviews")}</span>
        </div>
      )}
      {gym.memberCount > 0 && (
        <div style={styles.statCell}>
          <span style={styles.statNum}>{gym.memberCount}</span>
          <span style={styles.statLbl}>{t("gymMembers")}</span>
        </div>
      )}
    </div>
  );
}
