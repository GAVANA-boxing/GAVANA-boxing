"use client";

import styles from "@/components/notifications/notificationsStyles";

export function NotificationsHeader({ unreadCount, onBack, t }) {
  return (
    <header style={styles.header}>
      <button style={styles.backButton} onClick={onBack} aria-label="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div>
        <p style={styles.eyebrow}>GAVANA BOXING</p>
        <h1 style={styles.title}>{t("notifications")}</h1>
      </div>
      <div style={unreadCount > 0 ? styles.unreadPill : styles.unreadPillMuted}>
        {unreadCount}
      </div>
    </header>
  );
}

export function NotificationsLoadingHeader({ onBack, t }) {
  return (
    <header style={styles.header}>
      <button style={styles.backButton} onClick={onBack} aria-label="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div>
        <p style={styles.eyebrow}>COMBAT · ALERTS</p>
        <h1 style={styles.title}>{t("notifications")}</h1>
      </div>
      <div style={styles.unreadPillMuted}>—</div>
    </header>
  );
}
