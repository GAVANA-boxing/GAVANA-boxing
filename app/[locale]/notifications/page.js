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
  if (type === "pvp_challenge") return t("pvpNotifType");
  if (type === "challenge_attempt") return t("notifTypeChallengeAttempt");
  if (type === "remix") return t("notifTypeRemix");
  if (type === "featured") return t("notifTypeFeatured");
  if (type === "new_follower") return t("newFollower");
  if (type === "challenge_beaten") return t("challengeBeaten");
  if (type === "coach_request") return t("notifLabelCoachRequest");
  if (type === "gym_join_request") return t("notifLabelGymJoinRequest");
  if (type === "coach_accept") return t("notifLabelCoachAccept");
  if (type === "coach_decline") return t("notifLabelCoachDecline");
  if (type === "gym_approved") return t("notifLabelGymApproved");
  if (type === "gym_declined") return t("notifLabelGymDeclined");
  if (type === "booking_scheduled") return t("notifLabelBookingScheduled");
  if (type === "session_completed") return t("notifLabelSessionCompleted");
  return t("update");
}

function getTranslatedNotificationText(notification, t) {
  const actor = getActorName(notification);

  if (notification.type === "pvp_challenge") {
    const key = notification.result === "win" ? "pvpNotifBeat" : "pvpNotifFailed";
    return t(key).replace("{actor}", actor);
  }
  if (notification.type === "challenge_attempt") return t("notifChallengeAttempt").replace("{actor}", actor);
  if (notification.type === "remix") return t("notifRemix").replace("{actor}", actor);
  if (notification.type === "featured") return t("notifFeatured");
  if (notification.type === "new_follower") return t("newFollowerLabel").replace("{actor}", actor);
  if (notification.type === "challenge_beaten") return t("challengeBeatenLabel").replace("{actor}", actor);
  if (notification.type === "coach_request") return t("notifCoachRequest").replace("{actor}", actor);
  if (notification.type === "gym_join_request") return t("notifGymJoinRequest").replace("{actor}", actor);
  if (notification.type === "coach_accept") return t("notifCoachAccepted");
  if (notification.type === "coach_decline") return t("notifCoachDeclined");
  if (notification.type === "gym_approved") return t("notifGymApproved");
  if (notification.type === "gym_declined") return t("notifGymDeclined");
  if (notification.type === "booking_scheduled") return t("sessionScheduled");
  if (notification.type === "session_completed") return t("coachSessionCompleted");

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
  if (type === "pvp_challenge") return "⚔️";
  if (type === "challenge_attempt") return "🥊";
  if (type === "remix") return "🔀";
  if (type === "featured") return "⭐";
  if (type === "new_follower") return "👤";
  if (type === "challenge_beaten") return "🏅";
  if (type === "coach_request") return "🥊";
  if (type === "gym_join_request") return "🏋️";
  if (type === "coach_accept") return "✅";
  if (type === "coach_decline") return "❌";
  if (type === "gym_approved") return "✅";
  if (type === "gym_declined") return "❌";
  if (type === "booking_scheduled") return "📅";
  if (type === "session_completed") return "🏆";
  return "•";
}

function getTimestampMs(timestamp) {
  if (!timestamp) return 0;
  if (timestamp.toMillis) return timestamp.toMillis();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatRelativeTime(timestamp) {
  const time = getTimestampMs(timestamp);
  if (!time) return "";

  const diffSeconds = Math.max(1, Math.floor((Date.now() - time) / 1000));
  if (diffSeconds < 60) return "now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d`;

  const d = new Date(time);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

    if (notification.type === "follow" || notification.type === "new_follower") {
      const actorId = getActorId(notification);
      if (actorId) router.push(`/${locale}/profile/${actorId}`);
      return;
    }

    if (notification.type === "pvp_challenge") {
      if (notification.reelId) {
        router.push(`/${locale}/reels?reelId=${encodeURIComponent(notification.reelId)}&source=pvp`);
      } else {
        const actorId = getActorId(notification);
        if (actorId) router.push(`/${locale}/profile/${actorId}`);
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
                        background: notification.read === false
                          ? "linear-gradient(90deg, rgba(193,18,31,0.12) 0%, rgba(12,10,10,0.96) 50%)"
                          : "rgba(255,255,255,0.025)",
                      }}
                      onClick={() => handleOpenNotification(notification)}
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
                            boxShadow: "0 0 0 2px rgba(193,18,31,0.5), 0 0 16px rgba(193,18,31,0.2)",
                          } : {}),
                        }}>
                          {actorPhoto
                            ? <img src={actorPhoto} alt="" style={styles.avatarImage} />
                            : actor.charAt(0).toUpperCase()}
                        </div>
                        <span style={styles.typeBadge}>{typeIcon}</span>
                      </div>
                      {/* Body */}
                      <div style={styles.notificationBody}>
                        <div style={styles.notificationTopLine}>
                          <span style={styles.username}>{actor}</span>
                          <span style={styles.date}>{formatRelativeTime(notification.createdAt)}</span>
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
                            <span style={{ color: "#D4AF37", fontWeight: 900 }}>
                              {Number(notification.opponentScore ?? 0).toFixed(1)}/10
                            </span>
                          </div>
                        )}
                        {notification.text && (
                          <div style={styles.commentPreview}>{notification.text}</div>
                        )}
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
    background: "radial-gradient(ellipse at top center, rgba(193,18,31,0.06) 0%, transparent 50%), linear-gradient(180deg, #070707 0%, #0a0a0a 100%)",
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
    gridTemplateColumns: "56px 1fr 44px",
    alignItems: "center",
    gap: 12,
    padding: "calc(env(safe-area-inset-top) + 14px) 16px 14px",
    background: "rgba(7,7,7,0.94)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  backButton: {
    border: "none",
    background: "rgba(255,255,255,0.07)",
    color: "rgba(255,255,255,0.7)",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  eyebrow: {
    margin: 0,
    color: "rgba(212,175,55,0.6)",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 2,
    textAlign: "center",
    textTransform: "uppercase",
  },
  title: {
    margin: "3px 0 0",
    textAlign: "center",
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: "-0.02em",
  },
  unreadPill: {
    justifySelf: "end",
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    background: "#C1121F",
    boxShadow: "0 0 12px rgba(193,18,31,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 900,
  },
  unreadPillMuted: {
    justifySelf: "end",
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    background: "rgba(255,255,255,0.06)",
    color: "#555",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 800,
  },
  list: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "12px 16px",
  },
  group: {
    display: "grid",
    gap: 6,
    marginBottom: 28,
  },
  groupTitle: {
    color: "rgba(212,175,55,0.55)",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase",
    padding: "6px 2px 8px",
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
    width: 54,
    height: 54,
    borderRadius: 27,
    background: "rgba(193,18,31,0.08)",
    color: "rgba(212,175,55,0.7)",
    border: "1px solid rgba(212,175,55,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    boxShadow: "0 0 32px rgba(193,18,31,0.1)",
  },
  emptyTitle: {
    margin: 0,
    color: "#fff",
    fontSize: 17,
    fontWeight: 800,
  },
  emptyText: {
    margin: "8px 0 0",
    maxWidth: 260,
    lineHeight: 1.55,
    fontSize: 13,
    color: "#555",
  },
  notification: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 13,
    padding: "13px 14px",
    border: "none",
    borderRadius: 16,
    color: "#fff",
    textAlign: "left",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    transition: "background 200ms ease",
  },
  unreadBar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 3,
    bottom: 0,
    background: "linear-gradient(180deg, #C1121F, rgba(193,18,31,0.4))",
    borderRadius: "3px 0 0 3px",
  },
  avatarWrap: {
    position: "relative",
    flexShrink: 0,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: "50%",
    background: "#1a1a1a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 17,
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  typeBadge: {
    position: "absolute",
    bottom: -2,
    right: -4,
    width: 19,
    height: 19,
    borderRadius: "50%",
    background: "#0d0d0d",
    border: "1.5px solid #1a1a1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    lineHeight: 1,
  },
  notificationBody: {
    minWidth: 0,
    flex: 1,
  },
  notificationTopLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 3,
  },
  username: {
    fontSize: 13,
    fontWeight: 800,
    color: "#fff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "65%",
  },
  date: {
    color: "#444",
    fontSize: 10,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  notificationText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.4,
  },
  commentPreview: {
    marginTop: 5,
    color: "#555",
    fontSize: 12,
    lineHeight: 1.4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontStyle: "italic",
  },
  pvpScoreRow: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 700,
    color: "#aaa",
  },
};


