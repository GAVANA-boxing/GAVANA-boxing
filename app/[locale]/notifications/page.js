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
import styles from "@/components/notifications/notificationsStyles";
import {
  getActorId,
  SOCIAL_TYPES, COACH_TYPES, GYM_TYPES_NOTIF,
} from "@/lib/notificationHelpers";
import { getTimestampMs } from "@/lib/utils";
import { useNotificationsData } from "@/hooks/useNotificationsData";
import { getTimeGroup } from "@/lib/notificationHelpers";
import { NotificationsHeader } from "@/components/notifications/NotificationsHeader";
import { NotificationsLoadingSkeleton } from "@/components/notifications/NotificationsLoadingSkeleton";
import { NotificationsFilterBar } from "@/components/notifications/NotificationsFilterBar";
import { NotificationsEmptyState } from "@/components/notifications/NotificationsEmptyState";
import { NotificationItem } from "@/components/notifications/NotificationItem";

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
    return notifications.filter((n) => n.read === false).length;
  }, [notifications]);

  const tabUnreadCounts = useMemo(() => ({
    all:    notifications.filter((n) => !n.read).length,
    social: notifications.filter((n) => !n.read && SOCIAL_TYPES.has(n.type)).length,
    coach:  notifications.filter((n) => !n.read && COACH_TYPES.has(n.type)).length,
    gym:    notifications.filter((n) => !n.read && GYM_TYPES_NOTIF.has(n.type)).length,
  }), [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filterType === "all")    return notifications;
    if (filterType === "social") return notifications.filter((n) => SOCIAL_TYPES.has(n.type));
    if (filterType === "coach")  return notifications.filter((n) => COACH_TYPES.has(n.type));
    if (filterType === "gym")    return notifications.filter((n) => GYM_TYPES_NOTIF.has(n.type));
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
    } catch {
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
    } catch {
      showToast(t("notifMarkReadError"));
    }
  };

  const handleDismissNotification = (e, notificationId) => {
    e.stopPropagation();
    deleteDoc(doc(db, "notifications", notificationId)).catch(() => {
      showToast(t("notifClearError"));
    });
  };

  const handleOpenNotification = async (notification) => {
    if (notification.read === false) {
      updateDoc(doc(db, "notifications", notification.id), { read: true }).catch(() => {});
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
      <NotificationsLoadingSkeleton
        onBack={() => router.push(`/${locale}/reels`)}
        t={t}
      />
    );
  }

  return (
    <main style={styles.page} className="page-enter">
      <NotificationsHeader
        unreadCount={unreadCount}
        onBack={() => router.push(`/${locale}/reels`)}
        t={t}
      />

      <NotificationsFilterBar
        filterType={filterType}
        onFilterChange={setFilterType}
        tabUnreadCounts={tabUnreadCounts}
        unreadCount={unreadCount}
        notifications={notifications}
        clearing={clearing}
        onMarkAllRead={handleMarkAllRead}
        onClearRead={handleClearRead}
        t={t}
      />

      <section style={styles.list}>
        {filteredNotifications.length === 0 ? (
          <NotificationsEmptyState filterType={filterType} t={t} />
        ) : (
          ["today", "yesterday", "earlier"].map((group) =>
            groupedNotifications[group]?.length ? (
              <div key={group} style={styles.group}>
                <div style={styles.groupTitle}>{t(group)}</div>
                {groupedNotifications[group].map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    actorProfiles={actorProfiles}
                    locale={locale}
                    onOpen={handleOpenNotification}
                    onDismiss={handleDismissNotification}
                    t={t}
                  />
                ))}
              </div>
            ) : null
          )
        )}
      </section>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />

      {toast && (
        <div style={styles.toast}>{toast}</div>
      )}
    </main>
  );
}
