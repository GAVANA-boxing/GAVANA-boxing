"use client";

// Recent uploaded clips and their MediaPipe analysis status (live via onSnapshot in the hook).
// Thumbnails are rendered by the analysis job with the pose overlay already drawn on the frame;
// until one exists we show a neutral placeholder (never a stock / athlete photo).
import type { LucideIcon } from "lucide-react";
import { CircleCheck, Hourglass, LoaderCircle, ScanLine, TriangleAlert, Video } from "lucide-react";
import type { SectionState, VideoAnalysis, VideoAnalysisStatus } from "@/lib/dashboard/types";
import { shortDate, type DashboardCopy } from "@/lib/dashboard/copy";
import SectionCard, { Meter } from "./SectionCard";

const STATUS: Record<VideoAnalysisStatus, { icon: LucideIcon; cls: string; spin?: boolean }> = {
  queued: { icon: Hourglass, cls: "bg-white/[0.07] text-white/75" },
  processing: { icon: LoaderCircle, cls: "bg-sky-400/10 text-sky-300", spin: true },
  completed: { icon: CircleCheck, cls: "bg-emerald-400/10 text-emerald-300" },
  failed: { icon: TriangleAlert, cls: "bg-rose-400/10 text-rose-300" },
};

interface Props {
  state: SectionState<VideoAnalysis[]>;
  copy: DashboardCopy;
  onRetry?: () => void;
  className?: string;
}

export default function RecentVideos({ state, copy, onRetry, className }: Props) {
  return (
    <SectionCard title={copy.videos.title} icon={Video} state={state} copy={copy} onRetry={onRetry} skeletonHeight={220} className={className}>
      {(videos) =>
        videos.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-white/60">{copy.videos.empty}</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {videos.map((v) => <VideoRow key={v.id} v={v} copy={copy} />)}
          </ul>
        )
      }
    </SectionCard>
  );
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

function VideoRow({ v, copy }: { v: VideoAnalysis; copy: DashboardCopy }) {
  const st = STATUS[v.status];
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[12px] border border-white/[0.07] bg-[radial-gradient(circle_at_50%_30%,rgba(255,59,48,0.18),rgba(255,255,255,0.02))]">
        {v.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- analysis thumbnail from Storage
          <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <ScanLine size={22} aria-hidden className="absolute inset-0 m-auto text-white/40" />
        )}
        {v.durationSec != null ? (
          <span className="absolute bottom-0.5 right-0.5 rounded-[6px] bg-black/70 px-1 text-[11px] leading-[16px] tabular-nums text-white">{mmss(v.durationSec)}</span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold tabular-nums text-white">{shortDate(v.createdAt)}</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>
            <st.icon size={12} aria-hidden className={st.spin ? "motion-safe:animate-spin" : undefined} />
            {copy.videoStatus[v.status]}
          </span>
        </div>
        {v.status === "processing" ? (
          <div className="mt-2 flex items-center gap-2">
            <Meter value={v.progressPct ?? 0} label={copy.videoStatus.processing} tone="white" />
            <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-white/65">{v.progressPct ?? 0}%</span>
          </div>
        ) : null}
        {v.status === "completed" ? (
          <p className="mt-1 truncate text-[12px] text-white/60">
            {[v.punches != null ? copy.videos.punches(v.punches) : null, v.poseFramesPct != null ? copy.videos.poseFrames(Math.round(v.poseFramesPct)) : null]
              .filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {v.status === "failed" ? <p className="mt-1 truncate text-[12px] text-rose-300/90">{copy.videos.failed}</p> : null}
      </div>

      {v.status === "completed" && v.score != null ? (
        <div className="shrink-0 text-right">
          <span className="block text-[22px] font-extrabold leading-none text-white">{v.score.toFixed(1)}</span>
          <span className="text-[11px] text-white/55">/ 10</span>
        </div>
      ) : null}
    </li>
  );
}
