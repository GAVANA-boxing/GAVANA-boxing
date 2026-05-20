"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocale, translate } from "@/lib/i18n";
import BottomNav from "@/components/BottomNav";
import SkeletonBlock from "@/components/SkeletonBlock";
import { GOLD, redAlpha } from "@/lib/tokens";
import styles from "@/components/notifications/notificationsStyles";
import Image from "next/image";
import {
  getActorName, getActorId, getActorPhoto,
  getTypeIcon, getTranslatedNotificationText,
  formatRelativeTime, getTimeGroup,
  SOCIAL_TYPES, COACH_TYPES, GYM_TYPES_NOTIF,
} from "@/lib/notificationHelpers";
import { getTimestampMs } from "@/lib/utils";
import { useNotificationsData } from "@/hooks/useNotificationsData";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const [filterType, setFilterType] = useState("all");
  const [clearing, setClearing] = useState(false);
  const [toast, setToast] = useState(null);

  const { notifications, loading, actorProfiles } = useNotificationsData({ user, authLoading });

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => notification.read === false).length;
  }, [notifications]);

  const tabUnreadCounts = useMemo(() => ({
    all:    notifications.filter((n) => !n.read).length,
    social: notifications.filter((n) => !n.read && SOCIAL_TYPES.has(n.type)).length,
    coach:  notifications.filter((n) => !n.read && COACH_TYPES.has(n.type)).length,
    gym:    notifications.filter((n) => !n.read && GYM_TYPES_NOTIF.has(n.type)).length,
  }), [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filterType === "all") return notifications;
    if (filterType === "social") return notifications.filter((n) => SOCIAL_TYPES.has(n.type));
    if (filterType === "coach") return notifications.filter((n) => COACH_TYPES.has(n.type));
    if (filterType === "gym") return notifications.filter((n) => GYM_TYPES_NOTIF.has(n.type));
    return notifications;
  }, [notifications, filterType]);

  const groupedNotifications = useMemo(() => {
    return filteredNotifications.reduce((groups, notification) => {
      const group = getTimeGroup(notification.createdAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(notification);
      return groups;
    }, {});
  }, [filteredNotifications]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleClearRead = async () => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const staleReadIds = notifications
      .filter((n) => n.read === true && getTimestampMs(n.createdAt) < cutoff)
      .map((n) => n.id);
    if (!staleReadIds.length) return;
    setClearing(true);
    try {
      await Promise.all(staleReadIds.map((id) => deleteDoc(doc(db, "notifications", id))));
    } catch (e) {
      console.error("Clear read notifications error:", e);
      showToast(t("notifClearError"));
    } finally {
      setClearing(false);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => n.read === false).map((n) => n.id);
    if (!unreadIds.length) return;
    try {
      await Promise.all(unreadIds.map((id) => updateDoc(doc(db, "notifications", id), { read: true })));
    } catch (e) {
      console.error("Mark all read error:", e);
      showToast(t("notifMarkReadError"));
    }
  };

  const handleDismissNotification = (e, notificationId) => {
    e.stopPropagation();
    deleteDoc(doc(db, "notifications", notificationId)).catch((err) => {
      console.error("Dismiss notification error:", err);
    });
  };

  const handleOpenNotification = async (notification) => {
    if (notification.read === false) {
      updateDoc(doc(db, "notifications", notification.id), { read: true }).catch((error) => {
        console.error("Failed to mark notification as read:", error);
      });
    }

    if (notification.type === "coach_request") {
      router.push(`/${locale}/coach/dashboard`);
      return;
    }

    if (notification.type === "gym_join_request") {
      router.push(`/${locale}/gyms/dashboard`);
      return;
    }

    if (notification.type === "coach_accept" || notification.type === "coach_decline") {
      const actorId = getActorId(notification);
      if (actorId) router.push(`/${locale}/coach/${actorId}`);
      return;
    }

    if (notification.type === "gym_approved" && notification.gymId) {
      router.push(`/${locale}/gyms/${notification.gymId}`);
      return;
    }

    if (notification.type === "gym_declined") {
      router.push(`/${locale}/gyms`);
      return;
    }

    if (notification.type === "booking_scheduled" || notification.type === "session_completed") {
      const actorId = getActorId(notification);
      if (actorId) router.push(`/${locale}/coach/${actorId}`);
      return;
    }

    if (notification.type === "sparring_request") {
      router.push(`/${locale}/sparring`);
      return;
    }

    if (notification.type === "sparring_accepted") {
      const actorId = getActorId(notification);
      if (actorId) router.push(`/${locale}/inbox`);
      else router.push(`/${locale}/sparring`);
      return;
    }

    if ((notification.type === "event_rsvp" || notification.type === "event_reminder") && notification.eventId) {
      router.push(`/${locale}/events/${notification.eventId}`);
      return;
    }

    if (notification.type === "event_reminder") {
      router.push(`/${locale}/events`);
      return;
    }

    if (notification.type === "follow" || notification.type === "new_follower") {
      const actorId = getActorId(notification);
      if (actorId) router.push(`/${locale}/profile/${actorId}`);
      return;
    }

    if (notification.type === "pvp_challenge") {
      if (notification.reelId) {
        router.push(`/${locale}/reels?reelId=${encodeURIComponent(notification.reelId)}&source=pvp`);
      } else {
        router.push(`/${locale}/challenges`);
      }
      return;
    }

    if (notification.type === "challenge_attempt" && notification.reelId) {
      router.push(`/${locale}/reels?reelId=${encodeURIComponent(notification.reelId)}`);
      return;
    }

    if (notification.type === "remix" && notification.remixReelId) {
      router.push(`/${locale}/reels?reelId=${encodeURIComponent(notification.remixReelId)}`);
      return;
    }

    if (notification.type === "featured") {
      router.push(`/${locale}/creator/dashboard`);
      return;
    }

    if (notification.type === "challenge_beaten" && notification.reelId) {
      router.push(`/${locale}/reels?reelId=${encodeURIComponent(notification.reelId)}`);
      return;
    }

    if (notification.reelId) {
      router.push(`/${locale}/reels?reelId=${notification.reelId}`);
      return;
    }

    const actorId = getActorId(notification);
    if (actorId) {
      router.push(`/${locale}/profile/${actorId}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <button style={styles.backButton} onClick={() => router.push(`/${locale}/reels`)} aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <p style={styles.eyebrow}>GAVANA BOXING</p>
            <h1 style={styles.title}>{t("notifications")}</h1>
          </div>
          <div style={styles.unreadPillMuted}>—</div>
        </header>
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[1,2,3,4,5].map((i) => (
            <SkeletonBlock key={i} height={72} radius={16} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <main style={styles.page} className="page-enter">
      <header style={styles.header}>
        <button style={styles.backButton} onClick={() => router.push(`/${locale}/reels`)} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div>
          <p style={styles.eyebrow}>GAVANA BOXING</p>
          <h1 style={styles.title}>{t("notifications")}</h1>
        </div>
        <div style={unreadCount > 0 ? styles.unreadPill : styles.unreadPillMuted}>
          {unreadCount}
        </div>
      </header>

      {/* Filter chips + actions */}
      <div style={styles.filterBar}>
        <div style={styles.filterChips}>
          {[
            { key: "all",    label: t("notifFilterAll") },
            { key: "social", label: t("notifFilterSocial") },
            { key: "coach",  label: t("notifFilterCoach") },
            { key: "gym",    label: t("notifFilterGym") },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterType(key)}
              style={{ ...styles.filterChip, ...(filterType === key ? styles.filterChipActive : {}), display: "flex", alignItems: "center", gap: 5 }}
            >
              {label}
              {tabUnreadCounts[key] > 0 && (
                <span style={{ minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: "#C1121F", color: "#fff", fontSize: 9, fontWeight: 900, lineHeight: "16px", textAlign: "center", boxSizing: "border-box" }}>
                  {tabUnreadCounts[key] > 9 ? "9+" : tabUnreadCounts[key]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {unreadCount > 0 && (
            <button type="button" onClick={handleMarkAllRead} style={styles.markReadBtn}>
              {t("notifMarkAllRead")}
            </button>
          )}
          {notifications.some((n) => n.read === true && getTimestampMs(n.createdAt) < Date.now() - 86400000) && (
            <button type="button" onClick={handleClearRead} disabled={clearing} style={styles.clearBtn}>
              {clearing ? "…" : t("notifClear")}
            </button>
          )}
        </div>
      </div>

      <section style={styles.list}>
        {filteredNotifications.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              <BoxingGloveIcon />
            </div>
            <p style={styles.emptyTitle}>{filterType === "all" ? t("noNotificationsYet") : t("notifEmptyFiltered")}</p>
            <p style={styles.emptyText}>{filterType === "all" ? t("notificationsEmptyHelp") : t("notifEmptyFilteredDesc")}</p>
          </div>
        ) : (
          ["today", "yesterday", "earlier"].map((group) => (
            groupedNotifications[group]?.length ? (
              <div key={group} style={styles.group}>
                <div style={styles.groupTitle}>{t(group)}</div>
                {groupedNotifications[group].map((notification) => {
                  const actor = getActorName(notification);
                  const actorId = getActorId(notification);
                  const actorPhoto = getActorPhoto(notification, actorProfiles[actorId]);
                  const typeIcon = getTypeIcon(notification.type);

                  return (
                    <div
                      key={notification.id}
                      style={{
                        ...styles.notification,
                        background: notification.read === false
                          ? `linear-gradient(90deg, ${redAlpha(0.12)} 0%, rgba(12,10,10,0.96) 50%)`
                          : "rgba(255,255,255,0.025)",
                      }}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenNotification(notification)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleOpenNotification(notification); }}
                    >
                      {/* Unread bar */}
                      {notification.read === false && (
                        <div style={styles.unreadBar} />
                      )}
                      {/* Avatar with type badge */}
                      <div style={styles.avatarWrap}>
                        <div style={{
                          ...styles.avatar,
                          ...(notification.read === false ? {
                            boxShadow: `0 0 0 2px ${redAlpha(0.5)}, 0 0 16px ${redAlpha(0.2)}`,
                          } : {}),
                        }}>
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
                        onClick={(e) => handleDismissNotification(e, notification.id)}
                        aria-label="Dismiss"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null
          ))
        )}
      </section>
      <BottomNav router={router} user={user} currentLocale={locale} activeTab="alerts" />

      {toast && (
        <div style={styles.toast}>
          {toast}
        </div>
      )}
    </main>
  );
}

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

