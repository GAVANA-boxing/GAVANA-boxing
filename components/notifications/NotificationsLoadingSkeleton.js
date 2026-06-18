"use client";

import SkeletonBlock from "@/components/SkeletonBlock";
import styles from "@/components/notifications/notificationsStyles";
import { NotificationsLoadingHeader } from "@/components/notifications/NotificationsHeader";

export function NotificationsLoadingSkeleton({ onBack, t }) {
  return (
    <div style={styles.page}>
      <NotificationsLoadingHeader onBack={onBack} t={t} />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBlock key={i} height={72} radius={16} />
        ))}
      </div>
    </div>
  );
}
