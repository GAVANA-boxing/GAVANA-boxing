"use client";

import styles from "@/components/coach/coachDashboardStyles";
import { formatAgo } from "@/lib/utils";
import Image from "next/image";

export function RequesterAvatar({ user: u }) {
  if (!u) {
    return <div style={styles.avatarFallback}>?</div>;
  }
  const initials = (u.displayName || u.username || "?")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (u.photoURL) {
    return <Image src={u.photoURL} alt="" width={42} height={42} style={{ borderRadius: "50%", objectFit: "cover" }} />;
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

      {(requesterUser?.fighterDNA?.archetypeKey || requesterUser?.weightClass) && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6, marginBottom: 4 }}>
          {requesterUser?.fighterDNA?.archetypeKey && (() => {
            const ARCH_COLORS = { pressure: "#EF4444", outboxer: "#3B82F6", counter: "#8B5CF6", explosive: "#F59E0B", technician: "#10B981" };
            const ARCH_LABELS = { pressure: "Pressure", outboxer: "Outboxer", counter: "Counter", explosive: "Explosive", technician: "Technician" };
            const arch = requesterUser.fighterDNA.archetypeKey;
            const color = ARCH_COLORS[arch] || "#fff";
            return (
              <span style={{ fontSize: 9, fontWeight: 900, padding: "2px 8px", borderRadius: 6, background: `${color}18`, border: `1px solid ${color}35`, color, letterSpacing: 0.5, textTransform: "uppercase" }}>
                🧬 {ARCH_LABELS[arch] || arch}
              </span>
            );
          })()}
          {requesterUser?.weightClass && (
            <span style={{ fontSize: 9, fontWeight: 900, padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", letterSpacing: 0.5 }}>
              ⚖️ {requesterUser.weightClass}
            </span>
          )}
        </div>
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
