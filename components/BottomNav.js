"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { translate } from "@/lib/i18n";

function NavIcon({ children, active = false }) {
  return (
    <svg
      style={{
        ...styles.icon,
        color: active ? "#C1121F" : "#444",
      }}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function ReelsIcon({ active }) {
  return (
    <NavIcon active={active}>
      <rect x="6" y="4" width="12" height="16" rx="2.2" />
      <path d="M11 9.2 15 12l-4 2.8V9.2Z" />
    </NavIcon>
  );
}

function DiscoverIcon({ active }) {
  return (
    <NavIcon active={active}>
      <circle cx="11" cy="11" r="5" />
      <path d="m16.5 16.5 3.5 3.5" />
    </NavIcon>
  );
}

function CoachIcon({ active }) {
  return (
    <NavIcon active={active}>
      <path d="M5 8.8A4.8 4.8 0 0 1 9.8 4h4.4A4.8 4.8 0 0 1 19 8.8v2.6a4.8 4.8 0 0 1-4.8 4.8H9.4L5 20v-8.6" />
      <path d="M9 10.5h6M9 13.5h3.6" />
    </NavIcon>
  );
}

function AlertsIcon({ active }) {
  return (
    <NavIcon active={active}>
      <path d="M18 10.5V9a6 6 0 0 0-12 0v1.5c0 2.7-1.2 3.8-2.2 5h16.4c-1-1.2-2.2-2.3-2.2-5Z" />
      <path d="M9.7 18.5a2.5 2.5 0 0 0 4.6 0" />
    </NavIcon>
  );
}

function ProfileIcon({ active }) {
  return (
    <NavIcon active={active}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </NavIcon>
  );
}

function UploadIcon() {
  return (
    <svg style={styles.uploadIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function NavTab({ label, active, onClick, children, badge }) {
  return (
    <button type="button" onClick={onClick} style={styles.tab}>
      <span style={styles.iconWrap}>
        {children}
        {badge > 0 && <span style={styles.badge}>{badge > 9 ? "9+" : badge}</span>}
      </span>
      <span style={{ ...styles.label, color: active ? "#C1121F" : "#444" }}>
        {label}
      </span>
      <span style={{ ...styles.indicator, opacity: active ? 1 : 0 }} />
    </button>
  );
}

export default function BottomNav({
  router,
  user,
  currentLocale = "en",
  activeTab,
  onInteractStart,
  onInteractEnd,
}) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const resolvedActiveTab = activeTab || getActiveTab(pathname);
  const t = (key) => translate(currentLocale, key);

  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    let isActive = true;
    const unreadQuery = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      if (isActive) {
        setUnreadCount(snapshot.size);
      }
    }, (error) => {
      if (isActive) {
        console.error("Failed to listen for unread notifications:", error);
        setUnreadCount(0);
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [user?.uid]);

  const goToProfile = () => {
    if (user?.uid) {
      router.push(`/${currentLocale}/profile/${user.uid}`);
      return;
    }

    router.push(`/${currentLocale}/login`);
  };

  return (
    <nav
      style={styles.nav}
      onPointerEnter={onInteractStart}
      onPointerDown={onInteractStart}
      onPointerLeave={onInteractEnd}
      onPointerUp={onInteractEnd}
      onPointerCancel={onInteractEnd}
      aria-label="Primary navigation"
    >
      <NavTab label={t("navReels")} active={resolvedActiveTab === "reels"} onClick={() => router.push(`/${currentLocale}/reels`)}>
        <ReelsIcon active={resolvedActiveTab === "reels"} />
      </NavTab>

      <NavTab label={t("navDiscover")} active={resolvedActiveTab === "discover"} onClick={() => router.push(`/${currentLocale}/discover`)}>
        <DiscoverIcon active={resolvedActiveTab === "discover"} />
      </NavTab>

      <NavTab label={t("navCoach")} active={resolvedActiveTab === "coach"} onClick={() => router.push(`/${currentLocale}/coach`)}>
        <CoachIcon active={resolvedActiveTab === "coach"} />
      </NavTab>

      <button
        type="button"
        onClick={() => router.push(`/${currentLocale}/upload`)}
        style={styles.uploadTab}
        aria-label={t("navUpload")}
      >
        <span style={styles.uploadCircle}>
          <UploadIcon />
        </span>
        <span
          style={{
            ...styles.uploadLabel,
            color: resolvedActiveTab === "upload" ? "#C1121F" : "#444",
          }}
        >
          {t("navUpload")}
        </span>
        <span style={{ ...styles.indicator, opacity: resolvedActiveTab === "upload" ? 1 : 0 }} />
      </button>

      <NavTab
        label={t("navAlerts")}
        active={resolvedActiveTab === "alerts"}
        onClick={() => router.push(`/${currentLocale}/notifications`)}
        badge={unreadCount}
      >
        <AlertsIcon active={resolvedActiveTab === "alerts"} />
      </NavTab>

      <NavTab label={t("navProfile")} active={resolvedActiveTab === "profile"} onClick={goToProfile}>
        <ProfileIcon active={resolvedActiveTab === "profile"} />
      </NavTab>
    </nav>
  );
}

function getActiveTab(pathname = "") {
  if (pathname.includes("/upload")) return "upload";
  if (pathname.includes("/discover")) return "discover";
  if (pathname.includes("/leaderboard")) return "discover";
  if (pathname.includes("/rank")) return "profile";
  if (pathname.includes("/coach")) return "coach";
  if (pathname.includes("/notifications")) return "alerts";
  if (pathname.includes("/profile")) return "profile";
  return "reels";
}

const styles = {
  nav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    minHeight: "calc(64px + env(safe-area-inset-bottom))",
    padding: "8px 10px calc(8px + env(safe-area-inset-bottom))",
    background: "#0B0B0B",
    borderTop: "1px solid #1a1a1a",
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    alignItems: "end",
    boxSizing: "border-box",
  },
  tab: {
    minWidth: 0,
    minHeight: 48,
    border: "none",
    background: "transparent",
    color: "#444",
    display: "grid",
    justifyItems: "center",
    alignContent: "center",
    gap: 4,
    padding: "3px 0 0",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  iconWrap: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
  },
  icon: {
    width: 22,
    height: 22,
    display: "block",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  label: {
    fontSize: 9,
    lineHeight: 1,
    letterSpacing: 0.4,
    fontWeight: 700,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: "#C1121F",
    transition: "opacity 180ms ease",
  },
  uploadTab: {
    minWidth: 0,
    minHeight: 48,
    border: "none",
    background: "transparent",
    color: "#444",
    display: "grid",
    justifyItems: "center",
    alignContent: "center",
    gap: 4,
    padding: "3px 0 0",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  uploadCircle: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#C1121F",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIcon: {
    width: 20,
    height: 20,
    display: "block",
    fill: "none",
    stroke: "#fff",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  uploadLabel: {
    color: "#444",
    fontSize: 9,
    lineHeight: 1,
    letterSpacing: 0.4,
    fontWeight: 700,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -9,
    minWidth: 15,
    height: 15,
    padding: "0 4px",
    borderRadius: 8,
    background: "#C1121F",
    color: "#fff",
    border: "1px solid #0B0B0B",
    fontSize: 9,
    fontWeight: 800,
    lineHeight: "13px",
    textAlign: "center",
    boxSizing: "border-box",
  },
};
