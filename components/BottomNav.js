"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter as useNextRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RADIUS, blackAlpha } from "@/lib/tokens";
import { loc } from "@/lib/loc";

import { FeedIcon, CoachIcon, ExploreIcon, GridIcon } from "./bottomnav/NavIcons";
import CombatOSSheet from "./bottomnav/CombatOSSheet";
import IconTab from "./bottomnav/IconTab";
import TrainTab from "./bottomnav/TrainTab";
import ProfileTab from "./bottomnav/ProfileTab";

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
};

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
        <CombatOSSheet onClose={() => setCombatOSOpen(false)} router={r} locale={locale} pathname={pathname} userId={user?.uid} unreadNotifs={unreadCount} unreadDMs={dmUnread} />
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
