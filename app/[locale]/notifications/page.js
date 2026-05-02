"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocale, translate } from "@/lib/i18n";

function getActorName(notification) {
  return notification.fromUsername || notification.actorName || "Someone";
}

function getActorId(notification) {
  return notification.fromUserId || notification.actorId;
}

function getActorPhoto(notification, actorProfile) {
  return (
    notification.fromUserPhotoURL ||
    notification.actorPhotoURL ||
    actorProfile?.photoURL ||
    actorProfile?.profileImageUrl ||
    actorProfile?.profileImage ||
    actorProfile?.avatarUrl ||
    ""
  );
}

function getTypeLabel(type, t) {
  if (type === "like") return t("like");
  if (type === "comment") return t("comment");
  if (type === "follow") return t("follow");
  if (type === "save") return t("save");
  return t("update");
}

function getTranslatedNotificationText(notification, t) {
  const actor = getActorName(notification);
  const keyByType = {
    like: "notificationLike",
    comment: "notificationComment",
    follow: "notificationFollow",
    save: "notificationSave",
  };

  return t(keyByType[notification.type] || "notificationDefault").replace("{actor}", actor);
}

function getTypeIcon(type) {
  if (type === "like") return "❤";
  if (type === "comment") return "💬";
  if (type === "follow") return "👤";
  if (type === "save") return "🔖";
  return "•";
}

function getTimestampMs(timestamp) {
  if (!timestamp) return 0;
  if (timestamp.toMillis) return timestamp.toMillis();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatRelativeTime(timestamp, t) {
  const time = getTimestampMs(timestamp);
  if (!time) return "";

  const diffSeconds = Math.max(1, Math.floor((Date.now() - time) / 1000));
  if (diffSeconds < 60) return t("timeSecondsAgo").replace("{n}", diffSeconds);

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return t("timeMinutesAgo").replace("{n}", diffMinutes);

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return t("timeHoursAgo").replace("{n}", diffHours);

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return t("timeDaysAgo").replace("{n}", diffDays);

  return new Date(time).toLocaleDateString();
}

function getTimeGroup(timestamp) {
  const time = getTimestampMs(timestamp);
  if (!time) return "earlier";

  const date = new Date(time);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "today";
  if (date.toDateString() === yesterday.toDateString()) return "yesterday";
  return "earlier";
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actorProfiles, setActorProfiles] = useState({});
  const actorProfileRequests = useRef(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid)
    );
    let isActive = true;

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      if (!isActive) return;

      const nextNotifications = snapshot.docs
        .map((notificationDoc) => ({
          id: notificationDoc.id,
          ...notificationDoc.data(),
        }))
        .sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));

      setNotifications(nextNotifications);
      setLoading(false);

      snapshot.docs
        .filter((notificationDoc) => notificationDoc.data().read === false)
        .forEach((notificationDoc) => {
          updateDoc(doc(db, "notifications", notificationDoc.id), { read: true }).catch((error) => {
            console.error("Failed to mark notification as read:", error);
          });
        });
    }, (error) => {
      if (!isActive) return;
      console.error("Failed to listen for notifications:", error);
      setNotifications([]);
      setLoading(false);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [authLoading, user?.uid]);

  useEffect(() => {
    if (!notifications.length) return;

    let isActive = true;
    const missingActorIds = [...new Set(
      notifications
        .filter((notification) => !notification.fromUserPhotoURL && !notification.actorPhotoURL)
        .map((notification) => getActorId(notification))
        .filter((actorId) => actorId && !actorProfiles[actorId] && !actorProfileRequests.current.has(actorId))
    )];

    if (!missingActorIds.length) return;

    async function loadMissingActorProfiles() {
      await Promise.all(missingActorIds.map(async (actorId) => {
        actorProfileRequests.current.add(actorId);

        try {
          const actorSnap = await getDoc(doc(db, "users", actorId));
          const actorData = actorSnap.exists() ? actorSnap.data() : {};

          if (!isActive) return;

          setActorProfiles((prev) => ({
            ...prev,
            [actorId]: {
              photoURL: actorData.photoURL || "",
              profileImageUrl: actorData.profileImageUrl || "",
              profileImage: actorData.profileImage || "",
              avatarUrl: actorData.avatarUrl || "",
            },
          }));
        } catch (error) {
          console.error("Failed to load notification actor profile:", error);

          if (!isActive) return;

          setActorProfiles((prev) => ({
            ...prev,
            [actorId]: {},
          }));
        }
      }));
    }

    loadMissingActorProfiles();

    return () => {
      isActive = false;
    };
  }, [notifications, actorProfiles]);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => notification.read === false).length;
  }, [notifications]);

  const groupedNotifications = useMemo(() => {
    return notifications.reduce((groups, notification) => {
      const group = getTimeGroup(notification.createdAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(notification);
      return groups;
    }, {});
  }, [notifications]);

  const handleOpenNotification = async (notification) => {
    if (notification.read === false) {
      updateDoc(doc(db, "notifications", notification.id), { read: true }).catch((error) => {
        console.error("Failed to mark notification as read:", error);
      });
    }

    if (notification.type === "follow") {
      const actorId = getActorId(notification);
      if (actorId) router.push(`/${locale}/profile/${actorId}`);
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
      <div style={styles.centered}>
        {t("loading")}
      </div>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <button style={styles.backButton} onClick={() => router.push(`/${locale}/reels`)}>
          {t("back")}
        </button>
        <div>
          <p style={styles.eyebrow}>GAVANA BOXING</p>
          <h1 style={styles.title}>{t("notifications")}</h1>
        </div>
        <div style={unreadCount > 0 ? styles.unreadPill : styles.unreadPillMuted}>
          {unreadCount}
        </div>
      </header>

      <section style={styles.list}>
        {notifications.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              <BoxingGloveIcon />
            </div>
            <p style={styles.emptyTitle}>{t("noNotificationsYet")}</p>
            <p style={styles.emptyText}>{t("notificationsEmptyHelp")}</p>
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
                    <button
                      key={notification.id}
                      style={{
                        ...styles.notification,
                        ...(notification.read === false ? styles.notificationUnread : {}),
                      }}
                      onClick={() => handleOpenNotification(notification)}
                    >
                      <div
                        style={{
                          ...styles.unreadRail,
                          opacity: notification.read === false ? 0.92 : 0,
                        }}
                      />
                      <div style={styles.avatar}>
                        {actorPhoto ? (
                          <img src={actorPhoto} alt="" style={styles.avatarImage} />
                        ) : (
                          actor.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div style={styles.notificationBody}>
                        <div style={styles.notificationTopLine}>
                          <span style={styles.username}>@{actor}</span>
                          <span style={styles.typePill}>{typeIcon} {getTypeLabel(notification.type, t)}</span>
                        </div>
                        <div style={styles.notificationText}>
                          {getTranslatedNotificationText(notification, t)}
                        </div>
                        {notification.text && (
                          <div style={styles.commentPreview}>
                            {notification.text}
                          </div>
                        )}
                      </div>
                      <div style={styles.meta}>
                        <span style={styles.date}>{formatRelativeTime(notification.createdAt, t)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null
          ))
        )}
      </section>
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

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #070707 0%, #0B0B0B 100%)",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    paddingBottom: 32,
  },
  centered: {
    minHeight: "100vh",
    background: "#070707",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "grid",
    gridTemplateColumns: "64px 1fr 44px",
    alignItems: "center",
    gap: 12,
    padding: "18px 16px",
    background: "rgba(7,7,7,0.92)",
    backdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(212,175,55,0.18)",
  },
  backButton: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(212,175,55,0.28)",
    background: "transparent",
    color: "#fff",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
  },
  eyebrow: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  title: {
    margin: "4px 0 0",
    textAlign: "center",
    fontSize: 30,
    fontWeight: 950,
  },
  unreadPill: {
    justifySelf: "end",
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    background: "#C1121F",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
  },
  unreadPillMuted: {
    justifySelf: "end",
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    background: "rgba(255,255,255,0.08)",
    color: "#aaa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
  },
  list: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "16px",
  },
  group: {
    display: "grid",
    gap: 10,
    marginBottom: 22,
  },
  groupTitle: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    padding: "4px 2px",
  },
  empty: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#888",
    textAlign: "center",
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    background: "#111",
    color: "#D4AF37",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(212,175,55,0.28)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    boxShadow: "0 18px 44px rgba(0,0,0,0.28)",
  },
  emptyTitle: {
    margin: 0,
    color: "#fff",
    fontSize: 18,
    fontWeight: 800,
  },
  emptyText: {
    margin: "8px 0 0",
    maxWidth: 280,
    lineHeight: 1.5,
  },
  notification: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "4px 46px minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 12,
    padding: "14px 14px 14px 0",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    background: "rgba(11,11,11,0.96)",
    color: "#fff",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 12px 32px rgba(0,0,0,0.22)",
    position: "relative",
    overflow: "hidden",
  },
  notificationUnread: {
    background: "linear-gradient(90deg, rgba(193,18,31,0.14), rgba(11,11,11,0.98) 34%)",
    borderColor: "rgba(193,18,31,0.26)",
  },
  unreadRail: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: "0 4px 4px 0",
    background: "#C1121F",
    opacity: 0.92,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    background: "linear-gradient(145deg, #C1121F, #6d0a12)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    boxShadow: "0 0 24px rgba(193,18,31,0.22)",
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  notificationBody: {
    minWidth: 0,
    flex: 1,
  },
  notificationTopLine: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  username: {
    fontSize: 13,
    fontWeight: 900,
    color: "#fff",
  },
  typePill: {
    borderRadius: 999,
    background: "rgba(255,255,255,0.055)",
    color: "#D4AF37",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(212,175,55,0.16)",
    padding: "2px 7px",
    fontSize: 10,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  notificationText: {
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  commentPreview: {
    marginTop: 6,
    color: "#aaa",
    fontSize: 14,
    lineHeight: 1.4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  meta: {
    display: "grid",
    justifyItems: "end",
    alignSelf: "stretch",
    alignContent: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    background: "#C1121F",
    boxShadow: "0 0 14px rgba(193,18,31,0.7)",
  },
  date: {
    color: "#777",
    fontSize: 12,
    whiteSpace: "nowrap",
  },
};


