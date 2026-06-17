"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter as useNextRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RED, RED_DARK, redAlpha, RADIUS, MOTION , blackAlpha, whiteAlpha} from "@/lib/tokens";
import { locales } from "@/lib/i18n";
import { loc } from "@/lib/loc";
import Image from "next/image";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function FeedIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.38)" }} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="13" rx="1.5"/>
      <rect x="14" y="8" width="7" height="13" rx="1.5"/>
    </svg>
  );
}

function FightersIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.38)" }} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5" r="2.5"/>
      <path d="M8 22v-6l-2-4h12l-2 4v6"/>
      <path d="M8 14h8"/>
    </svg>
  );
}

function CoachIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.38)" }} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6l-.7 2H9l-.7-2A7 7 0 0 1 12 2Z"/>
      <path d="M9 17v1a3 3 0 0 0 6 0v-1"/>
      <path d="M9.5 9.5 12 12l2.5-2.5"/>
    </svg>
  );
}

function SparringIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.38)" }} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>
    </svg>
  );
}

// Add ChallengesIcon alongside existing icons
function ChallengesIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.38)" }} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  );
}

function ExploreIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.38)" }} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
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
const osIc = { width: 20, height: 20, display: "block", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };

const OS_ICONS = {
  coach: (
    <svg style={osIc} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6l-.7 2H9l-.7-2A7 7 0 0 1 12 2Z"/>
      <path d="M9 17v1a3 3 0 0 0 6 0v-1"/>
      <path d="M9.5 9.5 12 12l2.5-2.5"/>
    </svg>
  ),
  sparring: (
    <svg style={osIc} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>
    </svg>
  ),
  fighters: (
    <svg style={osIc} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5" r="2.5"/>
      <path d="M8 22v-6l-2-4h12l-2 4v6"/>
      <path d="M8 14h8"/>
    </svg>
  ),
  gyms: (
    <svg style={osIc} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5H4.5a2.5 2.5 0 0 0 0 5H6M18 5h1.5a2.5 2.5 0 0 1 0 5H18"/>
      <rect x="6" y="3" width="12" height="14" rx="2"/>
      <path d="M10 21h4M12 17v4"/>
    </svg>
  ),
  challenges: (
    <svg style={osIc} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="12" cy="12" r="1" fill="currentColor" strokeWidth="0"/>
    </svg>
  ),
  inbox: (
    <svg style={osIc} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>
    </svg>
  ),
  notifications: (
    <svg style={osIc} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  academy: (
    <svg style={osIc} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 10 12 5l10 5-10 5-10-5Z"/>
      <path d="M12 15v6"/>
      <path d="M18 13v6"/>
      <path d="M6 13v6"/>
    </svg>
  ),
  history: (
    <svg style={osIc} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M12 7v5l4 2"/>
    </svg>
  ),
  settings: (
    <svg style={osIc} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  ),
  upload: (
    <svg style={osIc} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  drills: (
    <svg style={osIc} viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  "fighter-profile": (
    <svg style={osIc} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5"/>
      <path d="M5 20a7 7 0 0 1 14 0"/>
      <path d="M17 8h3M4 8h3"/>
      <path d="M19 11l1.5 1.5M3.5 11 5 12.5"/>
    </svg>
  ),
};

const COMBAT_OS_ITEMS = [
  { key: "fighters",        labelEn: "Fighters",      labelMn: "Тулаанчид",        labelKo: "파이터",    path: "/fighters" },
  { key: "challenges",      labelEn: "Challenges",    labelMn: "Сорилт",           labelKo: "챌린지",    path: "/challenges" },
  { key: "notifications",   labelEn: "Notifications", labelMn: "Мэдэгдэл",         labelKo: "알림",     path: "/notifications" },
  { key: "inbox",           labelEn: "Messages",      labelMn: "Мессеж",           labelKo: "메시지",    path: "/inbox" },
  { key: "fighter-profile", labelEn: "Fighter DNA",   labelMn: "Тулаанчийн ДНХ",  labelKo: "파이터 DNA", path: "/fighter-profile" },
  { key: "academy",         labelEn: "Academy",       labelMn: "Академи",          labelKo: "아카데미",   path: "/programs" },
  { key: "gyms",            labelEn: "Gyms",          labelMn: "Дасгалын заал",    labelKo: "체육관",    path: "/gyms" },
  { key: "history",         labelEn: "History",       labelMn: "Түүх",             labelKo: "기록",     path: "/history" },
  { key: "settings",        labelEn: "Settings",      labelMn: "Тохиргоо",         labelKo: "설정",     path: "/profile" },
];

function CombatOSSheet({ onClose, router, locale, pathname, userId }) {
  const LANG_LABELS = { mn: "🇲🇳 MN", en: "🇺🇸 EN", ko: "🇰🇷 KO" };
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
          borderRadius: "20px 20px 0 0",
          background: "linear-gradient(180deg, #161618 0%, #0f0f10 100%)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderBottom: "none",
          boxShadow: `0 -20px 50px ${blackAlpha(0.55)}`,
          padding: `12px 16px calc(20px + max(env(safe-area-inset-bottom), 8px))`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: 32, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.14)", margin: "0 auto 12px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
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

        {/* Language row */}
        <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.28)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>Language</div>
        <div style={{ display: "flex", gap: 6 }}>
          {locales.map((lng) => {
            const active = locale === lng;
            const segments = (pathname || "/").split("/");
            const target = locales.includes(segments[1])
              ? segments.map((s, i) => (i === 1 ? lng : s)).join("/") || `/${lng}`
              : `/${lng}${pathname === "/" ? "" : pathname}`;
            return (
              <button
                key={lng}
                onClick={() => { onClose(); router.push(target); }}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 12,
                  background: active ? redAlpha(0.18) : "rgba(255,255,255,0.04)",
                  border: active ? `1px solid ${redAlpha(0.4)}` : "1px solid rgba(255,255,255,0.07)",
                  color: active ? RED : "rgba(255,255,255,0.45)",
                  fontSize: 12, fontWeight: 900, cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {LANG_LABELS[lng]}
              </button>
            );
          })}
        </div>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {COMBAT_OS_ITEMS.map((item) => (
            <button
              key={item.key}
              className="tap-bounce"
              onClick={() => { onClose(); router.push(item.key === "settings" ? `/${locale}/profile/${userId || ""}` : `/${locale}${item.path}`); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                cursor: "pointer", color: "#fff",
                textAlign: "left",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ flexShrink: 0, display: "flex", color: "rgba(255,255,255,0.7)" }}>{OS_ICONS[item.key]}</span>
              <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>
                {loc(locale, item.labelMn, item.labelKo, item.labelEn)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Profile tab ──────────────────────────────────────────────────────────────
function ProfileTab({ user, active, onClick, onBadgeClick, badge, locale }) {
  const photo = user?.photoURL || user?.profileImageUrl || "";
  const initial = (user?.displayName || user?.username || "U").charAt(0).toUpperCase();
  const [imgError, setImgError] = useState(false);
  const label = loc(locale, "Профайл", "프로필", "Profile");

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
            <button
              type="button"
              aria-label="Notifications"
              style={{ ...s.badge, top: -3, right: -3, cursor: "pointer", border: "none", padding: 0 }}
              onClick={(e) => { e.stopPropagation(); onBadgeClick?.(); }}
            >
              {badge > 9 ? "9+" : badge}
            </button>
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
  const label = loc(locale, "Дасгал", "훈련", "Train");
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
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
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

  const feedLabel    = loc(locale, "Фийд", "피드", "Feed");
  const coachLabel   = loc(locale, "Коуч", "코치", "Coach");
  const exploreLabel = loc(locale, "Хайх", "탐색", "Explore");

  if (!mounted) return null;

  return (
    <>
      {/* Combat OS floating trigger — mobile only */}
      {!isDesktop && (
        <button
          className="tap-bounce"
          aria-label="More"
          onClick={() => setCombatOSOpen(true)}
          style={s.combatOSBtn}
        >
          <GridIcon />
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase" }}>
            {loc(locale, "Цэс", "더보기", "More")}
          </span>
        </button>
      )}

      {/* Combat OS sheet */}
      {combatOSOpen && (
        <CombatOSSheet onClose={() => setCombatOSOpen(false)} router={r} locale={locale} pathname={pathname} userId={user?.uid} />
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
        {/* Feed */}
        <IconTab active={resolvedActiveTab === "feed"} onClick={() => r.push(`/${locale}/feed`)} label={feedLabel}>
          <FeedIcon active={resolvedActiveTab === "feed"} />
        </IconTab>

        {/* Coach */}
        <IconTab active={resolvedActiveTab === "coach"} onClick={() => r.push(`/${locale}/coach`)} label={coachLabel}>
          <CoachIcon active={resolvedActiveTab === "coach"} />
        </IconTab>

        {/* Train — center action */}
        <TrainTab active={resolvedActiveTab === "train"} onClick={() => r.push(`/${locale}/train`)} locale={locale} />

        {/* Explore */}
        <IconTab active={resolvedActiveTab === "explore"} onClick={() => r.push(`/${locale}/explore`)} label={exploreLabel}>
          <ExploreIcon active={resolvedActiveTab === "explore"} />
        </IconTab>

        {/* Profile — carries notification badge */}
        <ProfileTab
          user={user}
          active={resolvedActiveTab === "profile"}
          onClick={goToProfile}
          onBadgeClick={() => r.push(`/${locale}/notifications`)}
          badge={unreadCount + dmUnread}
          locale={locale}
        />
      </nav>
    </>
  );
}

// ─── Active tab resolver ──────────────────────────────────────────────────────
function getActiveTab(pathname = "") {
  if (pathname.includes("/feed"))       return "feed";
  if (pathname.includes("/coach"))      return "coach";
  if (pathname.includes("/explore") || pathname.includes("/discover") || pathname.includes("/events") || pathname.includes("/programs")) return "explore";
  if (pathname.includes("/train"))      return "train";
  if (
    pathname.includes("/profile") ||
    pathname.includes("/fighter-profile") ||
    pathname.includes("/inbox") ||
    pathname.includes("/notifications")
  ) return "profile";
  return "";
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
    bottom: "calc(88px + max(env(safe-area-inset-bottom), 0px))",
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
    bottom: "calc(10px + max(env(safe-area-inset-bottom), 0px))",
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
