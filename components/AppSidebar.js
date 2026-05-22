"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { RED, RED_DARK, GOLD, BG, BORDER, MUTED, redAlpha, goldAlpha , blackAlpha} from "@/lib/tokens";
import { getFighterRank, getRankProgress } from "@/lib/xp";
import Image from "next/image";

// ─── Icons ────────────────────────────────────────────────────────────────────
const ic = { width: 17, height: 17, fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };

const IcoHome    = () => <svg style={ic} viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IcoPlay    = () => <svg style={ic} viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IcoBrain   = () => <svg style={ic} viewBox="0 0 24 24"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.66Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.66Z"/></svg>;
const IcoTrophy  = () => <svg style={ic} viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
const IcoTarget  = () => <svg style={ic} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IcoSwords  = () => <svg style={ic} viewBox="0 0 24 24"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="11" x2="9" y2="15"/></svg>;
const IcoMessage = () => <svg style={ic} viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IcoPlus    = () => <svg style={{ ...ic, width: 15, height: 15, strokeWidth: 2.5 }} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoDash    = () => <svg style={ic} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const IcoBars    = () => <svg style={ic} viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IcoBuilding= () => <svg style={ic} viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const IcoUsers   = () => <svg style={ic} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IcoFlash   = () => <svg style={ic} viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;

// ─── Nav groups ───────────────────────────────────────────────────────────────
const NAV = [
  {
    group: "CORE",
    items: [
      { Icon: IcoDash,   label: "Dashboard",  path: "dashboard" },
      { Icon: IcoHome,   label: "Discover",   path: "discover" },
      { Icon: IcoPlay,   label: "Reels",      path: "reels" },
    ],
  },
  {
    group: "TRAIN",
    items: [
      { Icon: IcoBrain,  label: "AI Coach",   path: "train" },
      { Icon: IcoTarget, label: "Coach",      path: "coach" },
    ],
  },
  {
    group: "COMPETE",
    items: [
      { Icon: IcoTrophy,   label: "Rank",        path: "rank" },
      { Icon: IcoSwords,   label: "Sparring",    path: "sparring" },
      { Icon: IcoBars,     label: "Leaderboard", path: "leaderboard" },
      { Icon: IcoFlash,    label: "Challenges",  path: "challenges" },
    ],
  },
  {
    group: "EXPLORE",
    items: [
      { Icon: IcoUsers,    label: "Fighters",    path: "fighters" },
      { Icon: IcoBuilding, label: "Gyms",        path: "gyms" },
    ],
  },
  {
    group: "SOCIAL",
    items: [
      { Icon: IcoMessage, label: "Inbox",        path: "inbox" },
    ],
  },
];

// ─── XP mini bar ─────────────────────────────────────────────────────────────
function XPBar({ progress, color }) {
  return (
    <div style={{ width: "100%", height: 2, borderRadius: 1, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${Math.min(100, Math.max(0, progress))}%`,
        borderRadius: 1,
        background: color,
        boxShadow: `0 0 6px ${color}`,
        transition: "width 800ms cubic-bezier(0.16,1,0.3,1)",
      }} />
    </div>
  );
}

export default function AppSidebar({ currentLocale }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = currentLocale || pathname?.split("/")?.[1] || "mn";
  const [xp, setXp] = useState(0);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [imgErr, setImgErr] = useState(false);

  // Load user XP for rank bar
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    (async () => {
      try {
        const { db } = await import("@/lib/firebase");
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!cancelled && snap.exists()) {
          const d = snap.data();
          setXp(Number(d.xp) || 0);
          setPhotoUrl(d.profileImageUrl || d.photoURL || null);
        }
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const rank = getFighterRank(xp);
  const progress = getRankProgress(xp);
  const photo = photoUrl || user?.photoURL;
  const initial = (user?.displayName || user?.email || "G").charAt(0).toUpperCase();

  const isActive = (path) => pathname?.includes(`/${path}`);
  const go = (path) => router.push(`/${locale}/${path}`);

  return (
    <aside style={s.sidebar}>

      {/* ── Logo ── */}
      <button style={s.logoBtn} onClick={() => go("reels")}>
        <div style={s.logoMark}>
          <span style={s.logoG}>G</span>
          <div style={s.logoGlow} />
        </div>
        <div style={s.logoText}>
          <span style={s.logoGavana}>GAVANA</span>
          <span style={s.logoSub}>BOXING · OS</span>
        </div>
      </button>

      {/* ── Status chip ── */}
      <div style={s.statusChip}>
        <span style={s.statusDot} className="live-pulse" />
        <span style={s.statusLabel}>COMBAT SYSTEM ONLINE</span>
      </div>

      {/* ── Nav groups ── */}
      <nav style={s.nav}>
        {NAV.map(({ group, items }) => (
          <div key={group} style={s.navGroup}>
            <div style={s.groupLabel}>{group}</div>
            {items.map(({ Icon, label, path }) => {
              const active = isActive(path);
              return (
                <button
                  key={path}
                  style={{ ...s.navBtn, ...(active ? s.navBtnActive : {}) }}
                  onClick={() => go(path)}
                  className="tap-bounce"
                >
                  {active && <div style={s.activeBar} />}
                  <span style={{ ...s.navIcon, color: active ? RED : "rgba(255,255,255,0.22)" }}>
                    <Icon />
                  </span>
                  <span style={{ ...s.navLabel, color: active ? "#fff" : "rgba(255,255,255,0.32)", fontWeight: active ? 700 : 500 }}>
                    {label}
                  </span>
                  {active && (
                    <span style={s.activePip} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Create button ── */}
      <button style={s.createBtn} onClick={() => go("upload")} className="tap-bounce">
        <IcoPlus />
        <span>Create Reel</span>
      </button>

      {/* ── Fighter identity footer ── */}
      {user && (
        <div style={s.footer}>
          <button
            style={s.profileBtn}
            onClick={() => router.push(`/${locale}/profile/${user.uid}`)}
            className="tap-bounce"
          >
            <div style={s.avaWrap}>
              {photo && !imgErr
                ? <Image src={photo} alt="" width={32} height={32} style={{ borderRadius: "50%", objectFit: "cover" }} onError={() => setImgErr(true)} />
                : <span style={s.avaInitial}>{initial}</span>
              }
            </div>
            <div style={s.profileInfo}>
              <div style={s.profileName}>{user.displayName || user.email?.split("@")[0] || "Fighter"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: rank.color, letterSpacing: 0.8 }}>{rank.label || "ROOKIE"}</span>
              </div>
            </div>
          </button>
          <div style={{ padding: "0 8px 2px" }}>
            <XPBar progress={progress} color={rank.color} />
          </div>
        </div>
      )}

    </aside>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  sidebar: {
    width: 220,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    padding: "20px 10px 12px",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    background: `linear-gradient(180deg, rgba(20,20,22,0.98) 0%, rgba(11,11,12,1) 100%)`,
    height: "100dvh",
    overflowY: "auto",
    scrollbarWidth: "none",
    position: "sticky",
    top: 0,
    boxShadow: `1px 0 0 rgba(255,255,255,0.03), 4px 0 24px ${blackAlpha(0.4)}`,
  },
  logoBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    padding: "4px 6px",
    background: "none",
    border: "none",
    cursor: "pointer",
    alignSelf: "flex-start",
    borderRadius: 10,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
    boxShadow: `0 4px 16px ${redAlpha(0.45)}, inset 0 1px 0 rgba(255,255,255,0.15)`,
  },
  logoG: {
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    fontSize: 20,
    color: "#fff",
    lineHeight: 1,
    position: "relative",
    zIndex: 1,
    fontWeight: 400,
  },
  logoGlow: {
    position: "absolute", inset: 0, borderRadius: 10,
    background: `radial-gradient(circle at 40% 30%, rgba(255,255,255,0.18) 0%, transparent 70%)`,
    pointerEvents: "none",
  },
  logoText: { display: "flex", flexDirection: "column", gap: 1 },
  logoGavana: {
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    fontSize: 15,
    fontWeight: 400,
    letterSpacing: "0.1em",
    color: "#fff",
    lineHeight: 1,
  },
  logoSub: {
    fontSize: 8,
    fontWeight: 700,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    lineHeight: 1.4,
  },
  statusChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 8px",
    marginBottom: 20,
    borderRadius: 6,
    background: "rgba(34,211,238,0.04)",
    border: "1px solid rgba(34,211,238,0.1)",
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "#22D3EE",
    boxShadow: "0 0 6px rgba(34,211,238,0.9)",
    flexShrink: 0,
  },
  statusLabel: {
    fontSize: 8,
    fontWeight: 800,
    color: "rgba(34,211,238,0.6)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  nav: { display: "flex", flexDirection: "column", gap: 0, flex: 1 },
  navGroup: { marginBottom: 16 },
  groupLabel: {
    fontSize: 8,
    fontWeight: 900,
    color: "rgba(255,255,255,0.11)",
    letterSpacing: 2,
    textTransform: "uppercase",
    padding: "0 10px",
    marginBottom: 3,
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "8px 10px",
    borderRadius: 9,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    position: "relative",
    transition: "background 140ms ease",
    WebkitTapHighlightColor: "transparent",
  },
  navBtnActive: {
    background: `rgba(255,59,48,0.10)`,
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 6,
    width: 2.5,
    borderRadius: 2,
    background: RED,
    boxShadow: `0 0 8px ${redAlpha(0.8)}`,
  },
  navIcon: {
    width: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "color 140ms ease",
  },
  navLabel: {
    flex: 1,
    fontSize: 13,
    letterSpacing: 0,
    transition: "color 140ms ease, font-weight 140ms ease",
  },
  activePip: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: RED,
    flexShrink: 0,
    boxShadow: `0 0 6px ${redAlpha(0.55)}`,
  },
  createBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    width: "100%",
    padding: "11px",
    borderRadius: 10,
    border: `1px solid ${redAlpha(0.35)}`,
    background: `linear-gradient(135deg, ${RED}, ${RED_DARK})`,
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
    boxShadow: `0 4px 18px ${redAlpha(0.22)}, inset 0 1px 0 rgba(255,255,255,0.12)`,
    letterSpacing: 0.3,
  },
  footer: {
    marginTop: 12,
    borderTop: "1px solid rgba(255,255,255,0.05)",
    paddingTop: 10,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  profileBtn: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "6px 8px",
    background: "none",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    borderRadius: 9,
    WebkitTapHighlightColor: "transparent",
  },
  avaWrap: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#222",
    border: `1.5px solid ${redAlpha(0.4)}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  avaInitial: { fontSize: 13, fontWeight: 700, color: "#fff" },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: {
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: 1.2,
  },
};
