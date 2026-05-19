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
    <svg style={{ ...ic, color: active ? RED : "#3a3a3a" }} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12L12 4l9 8" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function DiscoverIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "#3a3a3a" }} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m17 17 3.5 3.5" />
    </svg>
  );
}

function AlertsIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "#3a3a3a" }} viewBox="0 0 24 24" aria-hidden="true">
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

// ─── Profile avatar tab ───────────────────────────────────────────────────────
function ProfileTab({ user, active, onClick, dmUnread }) {
  const photo = user?.photoURL || user?.profileImageUrl || "";
  const initial = (user?.displayName || user?.username || "?").charAt(0).toUpperCase();

  return (
    <button type="button" onClick={onClick} style={s.iconTab} aria-label="Profile">
      <span style={{ position: "relative", display: "inline-flex" }}>
        <span style={{
          ...s.avatarWrap,
          boxShadow: active ? "0 0 0 2px #C1121F" : "0 0 0 1.5px rgba(255,255,255,0.08)",
        }}>
          {photo
            ? <Image src={photo} alt="Profile photo" width={30} height={30} style={{ objectFit: "cover" }} />
            : <span style={{ ...s.avatarInitial, background: active ? RED : "#222" }}>{initial}</span>
          }
        </span>
        {dmUnread > 0 && (
          <span style={{
            position: "absolute", top: -2, right: -2,
            width: 10, height: 10, borderRadius: "50%",
            background: RED, border: "2px solid rgba(8,8,8,0.97)",
          }} />
        )}
      </span>
    </button>
  );
}

// ─── Icon tab ─────────────────────────────────────────────────────────────────
function IconTab({ active, onClick, badge, children, label }) {
  return (
    <button type="button" onClick={onClick} style={s.iconTab} aria-label={label}>
      <span style={{
        ...s.iconGlow,
        background: active ? `${redAlpha(0.12)}` : "transparent",
        boxShadow: active ? `0 0 16px ${redAlpha(0.18)}` : "none",
      }}>
        {children}
        {badge > 0 && (
          <span style={s.badge}>{badge > 9 ? "9+" : badge}</span>
        )}
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

  const HUB_OPTIONS = [
    { icon: "🎬", label: t("hubReel"), sub: t("hubReelSub"), path: `/${currentLocale}/upload`, accent: RED },
    { icon: "⚡", label: t("hubStory"), sub: t("hubStorySub"), path: `/${currentLocale}/story/upload`, accent: GOLD },
    { icon: "📈", label: t("hubProgress"), sub: t("hubProgressSub"), path: `/${currentLocale}/story/upload?type=progress_update`, accent: "#34D399" },
  ];

  const hubOverlay = (
    <div style={h.overlay}>
      <div style={h.backdrop} onClick={() => setHubOpen(false)} />
      <div style={h.sheet}>
        <div style={h.handle} />
        <p style={h.sheetTitle}>{t("hubCreate")}</p>

        {HUB_OPTIONS.map(opt => (
          <button
            key={opt.label}
            type="button"
            style={h.option}
            onClick={() => { r.push(opt.path); setHubOpen(false); }}
          >
            <div style={{ ...h.optIcon, background: opt.accent + "1a", color: opt.accent }}>
              {opt.icon}
            </div>
            <div style={h.optText}>
              <span style={h.optLabel}>{opt.label}</span>
              <span style={h.optSub}>{opt.sub}</span>
            </div>
            <svg style={h.optArrow} viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        ))}

        {/* Live — Coming Soon */}
        <div style={{ ...h.option, opacity: 0.35, cursor: "not-allowed" }}>
          <div style={{ ...h.optIcon, background: "rgba(255,255,255,0.04)", color: "#888" }}>🔴</div>
          <div style={h.optText}>
            <span style={h.optLabel}>{t("hubLive")}  <span style={h.soonBadge}>{t("hubLiveSoon")}</span></span>
            <span style={h.optSub}>{t("hubLiveSoonSub")}</span>
          </div>
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
        <button type="button" onClick={() => setHubOpen(true)} style={s.plusTab} aria-label={t("navUpload")}>
          <span style={s.plusCircle}>
            <PlusIcon />
          </span>
        </button>

        {/* Alerts */}
        <IconTab active={resolvedActiveTab === "alerts"} onClick={() => r.push(`/${currentLocale}/notifications`)} badge={unreadCount} label="Alerts">
          <AlertsIcon active={resolvedActiveTab === "alerts"} />
        </IconTab>

        {/* Profile */}
        <ProfileTab user={user} active={resolvedActiveTab === "profile"} onClick={goToProfile} dmUnread={dmUnread} />
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
  if (pathname.includes("/inbox")) return "profile";
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
    height: "calc(58px + env(safe-area-inset-bottom))",
    paddingBottom: "env(safe-area-inset-bottom)",
    background: "rgba(8,8,8,0.97)",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
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
    height: 58,
    WebkitTapHighlightColor: "transparent",
    padding: 0,
  },
  iconGlow: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    height: 58,
    WebkitTapHighlightColor: "transparent",
    padding: 0,
  },
  plusCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: RED,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0 4px 16px ${redAlpha(0.4)}`,
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
    background: "linear-gradient(180deg, #181010 0%, #0d0d0d 100%)",
    border: `1px solid ${redAlpha(0.15)}`,
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
  option: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 12px",
    borderRadius: 14,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
  },
  optIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    flexShrink: 0,
  },
  optText: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
  },
  optLabel: {
    fontSize: 16,
    fontWeight: 800,
    color: "#fff",
  },
  optSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
  },
  optArrow: {
    width: 18,
    height: 18,
    fill: "none",
    stroke: "rgba(255,255,255,0.18)",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    flexShrink: 0,
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
