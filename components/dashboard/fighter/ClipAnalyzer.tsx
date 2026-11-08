"use client";

// "Analyse a video": pick a clip → it plays in the browser with the live skeleton overlay while
// MediaPipe analyses it (hooks/useClipAnalysis) → result + skeleton thumbnail. Progress and the
// result are written to the store, so the Recent videos list updates live through onSnapshot.
import { useRef } from "react";
import { CircleCheck, LoaderCircle, ShieldCheck, TriangleAlert, Upload, X } from "lucide-react";
import { useClipAnalysis, type ClipPhase } from "@/hooks/useClipAnalysis";
import type { ClipStore } from "@/lib/videoAnalysis/store";
import type { DashboardCopy } from "@/lib/dashboard/copy";
import PoseSkeletonOverlay from "@/components/train/PoseSkeletonOverlay";
import { Meter } from "./SectionCard";

interface Props {
  store: ClipStore | null;
  stance?: string | null;
  copy: DashboardCopy;
}

const RUNNING: ClipPhase[] = ["reading", "loading_model", "analyzing", "saving"];
const BTN =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] px-4 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF3B30] disabled:opacity-50";

export default function ClipAnalyzer({ store, stance, copy }: Props) {
  const { videoRef, state, start, cancel, reset, getLatestPose } = useClipAnalysis({ store, stance });
  const inputRef = useRef<HTMLInputElement>(null);
  const running = RUNNING.includes(state.phase);
  const showStage = running;
  const pick = () => { if (state.phase !== "idle" && !running) reset(); inputRef.current?.click(); };

  return (
    <div className="mb-4 space-y-3" data-testid="clip-analyzer" data-phase={state.phase}>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-testid="clip-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void start(f);
        }}
      />

      {!running ? (
        <div className="flex flex-col gap-2 rounded-[14px] border border-dashed border-white/12 bg-white/[0.02] p-3 sm:flex-row sm:items-center">
          <button type="button" onClick={pick} disabled={!store} className={`${BTN} bg-[#FF3B30] text-white hover:bg-[#e8352b]`}>
            <Upload size={16} aria-hidden />
            {state.phase === "idle" ? copy.clip.analyze : copy.clip.another}
          </button>
          <p className="flex items-start gap-1.5 text-[11px] leading-snug text-white/60">
            <ShieldCheck size={14} aria-hidden className="mt-px shrink-0 text-emerald-300/80" />
            {copy.clip.privacy}
          </p>
        </div>
      ) : null}

      {/* The <video> stays mounted (the hook needs it before a file is chosen); shown while running. */}
      <div className={showStage ? "space-y-2" : "hidden"}>
        <div className="relative mx-auto aspect-[3/4] w-full max-w-[300px] overflow-hidden rounded-[14px] bg-black">
          <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
          <PoseSkeletonOverlay getLatestPose={getLatestPose} videoRef={videoRef} isActive={state.phase === "analyzing"} style={undefined} />
          {state.phase !== "analyzing" ? (
            <div className="absolute inset-0 grid place-items-center bg-black/55">
              <LoaderCircle size={28} aria-hidden className="text-white/80 motion-safe:animate-spin" />
            </div>
          ) : null}
        </div>
        <div className="mx-auto w-full max-w-[300px]">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px]">
            <span className="font-semibold text-white" data-testid="clip-status" role="status">
              {state.phase === "analyzing" ? `${copy.clip.phase.analyzing} · ${state.progressPct}%` : running ? copy.clip.phase[state.phase as Exclude<ClipPhase, "idle" | "done" | "failed">] : ""}
            </span>
            {state.phase !== "saving" ? (
              <button type="button" onClick={cancel} className={`${BTN} min-h-10 px-2 text-white/75 hover:text-white`}>
                <X size={15} aria-hidden /> {copy.clip.cancel}
              </button>
            ) : null}
          </div>
          <Meter value={state.progressPct} label={copy.clip.phase.analyzing} tone="white" />
          <p className="mt-1.5 text-[11px] text-white/55">{copy.clip.realtime}</p>
        </div>
      </div>

      {state.phase === "done" && state.result ? (
        <div className="flex items-center gap-3 rounded-[14px] border border-emerald-400/20 bg-emerald-400/[0.05] p-3" data-testid="clip-result">
          {state.result.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- skeleton-only data URL made on this device
            <img src={state.result.thumbnailUrl} alt="" className="h-14 w-14 shrink-0 rounded-[10px]" />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-300">
              <CircleCheck size={15} aria-hidden /> {copy.clip.phase.done}
            </p>
            <p className="mt-0.5 text-[12px] text-white/65">
              {copy.videos.punches(state.result.punches)} · {copy.videos.poseFrames(state.result.poseFramesPct)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="block text-[22px] font-extrabold leading-none text-white">{state.result.score == null ? copy.noValue : state.result.score.toFixed(1)}</span>
            <span className="text-[11px] text-white/55">/ 10</span>
          </div>
        </div>
      ) : null}

      {state.phase === "failed" && state.error ? (
        <p role="alert" data-testid="clip-error" data-code={state.error} className="flex items-start gap-2 rounded-[12px] border border-rose-400/20 bg-rose-400/[0.05] p-3 text-[13px] text-rose-200">
          <TriangleAlert size={16} aria-hidden className="mt-px shrink-0" />
          {copy.clip.error[state.error]}
        </p>
      ) : null}
    </div>
  );
}
