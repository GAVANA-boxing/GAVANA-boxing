"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { RED, GOLD, SURFACE, SURFACE_2, BORDER, BORDER_2, MUTED, BG, redAlpha, goldAlpha } from "@/lib/tokens";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcoHome = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IcoPlay = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IcoBrain = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.66Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.66Z"/>
  </svg>
);
const IcoTrophy = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);
const IcoTarget = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IcoSwords = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="11" x2="9" y2="15"/>
  </svg>
);
const IcoMessage = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcoPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const NAV_ITEMS = [
  { Icon: IcoHome,    label: "Нүүр",     path: "discover" },
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

  const isActive = (path) => pathname?.startsWith(`/${locale}/${path}`);
  const go = (path) => router.push(`/${locale}/${path}`);

  return (
    <aside style={s.sidebar}>
      {/* Logo */}
      <button style={s.logoBtn} onClick={() => go("reels")}>
        <span style={s.logoMark}>G</span>
        <div style={s.logoText}>
          <span style={s.logoGavana}>GAVANA</span>
          <span style={s.logoBoxing}>BOXING</span>
        </div>
      </button>

      {/* Nav */}
      <nav style={s.nav}>
        {NAV_ITEMS.map(({ Icon, label, path }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              style={{ ...s.navBtn, ...(active ? s.navBtnActive : {}) }}
              onClick={() => go(path)}
            >
              <span style={{ ...s.navIcon, color: active ? "#fff" : MUTED }}>
                <Icon />
              </span>
              <span style={{ ...s.navLabel, color: active ? "#fff" : MUTED }}>
                {label}
              </span>
              {active && <div style={s.activeDot} />}
            </button>
          );
        })}
      </nav>

      {/* Create */}
      <button style={s.createBtn} onClick={() => go("upload")}>
        <IcoPlus />
        <span>Үүсгэх</span>
      </button>

      {/* Profile */}
      {user && (
        <button
          style={s.profileBtn}
          onClick={() => router.push(`/${locale}/profile/${user.uid}`)}
        >
          <div style={s.profileAva}>
            {profilePhotoUrl
              ? <img src={profilePhotoUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              : <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{(user.displayName || user.email || "U").charAt(0).toUpperCase()}</span>
            }
          </div>
          <div style={s.profileInfo}>
            <div style={s.profileName}>{user.displayName || user.email?.split("@")[0] || "Та"}</div>
            <div style={s.profileSub}>Профайл харах</div>
          </div>
        </button>
      )}
    </aside>
  );
}

const s = {
  sidebar: {
    width: 240,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    padding: "20px 12px 16px",
    borderRight: `1px solid ${BORDER}`,
    background: BG,
    height: "100dvh",
    overflowY: "auto",
    scrollbarWidth: "none",
    position: "sticky",
    top: 0,
  },
  logoBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
    padding: "4px 8px",
    background: "none",
    border: "none",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: RED,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontFamily: "var(--font-display, 'Bebas Neue', 'Anton', sans-serif)",
    color: "#fff",
    flexShrink: 0,
    lineHeight: "30px",
    textAlign: "center",
  },
  logoText: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  logoGavana: {
    fontFamily: "var(--font-display, 'Bebas Neue', 'Anton', sans-serif)",
    fontSize: 16,
    fontWeight: 400,
    letterSpacing: "0.08em",
    color: "#fff",
    lineHeight: 1,
  },
  logoBoxing: {
    fontSize: 8,
    fontWeight: 600,
    color: MUTED,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    lineHeight: 1.4,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    flex: 1,
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 10px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    position: "relative",
    transition: "background 150ms ease",
  },
  navBtnActive: {
    background: SURFACE,
  },
  navIcon: {
    width: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  navLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: 0,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: RED,
    flexShrink: 0,
  },
  createBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    width: "100%",
    padding: "10px",
    borderRadius: 10,
    border: "none",
    background: RED,
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 12,
  },
  profileBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 8px",
    borderTop: `1px solid ${BORDER}`,
    background: "none",
    border: "none",
    borderTop: `1px solid ${BORDER}`,
    cursor: "pointer",
    marginTop: 12,
    textAlign: "left",
    width: "100%",
  },
  profileAva: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: SURFACE_2,
    border: `1.5px solid ${BORDER_2}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: {
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  profileSub: {
    fontSize: 11,
    color: MUTED,
    marginTop: 1,
  },
};
