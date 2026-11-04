"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { captureRefFromUrl } from "@/lib/referral";

// ssr: false is only allowed inside Client Components — NOT in Server Component layout.js
const OnboardingModal      = dynamic(() => import("@/components/OnboardingModal"));
const PWAInstallBanner     = dynamic(() => import("@/components/PWAInstallBanner"),     { ssr: false });
const PushPermissionBanner = dynamic(() => import("@/components/PushPermissionBanner"), { ssr: false });

export default function ClientShell() {
  // Remember ?ref=<uid> from a shared DNA card for signup attribution.
  useEffect(() => { captureRefFromUrl(); }, []);

  return (
    <>
      <OnboardingModal />
      <PWAInstallBanner />
      <PushPermissionBanner />
    </>
  );
}
