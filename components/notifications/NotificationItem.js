"use client";

import Image from "next/image";
import { GOLD, RED, redAlpha } from "@/lib/tokens";
import styles from "@/components/notifications/notificationsStyles";
import {
  getActorName,
  getActorId,
  getActorPhoto,
  getTypeIcon,
  getTranslatedNotificationText,
  formatRelativeTime,
} from "@/lib/notificationHelpers";

export function NotificationItem({ notification, actorProfiles, locale, onOpen, onDismiss, t }) {
  const actor = getActorName(notification);
  const actorId = getActorId(notification);
  const actorPhoto = getActorPhoto(notification, actorProfiles[actorId]);
  const typeIcon = getTypeIcon(notification.type);
  const isUnread = notification.read === false;

  return (
    <div
      style={{
        ...styles.notification,
        background: isUnread
          ? `linear-gradient(90deg, ${redAlpha(0.12)} 0%, rgba(12,10,10,0.96) 50%)`
          : "rgba(255,255,255,0.025)",
      }}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(notification)}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(notification); }}
    >
      {/* Unread bar */}
      {isUnread && <div style={styles.unreadBar} />}

      {/* Avatar with type badge */}
      <div style={styles.avatarWrap}>
        <div
          style={{
            ...styles.avatar,
            ...(isUnread
              ? { boxShadow: `0 0 0 2px ${redAlpha(0.5)}, 0 0 16px ${redAlpha(0.2)}` }
              : {}),
          }}
        >
          {actorPhoto
            ? <Image src={actorPhoto} alt="" width={46} height={46} style={{ objectFit: "cover" }} />
            : actor.charAt(0).toUpperCase()}
        </div>
        <span style={styles.typeBadge}>{typeIcon}</span>
      </div>

      {/* Body */}
      <div style={styles.notificationBody}>
        <div style={styles.notificationTopLine}>
          <span style={styles.username}>{actor}</span>
          <span style={styles.date}>{formatRelativeTime(notification.createdAt, locale, t)}</span>
        </div>
        <div style={styles.notificationText}>
          {getTranslatedNotificationText(notification, t)}
        </div>
        {notification.type === "pvp_challenge" && (
          <div style={styles.pvpScoreRow}>
            <span style={{ color: notification.result === "win" ? "#F87171" : "#34D399", fontWeight: 900 }}>
              {Number(notification.challengerScore ?? 0).toFixed(1)}/10
            </span>
            <span style={{ color: "#444" }}> vs </span>
            <span style={{ color: GOLD, fontWeight: 900 }}>
              {Number(notification.opponentScore ?? 0).toFixed(1)}/10
            </span>
          </div>
        )}
        {notification.text && (
          <div style={styles.commentPreview}>{notification.text}</div>
        )}
      </div>

      <button
        style={styles.dismissBtn}
        onClick={(e) => onDismiss(e, notification.id)}
        aria-label="Dismiss"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
