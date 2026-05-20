"use client";

import dynamic from "next/dynamic";

// ssr: false is only allowed inside Client Components — NOT in Server Component layout.js
const OnboardingModal      = dynamic(() => import("@/components/OnboardingModal"));
const PWAInstallBanner     = dynamic(() => import("@/components/PWAInstallBanner"),     { ssr: false });
const PushPermissionBanner = dynamic(() => import("@/components/PushPermissionBanner"), { ssr: false });

export default function ClientShell() {
  return (
    <>
      <OnboardingModal />
      <PWAInstallBanner />
      <PushPermissionBanner />
    </>
  );
}
