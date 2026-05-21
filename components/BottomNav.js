"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter as useNextRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { translate } from "@/lib/i18n";
import { RED, GOLD , redAlpha, goldAlpha} from "@/lib/tokens";
import Image from "next/image";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function HomeIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.22)" }} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12L12 4l9 8" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function DiscoverIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.22)" }} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m17 17 3.5 3.5" />
    </svg>
  );
}

function AlertsIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.22)" }} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 10.5V9a6 6 0 0 0-12 0v1.5c0 2.7-1.2 3.8-2.2 5h16.4c-1-1.2-2.2-2.3-2.2-5Z" />
      <path d="M9.7 18.5a2.5 2.5 0 0 0 4.6 0" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg style={icPlus} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function InboxIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.22)" }} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ─── Profile avatar tab ───────────────────────────────────────────────────────
function ProfileTab({ user, active, onClick }) {
  const photo = user?.photoURL || user?.profileImageUrl || "";
  const initial = (user?.displayName || user?.username || "U").charAt(0).toUpperCase();
  const [imgError, setImgError] = useState(false);

  return (
    <button type="button" onClick={onClick} style={s.iconTab} aria-label="Profile">
      <span style={{ position: "relative", display: "inline-flex" }}>
        <span style={{
          ...s.avatarWrap,
          boxShadow: active ? `0 0 0 2px ${RED}` : "0 0 0 1.5px rgba(255,255,255,0.08)",
        }}>
          {photo && !imgError
            ? <Image src={photo} alt="Profile photo" width={30} height={30} style={{ objectFit: "cover" }} onError={() => setImgError(true)} />
            : <span style={{ ...s.avatarInitial, background: active ? RED : "#222" }}>{initial}</span>
          }
        </span>
      </span>
    </button>
  );
}

// ─── Icon tab ─────────────────────────────────────────────────────────────────
function IconTab({ active, onClick, badge, children, label }) {
  return (
    <button type="button" onClick={onClick} style={s.iconTab} aria-label={label} className="tap-bounce">
      <span
        key={active ? "active" : "inactive"}
        className={active ? "nav-active-pop" : undefined}
        style={{
          ...s.iconGlow,
          background: active ? `${redAlpha(0.14)}` : "transparent",
          boxShadow: active ? `0 0 22px ${redAlpha(0.28)}, inset 0 0 0 1px ${redAlpha(0.18)}` : "none",
        }}
      >
        <span style={{ transform: active ? "scale(1.08)" : "scale(1)", transition: "transform 260ms cubic-bezier(0.34,1.56,0.64,1)", display: "flex" }}>
          {children}
        </span>
        {badge > 0 && (
          <span style={s.badge}>{badge > 9 ? "9+" : badge}</span>
        )}
        {active && <span className="nav-active-dot" />}
      </span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BottomNav({
  router,
  user,
  currentLocale = "en",
  activeTab,
  onInteractStart,
  onInteractEnd,
}) {
  const pathname = usePathname();
  const nextRouter = useNextRouter();
  const r = router ?? nextRouter;
  const [unreadCount, setUnreadCount] = useState(0);
  const [dmUnread, setDmUnread] = useState(0);
  const [hubOpen, setHubOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const resolvedActiveTab = activeTab || getActiveTab(pathname);
  const t = (key) => translate(currentLocale, key);

  // Unread DM count
  useEffect(() => {
    if (!user?.uid) { setDmUnread(0); return; }
    let active = true;
    const qDm = query(collection(db, "conversations"), where("members", "array-contains", user.uid));
    const unsub = onSnapshot(qDm, (snap) => {
      if (!active) return;
      const total = snap.docs.reduce((sum, d) => sum + (d.data().unreadCount?.[user.uid] || 0), 0);
      setDmUnread(total);
    }, () => { if (active) setDmUnread(0); });
    return () => { active = false; unsub(); };
  }, [user?.uid]);

  // Unread notification count — single-field query + JS filter avoids composite index
  useEffect(() => {
    if (!user?.uid) { setUnreadCount(0); return; }
    let active = true;
    const q = query(collection(db, "notifications"), where("recipientId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      if (!active) return;
      setUnreadCount(snap.docs.filter((d) => d.data().read === false).length);
    }, () => { if (active) setUnreadCount(0); });
    return () => { active = false; unsub(); };
  }, [user?.uid]);

  const goToProfile = () => {
    r.push(user?.uid ? `/${currentLocale}/profile/${user.uid}` : `/${currentLocale}/login`);
  };

  const goToInbox = () => {
    r.push(user?.uid ? `/${currentLocale}/inbox` : `/${currentLocale}/login`);
  };

  const HUB_OPTIONS = [
    { icon: "🎬", label: t("hubReel"), sub: t("hubReelSub"), path: `/${currentLocale}/upload`, accent: RED },
    { icon: "⚡", label: t("hubStory"), sub: t("hubStorySub"), path: `/${currentLocale}/story/upload`, accent: GOLD },
    { icon: "📈", label: t("hubProgress"), sub: t("hubProgressSub"), path: `/${currentLocale}/story/upload?type=progress_update`, accent: "#34D399" },
    { icon: "📅", label: currentLocale === "mn" ? "Арга хэмжээ" : currentLocale === "ko" ? "이벤트" : "Events", sub: currentLocale === "mn" ? "Ойрын тэмцээн, арга хэмжээ" : currentLocale === "ko" ? "다가오는 이벤트 보기" : "View upcoming events", path: `/${currentLocale}/events`, accent: GOLD },
  ];

  const hubOverlay = (
    <div style={h.overlay}>
      <div style={h.backdrop} onClick={() => setHubOpen(false)} />
      <div style={h.sheet}>
        <div style={h.handle} />
        <p style={h.sheetTitle}>{t("hubCreate")}</p>

        <div style={h.grid}>
          {HUB_OPTIONS.map(opt => (
            <button
              key={opt.label}
              type="button"
              style={h.gridCard}
              onClick={() => { r.push(opt.path); setHubOpen(false); }}
            >
              <div style={{ ...h.gridIcon, background: opt.accent + "22", color: opt.accent }}>
                {opt.icon}
              </div>
              <span style={h.gridLabel}>{opt.label}</span>
              <span style={h.gridSub}>{opt.sub}</span>
            </button>
          ))}
        </div>

        <button type="button" style={h.cancelBtn} onClick={() => setHubOpen(false)}>
          {t("cancel")}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {mounted && hubOpen && createPortal(hubOverlay, document.body)}

      <nav
        className="app-bottom-nav"
        style={s.nav}
        onPointerEnter={onInteractStart}
        onPointerDown={onInteractStart}
        onPointerLeave={onInteractEnd}
        onPointerUp={onInteractEnd}
        onPointerCancel={onInteractEnd}
        aria-label="Primary navigation"
      >
        {/* Home */}
        <IconTab active={resolvedActiveTab === "reels"} onClick={() => r.push(`/${currentLocale}/reels`)} label="Home">
          <HomeIcon active={resolvedActiveTab === "reels"} />
        </IconTab>

        {/* Discover */}
        <IconTab active={resolvedActiveTab === "discover"} onClick={() => r.push(`/${currentLocale}/discover`)} label="Discover">
          <DiscoverIcon active={resolvedActiveTab === "discover"} />
        </IconTab>

        {/* Upload + */}
        <button type="button" onClick={() => setHubOpen(true)} style={s.plusTab} aria-label={t("navUpload")} className="tap-bounce">
          <span style={s.plusCircle} className="plus-ambient">
            <PlusIcon />
          </span>
        </button>

        {/* Alerts */}
        <IconTab active={resolvedActiveTab === "alerts"} onClick={() => r.push(`/${currentLocale}/notifications`)} badge={unreadCount} label="Alerts">
          <AlertsIcon active={resolvedActiveTab === "alerts"} />
        </IconTab>

        {/* Inbox */}
        <IconTab active={resolvedActiveTab === "inbox"} onClick={goToInbox} badge={dmUnread} label="Inbox">
          <InboxIcon active={resolvedActiveTab === "inbox"} />
        </IconTab>

        {/* Profile */}
        <ProfileTab user={user} active={resolvedActiveTab === "profile"} onClick={goToProfile} />
      </nav>
    </>
  );
}

function getActiveTab(pathname = "") {
  if (pathname.includes("/upload")) return "upload";
  if (pathname.includes("/discover")) return "discover";
  if (pathname.includes("/leaderboard")) return "discover";
  if (pathname.includes("/fighters")) return "discover";
  if (pathname.includes("/rank")) return "profile";
  if (pathname.includes("/coach")) return "profile";
  if (pathname.includes("/gyms")) return "profile";
  if (pathname.includes("/notifications")) return "alerts";
  if (pathname.includes("/inbox")) return "inbox";
  if (pathname.includes("/sparring")) return "discover";
  if (pathname.includes("/profile")) return "profile";
  return "reels";
}

// ─── Shared icon style ────────────────────────────────────────────────────────
const ic = {
  width: 24,
  height: 24,
  display: "block",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  transition: "color 160ms ease",
};

const icPlus = {
  width: 22,
  height: 22,
  display: "block",
  fill: "none",
  stroke: "#fff",
  strokeWidth: 2.2,
  strokeLinecap: "round",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  nav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    height: "calc(68px + env(safe-area-inset-bottom))",
    paddingBottom: "env(safe-area-inset-bottom)",
    background: "rgba(11,11,12,0.78)",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    boxShadow: "0 -1px 0 rgba(255,255,255,0.04), 0 -24px 48px rgba(0,0,0,0.22)",
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    alignItems: "center",
    boxSizing: "border-box",
  },
  iconTab: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 68,
    WebkitTapHighlightColor: "transparent",
    padding: 0,
  },
  iconGlow: {
    width: 42,
    height: 42,
    borderRadius: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transition: "background 200ms ease, box-shadow 200ms ease",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 14,
    height: 14,
    padding: "0 3px",
    borderRadius: 7,
    background: RED,
    color: "#fff",
    border: "1.5px solid rgba(8,8,8,0.97)",
    fontSize: 8,
    fontWeight: 900,
    lineHeight: "11px",
    textAlign: "center",
    boxSizing: "border-box",
  },
  // Plus tab
  plusTab: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 68,
    WebkitTapHighlightColor: "transparent",
    padding: 0,
  },
  plusCircle: {
    width: 46,
    height: 46,
    borderRadius: 15,
    background: `linear-gradient(145deg, ${RED}, #cc2820)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0 6px 20px ${redAlpha(0.42)}, inset 0 1px 0 rgba(255,255,255,0.14)`,
    border: "1px solid rgba(255,255,255,0.1)",
  },
  // Profile avatar
  avatarWrap: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "box-shadow 200ms ease",
    flexShrink: 0,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  avatarInitial: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
    color: "#fff",
  },
};

const h = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 999,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  sheet: {
    position: "relative",
    width: "100%",
    maxWidth: 520,
    background: "#141416",
    border: "1px solid rgba(255,255,255,0.08)",
    borderBottom: "none",
    borderRadius: "24px 24px 0 0",
    padding: "12px 20px calc(20px + env(safe-area-inset-bottom))",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    boxShadow: "0 -20px 60px rgba(0,0,0,0.8)",
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    background: "rgba(255,255,255,0.12)",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    margin: "0 0 8px",
    fontSize: 11,
    fontWeight: 900,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    letterSpacing: 2,
    paddingLeft: 4,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 4,
  },
  gridCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "18px 12px 14px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.035)",
    cursor: "pointer",
    textAlign: "center",
    transition: "border-color 150ms ease",
  },
  gridIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    flexShrink: 0,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1.2,
  },
  gridSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    lineHeight: 1.35,
  },
  soonBadge: {
    fontSize: 8,
    fontWeight: 900,
    color: GOLD,
    background: `${goldAlpha(0.1)}`,
    border: `1px solid ${goldAlpha(0.25)}`,
    borderRadius: 999,
    padding: "1px 6px",
    letterSpacing: 1,
    marginLeft: 6,
  },
  cancelBtn: {
    marginTop: 8,
    width: "100%",
    padding: "14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
};
