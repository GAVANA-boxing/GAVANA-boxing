"use client";

import styles from "@/components/notifications/notificationsStyles";

function BoxingGloveIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.3 4.3c3.8-1.2 8 .6 9.3 4.6.9 2.9-.2 6.2-2.8 7.8l-.5 2.6H7.2l.5-3.2c-1.7-.9-2.9-2.5-3.3-4.5-.7-3.4.9-6.4 3.9-7.3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 16.1h6.8M10.2 5.8c1.9.5 3.1 1.8 3.6 3.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NotificationsEmptyState({ filterType, t }) {
  const isFiltered = filterType !== "all";
  return (
    <div style={styles.empty}>
      <div style={styles.emptyIcon}>
        <BoxingGloveIcon />
      </div>
      <p style={styles.emptyTitle}>
        {isFiltered ? t("notifEmptyFiltered") : t("noNotificationsYet")}
      </p>
      <p style={styles.emptyText}>
        {isFiltered ? t("notifEmptyFilteredDesc") : t("notificationsEmptyHelp")}
      </p>
    </div>
  );
}
