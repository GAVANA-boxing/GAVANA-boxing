"use client";

import { RED } from "@/lib/tokens";
import styles from "@/components/notifications/notificationsStyles";
import { getTimestampMs } from "@/lib/utils";
import { SOCIAL_TYPES, COACH_TYPES, GYM_TYPES_NOTIF } from "@/lib/notificationHelpers";

const FILTER_KEYS = ["all", "social", "coach", "gym"];

const FILTER_LABEL_KEYS = {
  all:    "notifFilterAll",
  social: "notifFilterSocial",
  coach:  "notifFilterCoach",
  gym:    "notifFilterGym",
};

export function NotificationsFilterBar({
  filterType,
  onFilterChange,
  tabUnreadCounts,
  unreadCount,
  notifications,
  clearing,
  onMarkAllRead,
  onClearRead,
  t,
}) {
  const hasStaleRead = notifications.some(
    (n) => n.read === true && getTimestampMs(n.createdAt) < Date.now() - 86400000
  );

  return (
    <div style={styles.filterBar}>
      <div style={styles.filterChips}>
        {FILTER_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onFilterChange(key)}
            style={{
              ...styles.filterChip,
              ...(filterType === key ? styles.filterChipActive : {}),
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {t(FILTER_LABEL_KEYS[key])}
            {tabUnreadCounts[key] > 0 && (
              <span
                style={{
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  borderRadius: 999,
                  background: RED,
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 900,
                  lineHeight: "16px",
                  textAlign: "center",
                  boxSizing: "border-box",
                }}
              >
                {tabUnreadCounts[key] > 9 ? "9+" : tabUnreadCounts[key]}
              </span>
            )}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {unreadCount > 0 && (
          <button type="button" onClick={onMarkAllRead} style={styles.markReadBtn}>
            {t("notifMarkAllRead")}
          </button>
        )}
        {hasStaleRead && (
          <button type="button" onClick={onClearRead} disabled={clearing} style={styles.clearBtn}>
            {clearing ? "…" : t("notifClear")}
          </button>
        )}
      </div>
    </div>
  );
}
