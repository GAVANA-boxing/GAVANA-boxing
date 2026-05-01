"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";

function getNotificationText(notification) {
  const actor = notification.actorName || "Someone";

  if (notification.type === "like") {
    return `${actor} liked your reel`;
  }

  if (notification.type === "comment") {
    return `${actor} commented on your reel`;
  }

  if (notification.type === "follow") {
    return `${actor} followed you`;
  }

  return `${actor} sent you a notification`;
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { locale } = useParams();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });

      setNotifications(nextNotifications);
      setLoading(false);

      const unreadDocs = snapshot.docs.filter((notificationDoc) => {
        return notificationDoc.data().read === false;
      });

      unreadDocs.forEach((notificationDoc) => {
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

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => notification.read === false).length;
  }, [notifications]);

  if (authLoading || loading) {
    return (
      <div style={styles.centered}>
        Loading notifications...
      </div>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <button style={styles.backButton} onClick={() => router.push(`/${locale}/reels`)}>
          Back
        </button>
        <div>
          <p style={styles.eyebrow}>GAVANA BOXING</p>
          <h1 style={styles.title}>Notifications</h1>
        </div>
        <div style={styles.unreadPill}>{unreadCount}</div>
      </header>

      <section style={styles.list}>
        {notifications.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>!</div>
            <p style={styles.emptyTitle}>No notifications yet</p>
            <p style={styles.emptyText}>Likes, comments, and follows will appear here.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              style={{
                ...styles.notification,
                ...(notification.read === false ? styles.notificationUnread : {}),
              }}
              onClick={() => {
                if (notification.reelId) {
                  router.push(`/${locale}/reels`);
                } else if (notification.actorId) {
                  router.push(`/${locale}/profile/${notification.actorId}`);
                }
              }}
            >
              <div style={styles.avatar}>
                {(notification.actorName || "U").charAt(0).toUpperCase()}
              </div>
              <div style={styles.notificationBody}>
                <div style={styles.notificationText}>
                  {getNotificationText(notification)}
                </div>
                {notification.text && (
                  <div style={styles.commentPreview}>
                    {notification.text}
                  </div>
                )}
                <div style={styles.date}>{formatDate(notification.createdAt)}</div>
              </div>
            </button>
          ))
        )}
      </section>
    </main>
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
    border: "1px solid rgba(212,175,55,0.28)",
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
  list: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "12px 16px",
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
    width: 56,
    height: 56,
    borderRadius: 28,
    background: "#111",
    color: "#D4AF37",
    border: "1px solid rgba(212,175,55,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: 900,
    marginBottom: 16,
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
    display: "flex",
    gap: 12,
    padding: "14px 0",
    border: "none",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    background: "#0B0B0B",
    color: "#fff",
    textAlign: "left",
    cursor: "pointer",
  },
  notificationUnread: {
    background: "rgba(193,18,31,0.1)",
  },
  avatar: {
    flex: "0 0 40px",
    width: 40,
    height: 40,
    borderRadius: 20,
    background: "#C1121F",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
  },
  notificationBody: {
    minWidth: 0,
    flex: 1,
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
  date: {
    marginTop: 6,
    color: "#666",
    fontSize: 12,
  },
};
