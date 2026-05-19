"use client";

import styles from "@/components/coach/coachDashboardStyles";
import { formatAgo } from "@/lib/utils";

export function RequesterAvatar({ user: u }) {
  if (!u) {
    return <div style={styles.avatarFallback}>?</div>;
  }
  const initials = (u.displayName || u.username || "?")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (u.photoURL) {
    return <img src={u.photoURL} alt="" style={styles.avatar} />;
  }
  return <div style={styles.avatarFallback}>{initials}</div>;
}

export function StatusBadge({ status, t }) {
  if (status === "accepted") {
    return <span style={styles.badgeAccepted}>{t("requestAccepted")}</span>;
  }
  if (status === "declined") {
    return <span style={styles.badgeDeclined}>{t("requestDeclined")}</span>;
  }
  return <span style={styles.badgePending}>{t("requestPending")}</span>;
}

export function RequestCard({ request, requesterUser, t, locale, onAccept, onDecline, onSchedule, onMarkComplete, onViewProfile, updating, completingId }) {
  const typeLbl = request.type === "sparring" ? t("sparringRequestType") : t("coachRequestType");

  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <button type="button" style={styles.avatarBtn} onClick={() => onViewProfile?.(requesterUser, request)}>
          <RequesterAvatar user={requesterUser} />
        </button>
        <div style={styles.cardMeta}>
          <div style={styles.cardNameRow}>
            <span style={styles.cardName}>
              {requesterUser?.displayName || requesterUser?.username || "Fighter"}
            </span>
            <span style={request.type === "sparring" ? styles.typeChipSparring : styles.typeChipCoach}>
              {typeLbl}
            </span>
          </div>
          <span style={styles.cardTime}>{formatAgo(request.createdAt, locale)}</span>
        </div>
        <StatusBadge status={request.status} t={t} />
      </div>

      {request.message && (
        <p style={styles.cardMessage}>{request.message}</p>
      )}

      {request.type === "sparring" && request.sparringPostId && (
        <div style={styles.sparringTag}>
          {t("coachSparringPostTag")}
        </div>
      )}

      {request.status === "pending" && (
        <div style={styles.cardActions}>
          <button
            type="button"
            style={styles.declineBtn}
            disabled={updating === request.id}
            onClick={() => onDecline(request.id)}
          >
            {t("decline")}
          </button>
          <button
            type="button"
            style={styles.acceptBtn}
            disabled={updating === request.id}
            onClick={() => onAccept(request.id, request.userId)}
          >
            {updating === request.id ? "…" : t("accept")}
          </button>
        </div>
      )}

      {request.status === "accepted" && !request.bookedAt && (
        <button
          type="button"
          style={styles.scheduleBtn}
          onClick={() => onSchedule(request)}
        >
          📅 {t("scheduleSession")}
        </button>
      )}

      {request.bookedAt && !request.sessionCompleted && (
        <div style={styles.bookedRow}>
          <div style={styles.bookedTag}>
            📅 {request.bookedDate} {request.bookedTime} · {request.bookedDuration}min
          </div>
          {request.bookingId && (
            <button
              type="button"
              style={styles.completeBtn}
              disabled={completingId === request.id}
              onClick={() => onMarkComplete(request)}
            >
              {completingId === request.id ? t("coachMarkCompleting") : t("coachMarkComplete")}
            </button>
          )}
        </div>
      )}

      {request.sessionCompleted && (
        <div style={styles.completedTag}>✓ {t("coachBookingCompleted")}</div>
      )}
    </div>
  );
}
