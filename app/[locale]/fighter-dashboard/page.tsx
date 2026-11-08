"use client";

// Fighter dashboard with live Firestore data + on-device clip analysis. Off by default (404):
// turn on with NEXT_PUBLIC_FIGHTER_DASHBOARD=1 once the rules / indexes are deployed (shop orders
// still need a payment provider — docs/architecture/platform-v2.md). Not linked from navigation.
import { useMemo } from "react";
import { notFound, useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocale } from "@/lib/i18n";
import { useFighterDashboard } from "@/hooks/useFighterDashboard";
import FighterDashboard from "@/components/dashboard/fighter/FighterDashboard";
import ClipAnalyzer from "@/components/dashboard/fighter/ClipAnalyzer";
import { firestoreClipStore } from "@/lib/videoAnalysis/store";
import { dashboardCopy } from "@/lib/dashboard/copy";
import type { Locale } from "@/lib/dashboard/types";

const ENABLED = process.env.NEXT_PUBLIC_FIGHTER_DASHBOARD === "1";

export default function FighterDashboardPage() {
  if (!ENABLED) notFound();
  return <LiveDashboard />;
}

function LiveDashboard() {
  const params = useParams<{ locale: string }>();
  const locale = getLocale(params?.locale) as Locale;
  const { user, loading } = useAuth() as { user: { uid: string } | null; loading: boolean };
  // While auth resolves, pass undefined-but-loading: the hook would report "unauthenticated".
  const uid = loading ? undefined : user?.uid ?? null;
  const dashboard = useFighterDashboard(uid);
  // One store per user (a new identity would make the analyzer mark a running clip "interrupted").
  const clipStore = useMemo(() => (uid ? firestoreClipStore(uid) : null), [uid]);
  const stance = dashboard.profile.status === "ready" ? dashboard.profile.data.stance : null;
  const state = loading
    ? { profile: { status: "loading" as const }, biomechanics: { status: "loading" as const }, benchmark: { status: "loading" as const }, videos: { status: "loading" as const }, orders: { status: "loading" as const } }
    : dashboard;
  return (
    <FighterDashboard
      state={state}
      locale={locale}
      onRetry={dashboard.refresh}
      videoAnalyzer={<ClipAnalyzer store={clipStore} stance={stance} copy={dashboardCopy(locale)} />}
    />
  );
}
