"use client";

import { RED, redAlpha, blackAlpha } from "@/lib/tokens";
import { locales } from "@/lib/i18n";
import { loc } from "@/lib/loc";

// ─── Combat OS Sheet icon style ───────────────────────────────────────────────
const osIc = {
  width: 20,
  height: 20,
  display: "block",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

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

const LANG_LABELS = { mn: "🇲🇳 MN", en: "🇺🇸 EN", ko: "🇰🇷 KO" };

/**
 * @param {{ onClose: () => void, router: object, locale: string, pathname: string, userId: string | undefined, unreadNotifs?: number, unreadDMs?: number }} props
 */
export default function CombatOSSheet({ onClose, router, locale, pathname, userId, unreadNotifs = 0, unreadDMs = 0 }) {
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
        className="combat-os-sheet"
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
                position: "relative",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                cursor: "pointer", color: "#fff",
                textAlign: "left",
                WebkitTapHighlightColor: "transparent",
                transition: "background 160ms ease, border-color 160ms ease",
              }}
            >
              <span style={{ flexShrink: 0, display: "flex", color: "rgba(255,255,255,0.7)" }}>{OS_ICONS[item.key]}</span>
              <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>
                {loc(locale, item.labelMn, item.labelKo, item.labelEn)}
              </span>
              {((item.key === "notifications" && unreadNotifs > 0) || (item.key === "inbox" && unreadDMs > 0)) && (
                <span
                  className="notif-badge-pulse"
                  style={{
                    marginLeft: "auto", flexShrink: 0,
                    minWidth: 18, height: 18, borderRadius: 999,
                    background: RED,
                    boxShadow: `0 0 6px ${redAlpha(0.8)}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 900, color: "#fff",
                    padding: "0 5px",
                  }}
                >
                  {item.key === "notifications"
                    ? (unreadNotifs > 99 ? "99+" : unreadNotifs)
                    : (unreadDMs > 99 ? "99+" : unreadDMs)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
