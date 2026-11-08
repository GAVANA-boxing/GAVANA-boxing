"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useUserProfile } from "@/context/UserProfileProvider";
import { useRankData } from "@/hooks/useRankData";
import { blackAlpha } from "@/lib/tokens";
import { getFighterRank, getRankProgress } from "@/lib/xp";
import { translate } from "@/lib/i18n";

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
  const { user, loading: authLoading } = useAuth();
  const { xp: accountXp } = useRankData({ user, authLoading });
  const router   = useRouter();
  const pathname = usePathname();
  const locale   = currentLocale || pathname?.split("/")?.[1] || "mn";

  const { profile } = useUserProfile();
  const [imgErr,   setImgErr]  = useState(false);

  // Canonical account XP (same number as Home / Progress); stored XP until it loads.
  const xp       = accountXp ?? (Number(profile?.xp) || 0);
  const photoUrl = profile?.profileImageUrl || profile?.photoURL || null;

  const rank     = getFighterRank(xp);
  const progress = getRankProgress(xp);
  const photo    = photoUrl || user?.photoURL;
  const initial  = (user?.displayName || user?.email || "G").charAt(0).toUpperCase();

  const isActive   = (path) => pathname?.includes(`/${path}`);
  const go         = (path) => router.push(`/${locale}/${path}`);
  const goProfile  = ()     => router.push(`/${locale}/profile/${user.uid}`);

  return (
    <aside style={sidebarStyle}>
      <SidebarLogo onLogoClick={() => go("home")} />

      <SidebarNav isActive={isActive} onNavigate={go} locale={locale} />

      {user && (
        <SidebarFooter
          user={user}
          photo={photo}
          imgErr={imgErr}
          onImgError={() => setImgErr(true)}
          initial={initial}
          rank={rank}
          rankName={translate(locale, rank.key)}
          xpProgress={progress}
          onProfileClick={goProfile}
        />
      )}

      <LanguageSwitcher currentLocale={locale} pathname={pathname} />
    </aside>
  );
}
