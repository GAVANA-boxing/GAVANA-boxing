"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { captureRefFromUrl } from "@/lib/referral";
import ErrorReporter from "@/components/ErrorReporter";

// ssr: false is only allowed inside Client Components — NOT in Server Component layout.js
const OnboardingGate       = dynamic(() => import("@/components/OnboardingGate"));
const AdminSessionBootstrap = dynamic(() => import("@/components/AdminSessionBootstrap"));
const PWAInstallBanner     = dynamic(() => import("@/components/PWAInstallBanner"),     { ssr: false });
const PushPermissionBanner = dynamic(() => import("@/components/PushPermissionBanner"), { ssr: false });

export default function ClientShell() {
  // Remember ?ref=<uid> from a shared DNA card for signup attribution.
  useEffect(() => { captureRefFromUrl(); }, []);

  return (
    <>
      <ErrorReporter />
      <OnboardingGate />
      <AdminSessionBootstrap />
      <PWAInstallBanner />
      <PushPermissionBanner />
    </>
  );
}
