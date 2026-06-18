"use client";

import { GOLD } from "@/lib/tokens";
import styles from "@/components/creator/creatorDashboardStyles";
import { formatCompact } from "@/lib/utils";

/**
 * @param {{ label: string, value: number|string, color?: string, icon: string }} props
 */
export default function StatCard({ label, value, color = GOLD, icon }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statIcon}>{icon}</span>
      <span style={{ ...styles.statValue, color }}>{formatCompact(value)}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}
