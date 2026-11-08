"use client";

// Fighter dashboard with live Firestore data. Off by default (404) until the data it shows
// exists: shop orders (payment provider + webhook) and uploaded-video analyses (status docs).
// Turn on with NEXT_PUBLIC_FIGHTER_DASHBOARD=1 once those pipelines and their rules are deployed
// (docs/architecture/platform-v2.md). Not linked from navigation.
import { notFound, useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocale } from "@/lib/i18n";
import { useFighterDashboard } from "@/hooks/useFighterDashboard";
import FighterDashboard from "@/components/dashboard/fighter/FighterDashboard";
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
  const dashboard = useFighterDashboard(loading ? undefined : user?.uid ?? null);
  const state = loading
    ? { profile: { status: "loading" as const }, biomechanics: { status: "loading" as const }, benchmark: { status: "loading" as const }, videos: { status: "loading" as const }, orders: { status: "loading" as const } }
    : dashboard;
  return <FighterDashboard state={state} locale={locale} onRetry={dashboard.refresh} />;
}
