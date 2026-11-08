"use client";

// One dashboard panel: title row + the section's own loading skeleton / error (with retry) / content.
// A failing section never blanks its neighbours.
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CircleAlert, Lock, RefreshCw, WifiOff } from "lucide-react";
import type { DashboardError, SectionState } from "@/lib/dashboard/types";
import type { DashboardCopy } from "@/lib/dashboard/copy";

export const cardClass =
  "rounded-[18px] border border-white/[0.07] bg-white/[0.035] p-4 sm:p-5";

interface SectionCardProps<T> {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  state: SectionState<T>;
  copy: DashboardCopy;
  onRetry?: () => void;
  /** Skeleton height while loading (px), roughly the ready height so nothing jumps. */
  skeletonHeight?: number;
  className?: string;
  /** Shown under the title in every state (e.g. the clip analyzer above the video list). */
  top?: ReactNode;
  children: (data: T) => ReactNode;
}

export default function SectionCard<T>({
  title, subtitle, icon: Icon, state, copy, onRetry, skeletonHeight = 160, className = "", top, children,
}: SectionCardProps<T>) {
  return (
    <section className={`${cardClass} min-w-0 ${className}`} aria-busy={state.status === "loading"}>
      <header className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#FF3B30]/10 text-[#FF5A4F]">
          <Icon size={18} strokeWidth={2.2} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold leading-tight text-white">{title}</h2>
          {subtitle && state.status === "ready" ? <p className="mt-0.5 text-[12px] text-white/60">{subtitle}</p> : null}
        </div>
      </header>
      {top}
      {state.status === "loading" ? <Skeleton height={skeletonHeight} /> : null}
      {state.status === "error" ? <SectionError error={state.error} copy={copy} onRetry={onRetry} /> : null}
      {state.status === "ready" ? children(state.data) : null}
    </section>
  );
}

function Skeleton({ height }: { height: number }) {
  return (
    <div className="space-y-2.5" style={{ minHeight: height }} aria-hidden>
      <div className="h-3 w-2/5 rounded-full bg-white/[0.07] motion-safe:animate-pulse" />
      <div className="rounded-[12px] bg-white/[0.05] motion-safe:animate-pulse" style={{ height: Math.max(40, height - 48) }} />
      <div className="h-3 w-3/5 rounded-full bg-white/[0.07] motion-safe:animate-pulse" />
    </div>
  );
}

const ERROR_ICON: Record<DashboardError["code"], LucideIcon> = {
  "permission-denied": Lock, unauthenticated: Lock, unavailable: WifiOff, "not-found": CircleAlert, unknown: CircleAlert,
};

function SectionError({ error, copy, onRetry }: { error: DashboardError; copy: DashboardCopy; onRetry?: () => void }) {
  const Icon = ERROR_ICON[error.code];
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-[12px] border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="flex items-center gap-2 text-[13px] text-white/75">
        <Icon size={16} aria-hidden className="shrink-0 text-[#FF7A70]" />
        {copy.error[error.code]}
      </p>
      {error.retryable && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-10 items-center gap-2 rounded-[12px] border border-white/10 bg-white/[0.06] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF3B30]"
        >
          <RefreshCw size={15} aria-hidden />
          {copy.retry}
        </button>
      ) : null}
    </div>
  );
}

/** Thin progress / share meter: one hue on a same-hue track. */
export function Meter({ value, label, tone = "red" }: { value: number; label: string; tone?: "red" | "gold" | "white" }) {
  const fill = tone === "gold" ? "bg-[#F5C451]" : tone === "white" ? "bg-white/70" : "bg-[#FF3B30]";
  const track = tone === "gold" ? "bg-[#F5C451]/15" : tone === "white" ? "bg-white/10" : "bg-[#FF3B30]/15";
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full ${track}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={label}>
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
