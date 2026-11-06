"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter as useNextRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RADIUS, blackAlpha } from "@/lib/tokens";
import { loc } from "@/lib/loc";

import { FeedIcon, CoachIcon, HomeIcon, ProgressIcon } from "./bottomnav/NavIcons";
import { CORE_MODE } from "@/lib/coreRoutes";
import IconTab from "./bottomnav/IconTab";
import { flashNavLabel, useNavFlash } from "./bottomnav/navFlash";
import { getActiveTab } from "@/lib/navTabs";
import TrainTab from "./bottomnav/TrainTab";
import ProfileTab from "./bottomnav/ProfileTab";

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
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
  const flashing = useNavFlash();
  const pathname = usePathname();
  const nextRouter = useNextRouter();
  const r = router ?? nextRouter;
  const locale = currentLocale;

  const [unreadCount, setUnreadCount] = useState(0);
  const [dmUnread, setDmUnread] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // The URL decides; `activeTab` is only a fallback for pages outside the five tabs.
  const resolvedActiveTab = getActiveTab(pathname) || activeTab;

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

  // Tap: flash the tab's name for ~1 s, then go.
  const go = (key, path) => { flashNavLabel(key); r.push(`/${locale}${path}`); };
  const goToProfile = () => { flashNavLabel("profile"); r.push(user?.uid ? `/${locale}/profile/${user.uid}` : `/${locale}/login`); };

  if (!mounted) return null;

  return (
    <>
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
        {CORE_MODE ? (
          <IconTab active={resolvedActiveTab === "home"} onClick={() => go("home", "/home")} label={loc(locale, "Нүүр", "홈", "Home")} showLabel={flashing === "home"}>
            <HomeIcon active={resolvedActiveTab === "home"} />
          </IconTab>
        ) : (
          <IconTab active={resolvedActiveTab === "feed"} onClick={() => go("feed", "/feed")} label={loc(locale, "Фийд", "피드", "Feed")} showLabel={flashing === "feed"}>
            <FeedIcon active={resolvedActiveTab === "feed"} />
          </IconTab>
        )}

        <IconTab active={resolvedActiveTab === "progress"} onClick={() => go("progress", "/rank")} label={loc(locale, "Дэвшил", "성장", "Progress")} showLabel={flashing === "progress"}>
          <ProgressIcon active={resolvedActiveTab === "progress"} />
        </IconTab>

        {/* Train — center action */}
        <TrainTab active={resolvedActiveTab === "train"} onClick={() => go("train", "/train")} locale={locale} showLabel={flashing === "train"} />

        <IconTab active={resolvedActiveTab === "coach"} onClick={() => go("coach", "/coach")} label={loc(locale, "Коуч", "코치", "Coach")} showLabel={flashing === "coach"}>
          <CoachIcon active={resolvedActiveTab === "coach"} />
        </IconTab>

        {/* Me — carries the notification badge */}
        <ProfileTab
          user={user}
          active={resolvedActiveTab === "profile"}
          onClick={goToProfile}
          onBadgeClick={() => r.push(`/${locale}/notifications`)}
          badge={unreadCount + dmUnread}
          locale={locale}
          showLabel={flashing === "profile"}
        />
      </nav>
    </>
  );
}
