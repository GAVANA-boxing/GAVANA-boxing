"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter as useNextRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RED, RED_DARK, redAlpha, RADIUS, MOTION , blackAlpha} from "@/lib/tokens";
import Image from "next/image";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function HomeIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.38)" }} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" /><path d="m17 17 3.5 3.5" />
    </svg>
  );
}

function ReelIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.38)" }} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="4" />
      <path d="m10 8 6 4-6 4V8Z" fill="currentColor" strokeWidth="0" />
    </svg>
  );
}

function RankIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.38)" }} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function TrainIcon() {
  return (
    <svg style={{ width: 20, height: 20, display: "block", fill: "#fff", strokeWidth: 0 }} viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: "block" }}>
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
    </svg>
  );
}

// ─── Combat OS Sheet ──────────────────────────────────────────────────────────
const COMBAT_OS_ITEMS = [
  { key: "coach",      emoji: "🥊", labelEn: "AI Coach",   labelMn: "AI Дасгалжуулагч", path: "/coach" },
  { key: "sparring",   emoji: "⚡",  labelEn: "Sparring",   labelMn: "Спарринг",          path: "/sparring" },
  { key: "fighters",   emoji: "👊",  labelEn: "Fighters",   labelMn: "Тамирчид",          path: "/fighters" },
  { key: "gyms",       emoji: "🏟",  labelEn: "Gyms",       labelMn: "Заалнууд",          path: "/gyms" },
  { key: "challenges", emoji: "🎯",  labelEn: "Challenges", labelMn: "Даалгаврууд",       path: "/challenges" },
  { key: "inbox",      emoji: "💬",  labelEn: "Inbox",      labelMn: "Мессэж",            path: "/inbox" },
  { key: "upload",     emoji: "📹",  labelEn: "Upload",     labelMn: "Видео оруулах",     path: "/upload" },
];

function CombatOSSheet({ onClose, router, locale }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: blackAlpha(0.72),
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(100%, 480px)",
          borderRadius: "24px 24px 0 0",
          background: "linear-gradient(180deg, #161618 0%, #0f0f10 100%)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderBottom: "none",
          boxShadow: `0 -24px 60px ${blackAlpha(0.55)}`,
          padding: `16px 20px calc(24px + env(safe-area-inset-bottom))`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.16)", margin: "0 auto 16px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
            Combat OS
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer", padding: 4, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {COMBAT_OS_ITEMS.map((item) => (
            <button
              key={item.key}
              className="tap-bounce"
              onClick={() => { onClose(); router.push(`/${locale}${item.path}`); }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                cursor: "pointer", color: "#fff",
                textAlign: "left",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{item.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>
                {locale === "mn" ? item.labelMn : item.labelEn}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Profile tab ──────────────────────────────────────────────────────────────
function ProfileTab({ user, active, onClick, badge, locale }) {
  const photo = user?.photoURL || user?.profileImageUrl || "";
  const initial = (user?.displayName || user?.username || "U").charAt(0).toUpperCase();
  const [imgError, setImgError] = useState(false);
  const label = locale === "mn" ? "Профайл" : locale === "ko" ? "프로필" : "Profile";

  return (
    <button type="button" onClick={onClick} style={s.iconTab} aria-label={label} className="tap-bounce">
      <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative" }}>
        <span style={{ position: "relative", display: "inline-flex" }}>
          <span style={{
            ...s.avatarWrap,
            boxShadow: active ? `0 0 0 2px ${RED}` : "0 0 0 1.5px rgba(255,255,255,0.08)",
          }}>
            {photo && !imgError
              ? <Image src={photo} alt="Profile" width={28} height={28} style={{ objectFit: "cover" }} onError={() => setImgError(true)} />
              : <span style={{ ...s.avatarInitial, background: active ? RED : "rgba(255,255,255,0.08)" }}>{initial}</span>
            }
          </span>
          {badge > 0 && (
            <span style={{ ...s.badge, top: -3, right: -3 }}>{badge > 9 ? "9+" : badge}</span>
          )}
        </span>
        <span style={{ ...s.tabLabel, color: active ? "#fff" : "rgba(255,255,255,0.32)" }}>{label}</span>
      </span>
    </button>
  );
}

// ─── Standard icon tab ────────────────────────────────────────────────────────
function IconTab({ active, onClick, children, label }) {
  return (
    <button type="button" onClick={onClick} style={s.iconTab} aria-label={label} className="tap-bounce">
      <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span
          key={active ? "a" : "i"}
          className={active ? "nav-active-pop" : undefined}
          style={{
            ...s.iconGlow,
            background: active ? redAlpha(0.11) : "transparent",
          }}
        >
          <span style={{ transform: active ? "scale(1.06)" : "scale(1)", transition: "transform 220ms cubic-bezier(0.34,1.56,0.64,1)", display: "flex" }}>
            {children}
          </span>
        </span>
        <span style={{ ...s.tabLabel, color: active ? RED : "rgba(255,255,255,0.32)" }}>{label}</span>
      </span>
    </button>
  );
}

// ─── Center Train tab ─────────────────────────────────────────────────────────
function TrainTab({ onClick, active, locale }) {
  const label = locale === "mn" ? "Дасгал" : locale === "ko" ? "훈련" : "Train";
  return (
    <button type="button" onClick={onClick} style={s.trainTab} aria-label={label} className="tap-bounce btn-press">
      <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span style={{
          ...s.trainCircle,
          boxShadow: active
            ? `0 4px 24px ${redAlpha(0.6)}, inset 0 1px 0 rgba(255,255,255,0.18)`
            : `0 4px 16px ${redAlpha(0.32)}, inset 0 1px 0 rgba(255,255,255,0.12)`,
        }}
          className="plus-ambient"
        >
          <TrainIcon />
        </span>
        <span style={{ ...s.tabLabel, color: active ? "#fff" : "rgba(255,255,255,0.5)" }}>{label}</span>
      </span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BottomNav({ router, user, currentLocale = "en", activeTab, onInteractStart, onInteractEnd }) {
  const pathname = usePathname();
  const nextRouter = useNextRouter();
  const r = router ?? nextRouter;
  const locale = currentLocale;

  const [unreadCount, setUnreadCount] = useState(0);
  const [dmUnread, setDmUnread] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [combatOSOpen, setCombatOSOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const resolvedActiveTab = activeTab || getActiveTab(pathname);

  // Unread DMs
  useEffect(() => {
    if (!user?.uid) { setDmUnread(0); return; }
    let active = true;
    const q = query(collection(db, "conversations"), where("members", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      if (!active) return;
      setDmUnread(snap.docs.reduce((sum, d) => sum + (d.data().unreadCount?.[user.uid] || 0), 0));
    }, () => { if (active) setDmUnread(0); });
    return () => { active = false; unsub(); };
  }, [user?.uid]);

  // Unread notifications
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

  const goToProfile = () => r.push(user?.uid ? `/${locale}/profile/${user.uid}` : `/${locale}/login`);

  const homeLabel  = locale === "mn" ? "Нүүр"   : locale === "ko" ? "홈"   : "Home";
  const reelsLabel = locale === "mn" ? "Видео"   : locale === "ko" ? "릴"   : "Reels";
  const rankLabel  = locale === "mn" ? "Rank"    : locale === "ko" ? "랭크" : "Rank";

  if (!mounted) return null;

  return (
    <>
      {/* Combat OS floating trigger */}
      <button
        className="tap-bounce"
        aria-label="More"
        onClick={() => setCombatOSOpen(true)}
        style={s.combatOSBtn}
      >
        <GridIcon />
        <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase" }}>More</span>
      </button>

      {/* Combat OS sheet */}
      {combatOSOpen && (
        <CombatOSSheet onClose={() => setCombatOSOpen(false)} router={r} locale={locale} />
      )}

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
        <IconTab active={resolvedActiveTab === "home"} onClick={() => r.push(`/${locale}/discover`)} label={homeLabel}>
          <HomeIcon active={resolvedActiveTab === "home"} />
        </IconTab>

        {/* Reels */}
        <IconTab active={resolvedActiveTab === "reels"} onClick={() => r.push(`/${locale}/reels`)} label={reelsLabel}>
          <ReelIcon active={resolvedActiveTab === "reels"} />
        </IconTab>

        {/* Train — center action */}
        <TrainTab active={resolvedActiveTab === "train"} onClick={() => r.push(`/${locale}/train`)} locale={locale} />

        {/* Rank */}
        <IconTab active={resolvedActiveTab === "rank"} onClick={() => r.push(`/${locale}/rank`)} label={rankLabel}>
          <RankIcon active={resolvedActiveTab === "rank"} />
        </IconTab>

        {/* Profile — carries notification badge */}
        <ProfileTab
          user={user}
          active={resolvedActiveTab === "profile"}
          onClick={goToProfile}
          badge={unreadCount + dmUnread}
          locale={locale}
        />
      </nav>
    </>
  );
}

// ─── Active tab resolver ──────────────────────────────────────────────────────
function getActiveTab(pathname = "") {
  if (pathname.includes("/reels") || pathname.includes("/ai-analysis")) return "reels";
  if (
    pathname.includes("/train") ||
    pathname.includes("/coach") ||
    pathname.includes("/sparring") ||
    pathname.includes("/challenges")
  ) return "train";
  if (pathname.includes("/rank") || pathname.includes("/leaderboard")) return "rank";
  if (
    pathname.includes("/profile") ||
    pathname.includes("/inbox") ||
    pathname.includes("/notifications")
  ) return "profile";
  return "home";
}

// ─── Shared icon style ────────────────────────────────────────────────────────
const ic = {
  width: 22,
  height: 22,
  display: "block",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  transition: "color 160ms ease",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  combatOSBtn: {
    position: "fixed",
    bottom: "calc(88px + env(safe-area-inset-bottom))",
    right: 18,
    zIndex: 99,
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 13px",
    borderRadius: RADIUS.full,
    background: "rgba(18,18,20,0.88)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.75)",
    boxShadow: `0 4px 20px ${blackAlpha(0.45)}`,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  nav: {
    position: "fixed",
    bottom: "calc(10px + env(safe-area-inset-bottom))",
    left: "50%",
    transform: "translateX(-50%)",
    width: "min(calc(100vw - 28px), 400px)",
    height: 68,
    zIndex: 100,
    background: "rgba(7,7,8,0.82)",
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    borderRadius: RADIUS.full,
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: `0 8px 48px ${blackAlpha(0.6)}, inset 0 1px 0 rgba(255,255,255,0.05)`,
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1.3fr 1fr 1fr",
    alignItems: "center",
    boxSizing: "border-box",
    padding: "0 4px",
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
    width: 36,
    height: 36,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transition: `background ${MOTION.hover}`,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    lineHeight: 1,
    transition: "color 160ms ease",
    fontFamily: "var(--font-geist-sans, system-ui)",
  },
  trainTab: {
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
  trainCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: `box-shadow ${MOTION.hover}, transform ${MOTION.press}`,
  },
  badge: {
    position: "absolute",
    minWidth: 14,
    height: 14,
    padding: "0 3px",
    borderRadius: 7,
    background: RED,
    color: "#fff",
    border: "1.5px solid rgba(6,6,7,0.97)",
    fontSize: 8,
    fontWeight: 900,
    lineHeight: "11px",
    textAlign: "center",
    boxSizing: "border-box",
  },
  avatarWrap: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "box-shadow 200ms ease",
    flexShrink: 0,
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
