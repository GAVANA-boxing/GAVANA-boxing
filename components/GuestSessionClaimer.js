"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import { useUserProfile } from "@/context/UserProfileProvider";
import { claimGuestSession, readGuestSession } from "@/lib/guestSession";
import { funnel } from "@/lib/funnel";
import { loc } from "@/lib/loc";
import { GOLD, RADIUS, FONT_SIZE, FONT_WEIGHT, blackAlpha, goldAlpha } from "@/lib/tokens";

/**
 * Mounted once in the root layout. When a user who trained as a guest gets an
 * account, saves that session to it and says so.
 *
 * Waits for the user's profile doc to exist: sign-up writes the doc with a
 * plain setDoc (no merge) right after creating the account, so writing XP
 * before that would be overwritten.
 */
export default function GuestSessionClaimer() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { profile } = useUserProfile();
  const firedRef = useRef(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user?.uid || !profile || firedRef.current) return;
    if (!readGuestSession()) return;
    firedRef.current = true;
    claimGuestSession(user).then((r) => {
      if (!r.claimed) { firedRef.current = false; return; }
      funnel("guest_session_claimed", { score: r.score });
      setToast(r);
      setTimeout(() => setToast(null), 5000);
    });
  }, [user, profile]);

  if (!toast) return null;
  const locale = getLocaleFromPathname(pathname);
  const xp = toast.celebration?.missionJustCompleted ? 50 + (toast.celebration.streakBonus || 0) : null;

  return (
    <div role="status" style={{
      position: "fixed", left: "50%", transform: "translateX(-50%)",
      top: "calc(14px + env(safe-area-inset-top))", zIndex: 10000,
      maxWidth: "calc(100vw - 32px)", padding: "11px 16px", borderRadius: RADIUS.md,
      background: "rgba(16,16,18,0.96)", border: `1px solid ${goldAlpha(0.4)}`,
      boxShadow: `0 10px 30px ${blackAlpha(0.5)}`, color: "#fff",
      fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, textAlign: "center",
    }}>
      🥊 {loc(locale, "Анхны session чинь хадгалагдлаа", "첫 세션이 저장되었어요", "Your first session was saved")}
      {xp != null && <span style={{ color: GOLD }}> · +{xp} XP</span>}
    </div>
  );
}
