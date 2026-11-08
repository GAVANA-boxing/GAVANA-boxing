"use client";

// Name, rank (with progress to the next one), streak, stance and style.
import { Flame, Trophy } from "lucide-react";
import type { FighterProfileSummary, Locale, SectionState } from "@/lib/dashboard/types";
import type { DashboardCopy } from "@/lib/dashboard/copy";
import { translate } from "@/lib/i18n";
import { archetypeName } from "@/lib/archetypes";
import { Meter } from "./SectionCard";

interface Props {
  state: SectionState<FighterProfileSummary>;
  locale: Locale;
  copy: DashboardCopy;
}

export default function ProfileHeader({ state, locale, copy }: Props) {
  if (state.status !== "ready") {
    return (
      <div className="flex items-center gap-4" aria-busy={state.status === "loading"}>
        <div className="h-14 w-14 shrink-0 rounded-full bg-white/[0.07] motion-safe:animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 rounded-full bg-white/[0.07] motion-safe:animate-pulse" />
          <div className="h-3 w-56 max-w-full rounded-full bg-white/[0.05] motion-safe:animate-pulse" />
        </div>
      </div>
    );
  }
  const p = state.data;
  const initials = p.displayName.split(/\s|-/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  const chips = [
    p.stance ? copy.stance[p.stance] : null,
    p.archetype ? (archetypeName(p.archetype, locale) as string) : null,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {p.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element -- user avatar from Storage, sized by CSS
          <img src={p.photoURL} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-[#FF3B30]/50" />
        ) : (
          <div aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#ff5a4f,#7a120c)] text-[18px] font-black text-white ring-2 ring-[#FF3B30]/40">
            {initials || "G"}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate font-[family-name:var(--font-display)] text-[26px] font-black uppercase leading-none tracking-[0.01em] text-white">
            {p.displayName}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {chips.map((c) => (
              <span key={c} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[12px] font-semibold text-white/75">{c}</span>
            ))}
            {p.streak.current > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F5C451]/10 px-2.5 py-0.5 text-[12px] font-semibold text-[#F5C451]">
                <Flame size={13} aria-hidden /> {copy.streak(p.streak.current)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="w-full rounded-[14px] border border-[#F5C451]/15 bg-[#F5C451]/[0.05] p-3 sm:w-64">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-[13px] font-bold text-[#F5C451]">
            <Trophy size={15} aria-hidden className="shrink-0" />
            <span className="truncate">{translate(locale, p.rank.key)}</span>
          </span>
          <span className="shrink-0 text-[12px] tabular-nums text-white/60">{p.rank.xp.toLocaleString("en-US")} XP</span>
        </div>
        <div className="mt-2">
          <Meter value={p.rank.nextKey ? p.rank.progressPct : 100} label={copy.nextRank} tone="gold" />
        </div>
        <p className="mt-1.5 truncate text-[12px] text-white/60">
          {p.rank.nextKey ? `${copy.nextRank}: ${translate(locale, p.rank.nextKey)} · ${p.rank.progressPct}%` : copy.topRank}
        </p>
      </div>
    </div>
  );
}
