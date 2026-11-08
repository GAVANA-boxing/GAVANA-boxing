"use client";

// MediaPipe summary: round-score trend (one series, one axis), three form meters, the punch mix.
import { Activity } from "lucide-react";
import type { BiomechanicsSummary, PunchType, SectionState } from "@/lib/dashboard/types";
import { shortDate, type DashboardCopy } from "@/lib/dashboard/copy";
import SectionCard, { Meter } from "./SectionCard";
import { LineTrend } from "./charts";

const PUNCHES: PunchType[] = ["jab", "cross", "hook", "uppercut"];

interface Props {
  state: SectionState<BiomechanicsSummary>;
  copy: DashboardCopy;
  onRetry?: () => void;
  className?: string;
}

export default function BiomechanicsCard({ state, copy, onRetry, className }: Props) {
  return (
    <SectionCard
      title={copy.bio.title}
      subtitle={state.status === "ready" ? copy.bio.sub(state.data.sessionsInWindow) : undefined}
      icon={Activity}
      state={state}
      copy={copy}
      onRetry={onRetry}
      skeletonHeight={300}
      className={className}
    >
      {(bio) => (bio.sessionsInWindow === 0 ? <p className="py-8 text-center text-[13px] text-white/60">{copy.bio.empty}</p> : <Body bio={bio} copy={copy} />)}
    </SectionCard>
  );
}

function Body({ bio, copy }: { bio: BiomechanicsSummary; copy: DashboardCopy }) {
  const data = bio.trend.map((p) => ({ date: shortDate(p.date), score: p.score }));
  const mixTotal = PUNCHES.reduce((a, t) => a + bio.punchMix[t], 0);
  const mix = PUNCHES.map((t) => ({ t, n: bio.punchMix[t] })).sort((a, b) => b.n - a.n);
  const meters: Array<{ label: string; value: number | null }> = [
    { label: copy.bio.technique, value: bio.techniquePct },
    { label: copy.bio.balanced, value: bio.balancedPct },
    { label: copy.bio.guard, value: bio.guardGoodPct },
  ];
  const latest = bio.latest;

  return (
    <div className="space-y-5">
      <figure>
        <figcaption className="mb-2 text-[12px] font-semibold text-white/65">{copy.bio.trend}</figcaption>
        <div aria-hidden>
          <LineTrend data={data.map((d) => ({ label: d.date, value: d.score }))} seriesLabel={copy.bio.trend} />
        </div>
        {/* table view of the same numbers (screen readers; the chart itself is decorative to them) */}
        <table className="sr-only">
          <caption>{copy.bio.trend}</caption>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}><th scope="row">{d.date}</th><td>{d.score.toFixed(1)}</td></tr>
            ))}
          </tbody>
        </table>
      </figure>

      <div className="grid gap-3 sm:grid-cols-3">
        {meters.map((m) => (
          <div key={m.label} className="min-w-0">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="truncate text-[12px] text-white/65">{m.label}</span>
              <span className="text-[15px] font-bold tabular-nums text-white">{m.value == null ? copy.noValue : `${m.value}%`}</span>
            </div>
            <Meter value={m.value ?? 0} label={m.label} />
          </div>
        ))}
      </div>

      {mixTotal > 0 ? (
        <div>
          <p className="mb-2 text-[12px] font-semibold text-white/65">{copy.bio.mix}</p>
          <ul className="space-y-1.5">
            {mix.map(({ t, n }) => (
              <li key={t} className="grid grid-cols-[72px_1fr_44px] items-center gap-2">
                <span className="truncate text-[12px] text-white/75">{copy.punch[t]}</span>
                <span className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <span className="block h-full rounded-full bg-white/70" style={{ width: `${(n / mixTotal) * 100}%` }} />
                </span>
                <span className="text-right text-[12px] tabular-nums text-white/75">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {latest ? (
        <p className="text-[11px] text-white/55">
          {copy.bio.confidence}: {copy.confidence[latest.confidence]}
        </p>
      ) : null}
    </div>
  );
}
