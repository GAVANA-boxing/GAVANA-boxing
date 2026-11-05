"use client";

import { RED, redAlpha, whiteAlpha } from "@/lib/tokens";
import { loc } from "@/lib/loc";
import { CORE_MODE } from "@/lib/coreRoutes";

/**
 * HomeBottomNav — the new 5-tab structure introduced with the Home redesign.
 * Нүүр · Фийд · Train (center) · Дасгалжуулагч · Би
 */
export default function HomeBottomNav({ locale, router, active = "home", userId }) {
  const go = (path) => router.push(`/${locale}${path}`);
  const tabs = [
    { key: "home", label: loc(locale, "Нүүр", "홈", "Home"), path: "/home",
      icon: <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" /> , fill: true },
    CORE_MODE
      // Core loop: the 2nd slot is your progression, not the social feed.
      ? { key: "rank", label: loc(locale, "Дэвшил", "성장", "Progress"), path: "/rank",
          icon: <><path d="M4 20h16" /><path d="M7 16v-4" /><path d="M12 16V8" /><path d="M17 16V5" /></> }
      : { key: "feed", label: loc(locale, "Фийд", "피드", "Feed"), path: "/feed",
          icon: <><rect x="3" y="3" width="18" height="18" rx="4" /><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none" /></> },
    { key: "coach", label: loc(locale, "Дасгалжуулагч", "코치", "Coach"), path: "/coach",
      icon: <><path d="M12 3a7 7 0 0 1 7 7c0 2.5-1.4 4.6-3.3 6l-.7 2H9l-.7-2A7 7 0 0 1 12 3z" /><path d="M9 18a3 3 0 0 0 6 0" /></> },
    { key: "profile", label: loc(locale, "Би", "나", "You"), path: "/fighter-profile",
      icon: <><circle cx="12" cy="8" r="3.4" /><path d="M5 20a7 7 0 0 1 14 0" /></> },
  ];

  return (
    <nav style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
      height: "calc(64px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)",
      display: "flex", alignItems: "center", justifyContent: "space-around",
      background: "rgba(6,6,7,0.9)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      borderTop: `1px solid ${whiteAlpha(0.08)}`,
    }}>
      {/* Нүүр */}
      <NavBtn tab={tabs[0]} active={active} onClick={go} />
      {/* Фийд */}
      <NavBtn tab={tabs[1]} active={active} onClick={go} />
      {/* Train — center */}
      <button type="button" onClick={() => go("/train")} aria-label="Train" style={{ background: "none", border: "none", cursor: "pointer" }}>
        <span style={{ display: "grid", placeItems: "center", width: 46, height: 46, borderRadius: 16, background: RED, color: "#fff", marginTop: -6, boxShadow: `0 8px 22px ${redAlpha(0.4)}` }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
        </span>
      </button>
      {/* Дасгалжуулагч */}
      <NavBtn tab={tabs[2]} active={active} onClick={go} />
      {/* Би */}
      <NavBtn tab={tabs[3]} active={active} onClick={go} />
    </nav>
  );
}

function NavBtn({ tab, active, onClick }) {
  const on = active === tab.key;
  return (
    <button type="button" onClick={() => onClick(tab.path)} style={{
      background: "none", border: "none", cursor: "pointer",
      color: on ? "#fff" : whiteAlpha(0.32),
      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill={tab.fill && on ? "currentColor" : "none"} stroke={tab.fill && on ? "none" : "currentColor"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {tab.icon}
      </svg>
      <span style={{ fontFamily: "var(--font-condensed, 'Barlow Condensed', sans-serif)", fontWeight: 600, fontSize: 10, letterSpacing: 0.4 }}>{tab.label}</span>
    </button>
  );
}
