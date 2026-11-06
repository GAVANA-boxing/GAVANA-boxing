"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useUserProfile } from "@/context/UserProfileProvider";
import { getLocaleFromPathname } from "@/lib/i18n";

/**
 * Signed-in users who have not finished onboarding are sent to /onboarding
 * (from any page except onboarding itself). Renders nothing.
 * Replaces the old OnboardingModal, whose question UI was never shown.
 */
export default function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  useEffect(() => {
    if (authLoading || !user?.uid || profileLoading) return;
    if (pathname?.includes("/onboarding")) return;
    // Both field names: onboardingComplete (current page) and onboarding.completed (old modal).
    const done = profile?.onboardingComplete === true || profile?.onboarding?.completed === true;
    if (!done) router.replace(`/${getLocaleFromPathname(pathname)}/onboarding`);
  }, [authLoading, user?.uid, profileLoading, profile, pathname, router]);

  return null;
}
