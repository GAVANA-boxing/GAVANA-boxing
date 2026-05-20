"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { RED, GOLD, goldAlpha, redAlpha } from "@/lib/tokens";

const IcoHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IcoPlay = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IcoBrain = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.66Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.66Z"/>
  </svg>
);
const IcoTrophy = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);
const IcoTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IcoSwords = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="11" x2="9" y2="15"/>
  </svg>
);
const IcoMessage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const NAV_ITEMS = [
  { Icon: IcoHome,    label: "Нүүр",     path: "" },
  { Icon: IcoPlay,    label: "Рилс",     path: "reels" },
  { Icon: IcoBrain,   label: "AI Коач",  path: "train" },
  { Icon: IcoTrophy,  label: "Чансаа",   path: "rank" },
  { Icon: IcoTarget,  label: "Тренер",   path: "coach" },
  { Icon: IcoSwords,  label: "Спарринг", path: "sparring" },
  { Icon: IcoMessage, label: "Мессеж",   path: "inbox" },
];

export default function AppSidebar({ currentLocale }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);

  const locale = currentLocale || pathname?.split("/")?.[1] || "mn";

  useEffect(() => {
    if (user?.photoURL) { setProfilePhotoUrl(user.photoURL); return; }
    if (!user?.uid) return;
    import("@/lib/firebase").then(({ db }) => {
      if (!db) return;
      import("firebase/firestore").then(({ doc, getDoc }) => {
        getDoc(doc(db, "users", user.uid)).then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const photo = data.profileImageUrl || data.photoURL || data.avatarUrl || null;
            if (photo) setProfilePhotoUrl(photo);
          }
        }).catch(() => {});
      });
    });
  }, [user?.uid, user?.photoURL]);

  const isActive = (path) => {
    const segment = `/${locale}/${path}`;
    if (path === "") return pathname === `/${locale}` || pathname === `/${locale}/dashboard`;
    return pathname?.startsWith(segment);
  };

  const go = (path) => router.push(`/${locale}/${path}`);

  return (
    <aside style={s.sidebar}>
      <button style={s.logoBtn} onClick={() => go("reels")}>
        <span style={s.logoGavana}>GAVANA</span>
        <span style={s.logoBoxing}>BOXING</span>
      </button>

      <nav style={s.nav}>
        {NAV_ITEMS.map(({ Icon, label, path }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              className="dashboard-nav-btn"
              style={{ ...s.navBtn, ...(active ? s.navBtnActive : {}) }}
              onClick={() => go(path)}
            >
              <span style={{ ...s.navIcon, color: active ? "#fff" : "rgba(255,255,255,0.38)" }}>
                <Icon />
              </span>
              <span style={s.navLabel}>{label}</span>
              {active && <div style={s.navActiveBar} />}
            </button>
          );
        })}
      </nav>

      <button style={s.createBtn} onClick={() => go("upload")}>
        <span style={{ fontSize: 16, fontWeight: 300, lineHeight: 1 }}>+</span> ҮҮСГЭХ
      </button>

      {user && (
        <button
          style={{ ...s.profileBtn, position: "relative", zIndex: 2 }}
          onClick={() => router.push(`/${locale}/profile/${user.uid}`)}
        >
          <div style={s.profileAva}>
            {profilePhotoUrl
              ? <img src={profilePhotoUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              : <span style={{ fontSize: 13, fontWeight: 900 }}>{(user.displayName || user.email || "U").charAt(0).toUpperCase()}</span>
            }
          </div>
          <div style={s.profileInfo}>
            <div style={s.profileName}>{(user.displayName || user.email?.split("@")[0] || "Та").toUpperCase()}</div>
            <div style={s.profileSub}>GAVANA BOXING</div>
          </div>
        </button>
      )}
    </aside>
  );
}

const s = {
  sidebar: {
    width: 260,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    padding: "28px 14px 24px",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.015)",
    height: "100dvh",
    overflowY: "auto",
    scrollbarWidth: "none",
    position: "sticky",
    top: 0,
  },
  logoBtn: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    marginBottom: 32,
    padding: "0 10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    alignItems: "flex-start",
  },
  logoGavana: {
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    fontSize: 24,
    fontWeight: 400,
    letterSpacing: "0.06em",
    color: "#fff",
    lineHeight: 1,
    textShadow: `0 0 28px ${redAlpha(0.6)}, 0 2px 0 rgba(0,0,0,0.5)`,
  },
  logoBoxing: {
    fontSize: 9,
    fontWeight: 900,
    color: RED,
    letterSpacing: "0.32em",
    textTransform: "uppercase",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.38)",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    position: "relative",
    transition: "background 150ms ease, color 150ms ease",
  },
  navBtnActive: {
    background: `${redAlpha(0.1)}`,
    color: "#fff",
  },
  navIcon: {
    width: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  navLabel: { flex: 1 },
  navActiveBar: {
    position: "absolute",
    left: 0,
    top: "22%",
    bottom: "22%",
    width: 3,
    borderRadius: "0 3px 3px 0",
    background: RED,
    boxShadow: `0 0 10px ${RED}`,
  },
  createBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "13px",
    borderRadius: 14,
    border: "none",
    background: `linear-gradient(135deg, ${RED}, #8f0d17)`,
    color: "#fff",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    cursor: "pointer",
    marginTop: 10,
    boxShadow: `0 6px 22px ${redAlpha(0.4)}`,
  },
  profileBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.03)",
    cursor: "pointer",
    marginTop: 14,
    textAlign: "left",
    width: "100%",
  },
  profileAva: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${RED}, #7d0812)`,
    border: `2px solid ${goldAlpha(0.4)}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.04em",
    color: "#fff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
  },
  profileSub: {
    fontSize: 9,
    color: RED,
    fontWeight: 800,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    marginTop: 1,
  },
};
