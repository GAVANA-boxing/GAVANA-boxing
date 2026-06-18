"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { blackAlpha } from "@/lib/tokens";
import { getFighterRank, getRankProgress } from "@/lib/xp";

import SidebarLogo       from "./sidebar/SidebarLogo";
import SidebarNav        from "./sidebar/SidebarNav";
import SidebarFooter     from "./sidebar/SidebarFooter";
import LanguageSwitcher  from "./sidebar/LanguageSwitcher";

const sidebarStyle = {
  width: 220,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  padding: "20px 10px 12px",
  borderRight: "1px solid rgba(255,255,255,0.05)",
  background: "linear-gradient(180deg, rgba(20,20,22,0.98) 0%, rgba(11,11,12,1) 100%)",
  height: "100dvh",
  overflowY: "auto",
  scrollbarWidth: "none",
  position: "sticky",
  top: 0,
  boxShadow: `1px 0 0 rgba(255,255,255,0.03), 4px 0 24px ${blackAlpha(0.4)}`,
};

export default function AppSidebar({ currentLocale }) {
  const { user } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const locale   = currentLocale || pathname?.split("/")?.[1] || "mn";

  const [xp,       setXp]      = useState(0);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [imgErr,   setImgErr]  = useState(false);

  // Load user XP for rank bar
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    (async () => {
      try {
        const { db }          = await import("@/lib/firebase");
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

  const rank     = getFighterRank(xp);
  const progress = getRankProgress(xp);
  const photo    = photoUrl || user?.photoURL;
  const initial  = (user?.displayName || user?.email || "G").charAt(0).toUpperCase();

  const isActive   = (path) => pathname?.includes(`/${path}`);
  const go         = (path) => router.push(`/${locale}/${path}`);
  const goProfile  = ()     => router.push(`/${locale}/profile/${user.uid}`);

  return (
    <aside style={sidebarStyle}>
      <SidebarLogo onLogoClick={() => go("reels")} />

      <SidebarNav isActive={isActive} onNavigate={go} />

      {user && (
        <SidebarFooter
          user={user}
          photo={photo}
          imgErr={imgErr}
          onImgError={() => setImgErr(true)}
          initial={initial}
          rank={rank}
          xpProgress={progress}
          onProfileClick={goProfile}
        />
      )}

      <LanguageSwitcher currentLocale={locale} pathname={pathname} />
    </aside>
  );
}
