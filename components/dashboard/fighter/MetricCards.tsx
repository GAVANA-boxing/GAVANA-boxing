"use client";

// Top row: four stat tiles. Each value comes from one section; a tile whose section is still
// loading shows a skeleton, and one whose section failed shows "—" (the section card below
// carries the error and the retry button — no duplicate error UI here).
import type { LucideIcon } from "lucide-react";
import { Package, Target, Timer, Zap } from "lucide-react";
import type { BiomechanicsSummary, FighterProfileSummary, OrderSummary, SectionState } from "@/lib/dashboard/types";
import type { DashboardCopy } from "@/lib/dashboard/copy";
import { isActiveOrder } from "@/lib/dashboard/mappers";

interface Props {
  profile: SectionState<FighterProfileSummary>;
  biomechanics: SectionState<BiomechanicsSummary>;
  orders: SectionState<OrderSummary[]>;
  copy: DashboardCopy;
  /** how many videos the live listener loads (useFighterDashboard videoLimit) */
  videoWindow?: number;
}

interface Tile {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string | null;   // null = loading
  unit?: string;
  sub: string;
  accent?: boolean;
}

export default function MetricCards({ profile, biomechanics, orders, copy, videoWindow = 6 }: Props) {
  const dash = copy.noValue;
  const pick = <T, R>(s: SectionState<T>, f: (d: T) => R, fallback: R): R | null =>
    s.status === "loading" ? null : s.status === "ready" ? f(s.data) : fallback;

  const totals = pick(profile, (p) => p.totals, null);
  const bio = pick(biomechanics, (b) => b, null);
  const latest = bio?.latest ?? null;
  const activeOrders = pick(orders, (o) => o.filter(isActiveOrder).length, null);

  const tiles: Tile[] = [
    {
      key: "training", icon: Timer, label: copy.kpi.training,
      value: profile.status === "loading" ? null : totals ? copy.duration(totals.trainingMinutes) : dash,
      // profile summary: rounds + analysed videos ("6+" while the count is only the live window)
      sub: totals ? `${copy.sessionsN(totals.sessions)} · ${copy.videosN(totals.analyzedVideos, totals.partial && totals.analyzedVideos >= videoWindow)}` : "",
    },
    {
      key: "speed", icon: Zap, label: copy.kpi.speed, accent: true,
      value: biomechanics.status === "loading" ? null : bio?.avgReturnMs != null ? String(bio.avgReturnMs) : dash,
      unit: bio?.avgReturnMs != null ? copy.ms : undefined,
      sub: latest?.speed.rating ? `${copy.rating[latest.speed.rating]} · ${copy.speedSub}` : copy.speedSub,
    },
    {
      key: "technique", icon: Target, label: copy.kpi.technique,
      value: biomechanics.status === "loading" ? null : bio?.techniquePct != null ? String(bio.techniquePct) : dash,
      unit: bio?.techniquePct != null ? "%" : undefined,
      sub: latest && latest.technique.checksTotal > 0 ? copy.techniqueSub(latest.technique.checksPassed, latest.technique.checksTotal) : "",
    },
    {
      key: "orders", icon: Package, label: copy.kpi.orders,
      value: orders.status === "loading" ? null : activeOrders != null ? String(activeOrders) : dash,
      sub: copy.ordersSub,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.key}
          className={`relative min-w-0 overflow-hidden rounded-[16px] border p-3.5 sm:p-4 ${
            t.accent ? "border-[#FF3B30]/25 bg-[linear-gradient(160deg,rgba(255,59,48,0.14),rgba(255,59,48,0.02))]" : "border-white/[0.07] bg-white/[0.03]"
          }`}
        >
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-white/65">
            <t.icon size={14} aria-hidden className={t.accent ? "text-[#FF5A4F]" : "text-white/60"} />
            <span className="truncate">{t.label}</span>
          </div>
          {t.value == null ? (
            <div className="mt-2.5 h-8 w-20 rounded-[8px] bg-white/[0.07] motion-safe:animate-pulse" aria-hidden />
          ) : (
            <p className="mt-1.5 truncate text-[22px] font-extrabold leading-tight text-white sm:text-[28px]">
              {t.value}
              {t.unit ? <span className="ml-1 text-[13px] font-semibold text-white/60">{t.unit}</span> : null}
            </p>
          )}
          {t.sub ? <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/55">{t.sub}</p> : null}
        </div>
      ))}
    </div>
  );
}
