"use client";

// Fight Knowledge Graph comparison: you vs one reference profile, six axes on one 0–100 scale.
// Emphasis form — "you" in the brand red (filled), the reference as a neutral outline. The source
// (who, how many athletes / clips) is always printed; without a published source we say so.
import { Radar as RadarIcon } from "lucide-react";
import type { BenchmarkComparison, Locale, SectionState } from "@/lib/dashboard/types";
import type { DashboardCopy } from "@/lib/dashboard/copy";
import SectionCard from "./SectionCard";
import { RadarCompare } from "./charts";

interface Props {
  state: SectionState<BenchmarkComparison | null>;
  locale: Locale;
  copy: DashboardCopy;
  onRetry?: () => void;
  className?: string;
}

export default function BenchmarkRadar({ state, locale, copy, onRetry, className }: Props) {
  return (
    <SectionCard
      title={copy.bench.title}
      subtitle={state.status === "ready" && state.data ? copy.bench.axisHelp : undefined}
      icon={RadarIcon}
      state={state}
      copy={copy}
      onRetry={onRetry}
      skeletonHeight={300}
      className={className}
    >
      {(cmp) => (cmp ? <Body cmp={cmp} locale={locale} copy={copy} /> : <p className="py-8 text-center text-[13px] leading-relaxed text-white/60">{copy.bench.empty}</p>)}
    </SectionCard>
  );
}

function Body({ cmp, locale, copy }: { cmp: BenchmarkComparison; locale: Locale; copy: DashboardCopy }) {
  const data = cmp.axes.map((a) => ({ axis: copy.axis[a.axis], you: a.you ?? 0, ref: a.benchmark, measured: a.you != null }));
  const refLabel = cmp.source.label[locale];

  return (
    <div className="space-y-3">
      <div aria-hidden>
        <RadarCompare
          data={data.map((d) => ({ axis: d.axis, you: d.measured ? d.you : null, ref: d.ref }))}
          youLabel={copy.bench.you} refLabel={copy.bench.ref}
        />
      </div>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-white/75">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#FF3B30]" aria-hidden />{copy.bench.you}</span>
        <span className="inline-flex min-w-0 items-center gap-1.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white/60" aria-hidden /><span className="truncate">{refLabel}</span></span>
      </div>

      {/* table view: every value readable without hovering */}
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-white/55">
            <th scope="col" className="py-1 text-left font-medium"><span className="sr-only">{copy.bench.title}</span></th>
            <th scope="col" className="py-1 text-right font-medium">{copy.bench.you}</th>
            <th scope="col" className="w-14 py-1 text-right font-medium">{copy.bench.ref}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.axis} className="border-t border-white/[0.05]">
              <th scope="row" className="py-1.5 text-left font-normal text-white/75">{d.axis}</th>
              <td className="py-1.5 text-right font-bold tabular-nums text-white">{d.measured ? d.you : copy.noValue}</td>
              <td className="py-1.5 text-right tabular-nums text-white/65">{d.ref}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-[11px] leading-snug text-white/55">
        {copy.bench.source(refLabel, cmp.source.athletes, cmp.source.clips)}
      </p>
    </div>
  );
}
