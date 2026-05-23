"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname } from "@/lib/i18n";
import BottomNav from "@/components/BottomNav";
import CombatMemoryPanel from "@/components/profile/CombatMemoryPanel";
import { RED, GOLD, RADIUS, redAlpha, goldAlpha, whiteAlpha, blackAlpha, BG } from "@/lib/tokens";

export default function FighterProfilePage() {
  const router   = useRouter();
  const pathname = usePathname();
  const locale   = getLocaleFromPathname(pathname);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${whiteAlpha(0.08)}`, borderTopColor: RED, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }
  if (!user) return null;

  return (
    <main style={{ minHeight: "100dvh", background: BG, paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}>

      {/* Header */}
      <div style={{ padding: "56px 20px 0" }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: whiteAlpha(0.5), cursor: "pointer", padding: "4px 0", marginBottom: 24 }}
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>Back</span>
        </button>

        {/* Identity block */}
        <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 900, letterSpacing: 3.5, color: goldAlpha(0.6), textTransform: "uppercase" }}>
          FIGHTER INTELLIGENCE
        </p>
        <h1 style={{
          margin: "0 0 4px", fontSize: 28, fontWeight: 1000, letterSpacing: "-0.02em",
          color: "#fff", lineHeight: 1.0,
          fontFamily: "var(--font-display, 'Anton', sans-serif)",
        }}>
          {user.displayName || user.email?.split("@")[0] || "FIGHTER"}
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: 11, color: whiteAlpha(0.3), fontWeight: 700 }}>
          Movement profile · Evolution tracking
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: whiteAlpha(0.06), marginBottom: 4 }} />
      </div>

      {/* Panel */}
      <div style={{ padding: "0 20px" }}>
        <CombatMemoryPanel user={user} />
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </main>
  );
}
