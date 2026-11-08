"use client";

// Fighter dashboard layout (presentational — data comes in as FighterDashboardState):
//   profile header
//   KPI row          training · punch speed · technique · active orders
//   centre           biomechanics (MediaPipe) | FKG radar
//   bottom           recent video analyses    | order history
// Live data: hooks/useFighterDashboard. Demo data: lib/dashboard/mockData.
import type { ReactNode } from "react";
import type { FighterDashboardState, Locale } from "@/lib/dashboard/types";
import { dashboardCopy } from "@/lib/dashboard/copy";
import ProfileHeader from "./ProfileHeader";
import MetricCards from "./MetricCards";
import BiomechanicsCard from "./BiomechanicsCard";
import BenchmarkRadar from "./BenchmarkRadar";
import RecentVideos from "./RecentVideos";
import OrderHistory from "./OrderHistory";

interface Props {
  state: FighterDashboardState;
  locale: Locale;
  onRetry?: () => void;
  /** <ClipAnalyzer/> wired to a store; omitted = no upload button */
  videoAnalyzer?: ReactNode;
}

export default function FighterDashboard({ state, locale, onRetry, videoAnalyzer }: Props) {
  const copy = dashboardCopy(locale);
  return (
    <main className="min-h-dvh bg-[#090909] bg-[radial-gradient(640px_320px_at_50%_-80px,rgba(255,59,48,0.14),transparent_70%)] bg-no-repeat px-4 pb-24 pt-5 text-white sm:px-6">
      <div className="mx-auto w-full max-w-[1120px] space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#FF5A4F]">{copy.title}</p>
        <ProfileHeader state={state.profile} locale={locale} copy={copy} />
        <MetricCards profile={state.profile} biomechanics={state.biomechanics} orders={state.orders} copy={copy} />
        <div className="grid gap-4 lg:grid-cols-5">
          <BiomechanicsCard state={state.biomechanics} copy={copy} onRetry={onRetry} className="lg:col-span-3" />
          <BenchmarkRadar state={state.benchmark} locale={locale} copy={copy} onRetry={onRetry} className="lg:col-span-2" />
        </div>
        <div className="grid gap-4 lg:grid-cols-5">
          <RecentVideos state={state.videos} copy={copy} onRetry={onRetry} className="lg:col-span-3" analyzer={videoAnalyzer} />
          <OrderHistory state={state.orders} copy={copy} onRetry={onRetry} className="lg:col-span-2" />
        </div>
      </div>
    </main>
  );
}
