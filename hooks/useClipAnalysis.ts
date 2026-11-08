"use client";

// Analyse an uploaded clip in the browser with the SAME pipeline as a live round
// (usePoseDetection: MediaPipe → punch detector → session summary → computeFinalScore), so a
// clip's score means what a round's score means. The punch detector times punches with the wall
// clock, so the clip is played at normal speed (it is not seeked frame by frame).
//
//   idle → reading (metadata, limits) → loading_model → analyzing (plays, live overlay)
//        → saving → done | failed
// Status goes to the store as it happens (queued → processing + progress → completed | failed);
// the dashboard's onSnapshot listener shows it live. The video itself never leaves the device.
import { useCallback, useEffect, useRef, useState } from "react";
import { usePoseDetection } from "@/hooks/usePoseDetection";
import {
  clipProgress, clipResultPatch, nextProgressWrite, validateClipDuration, validateClipFile,
  type ClipErrorCode, type Pt,
} from "@/lib/videoAnalysis/clip";
import { skeletonThumbnail } from "@/lib/videoAnalysis/thumbnail";
import type { ClipStore } from "@/lib/videoAnalysis/store";

export type ClipPhase = "idle" | "reading" | "loading_model" | "analyzing" | "saving" | "done" | "failed";

export interface ClipResult {
  score: number | null;
  punches: number;
  poseFramesPct: number;
  thumbnailUrl: string | null;
}

export interface ClipAnalysisState {
  phase: ClipPhase;
  progressPct: number;
  error: ClipErrorCode | null;
  result: ClipResult | null;
}

const IDLE: ClipAnalysisState = { phase: "idle", progressPct: 0, error: null, result: null };
const RUNNING: ClipPhase[] = ["reading", "loading_model", "analyzing", "saving"];

function waitForMetadata(video: HTMLVideoElement): Promise<number> {
  return new Promise((resolve, reject) => {
    const done = () => { cleanup(); resolve(video.duration); };
    const fail = () => { cleanup(); reject(new Error("unsupported_video")); };
    const cleanup = () => { video.removeEventListener("loadedmetadata", done); video.removeEventListener("error", fail); };
    video.addEventListener("loadedmetadata", done);
    video.addEventListener("error", fail);
  });
}

export function useClipAnalysis({ store, stance = "orthodox" }: { store: ClipStore | null; stance?: string | null }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<ClipAnalysisState>(IDLE);
  const phaseRef = useRef<ClipPhase>("idle");
  const idRef = useRef<string | null>(null);
  const urlRef = useRef<string | null>(null);
  const lastWriteRef = useRef(0);
  const thumbLmRef = useRef<Pt[] | null>(null);

  const pose = usePoseDetection({
    videoRef,
    isActive: state.phase === "analyzing",
    stance: stance || "orthodox",
    load: state.phase !== "idle",
  });
  // usePoseDetection returns a new object every render; effects read it through a ref so a
  // progress re-render never re-runs them (that would restart playback).
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const poseStatus = pose.poseStatus;

  const set = useCallback((next: Partial<ClipAnalysisState>) => {
    setState((s) => {
      const merged = { ...s, ...next };
      phaseRef.current = merged.phase;
      return merged;
    });
  }, []);

  const releaseVideo = useCallback(() => {
    const v = videoRef.current;
    if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
  }, []);

  /** Stop with an error; the store doc (if created) is marked failed — best effort. */
  const fail = useCallback((error: ClipErrorCode) => {
    const id = idRef.current;
    idRef.current = null;
    videoRef.current?.pause();
    set({ phase: "failed", error });
    if (id && store) store.update(id, { status: "failed", error }).catch(() => { /* offline — shown locally */ });
  }, [set, store]);

  const start = useCallback(async (file: File) => {
    if (!store || RUNNING.includes(phaseRef.current)) return;
    const bad = validateClipFile(file);
    if (bad) { set({ ...IDLE, phase: "failed", error: bad }); return; }
    const video = videoRef.current;
    if (!video) return;
    releaseVideo();
    idRef.current = null;
    lastWriteRef.current = 0;
    thumbLmRef.current = null;
    set({ ...IDLE, phase: "reading" });
    urlRef.current = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = urlRef.current;
    let duration: number;
    try {
      duration = await waitForMetadata(video);
    } catch {
      fail("unsupported_video");
      return;
    }
    const badLen = validateClipDuration(duration);
    if (badLen) { fail(badLen); return; }
    try {
      idRef.current = await store.create({ durationSec: duration });
    } catch {
      fail("save_failed");
      return;
    }
    if (phaseRef.current !== "reading") return; // cancelled meanwhile
    set({ phase: "loading_model" });
  }, [store, set, fail, releaseVideo]);

  // Model ready → mark processing → play.
  useEffect(() => {
    if (state.phase !== "loading_model") return;
    if (poseStatus === "failed") { fail("model_load_failed"); return; }
    if (poseStatus !== "ready") return;
    const id = idRef.current;
    if (id && store) store.update(id, { status: "processing", progressPct: 0 }).catch(() => { /* next write retries */ });
    set({ phase: "analyzing", progressPct: 0 });
  }, [state.phase, poseStatus, store, set, fail]);

  // Finish: summary of the round the clip just "played" → result patch → store.
  const finish = useCallback(async () => {
    const video = videoRef.current;
    if (!video || phaseRef.current !== "analyzing") return;
    set({ phase: "saving", progressPct: 100 });
    const p = poseRef.current;
    const patch = clipResultPatch({ summary: p.computeSessionSummary(), debug: p.getDebugInfo() });
    const id = idRef.current;
    if (patch.status === "failed") { fail(patch.error); return; }
    const lm = thumbLmRef.current ?? (p.getLatestPose().landmarks as Pt[] | null);
    const thumbnailUrl = skeletonThumbnail(lm, video.videoWidth, video.videoHeight);
    try {
      if (id && store) await store.update(id, { ...patch, thumbnailUrl });
    } catch {
      fail("save_failed");
      return;
    }
    idRef.current = null;
    set({ phase: "done", result: { score: patch.score, punches: patch.punches, poseFramesPct: patch.poseFramesPct, thumbnailUrl } });
  }, [set, fail, store]);

  // While analysing: play, track progress, pause when the tab is hidden (no frames are read then).
  useEffect(() => {
    if (state.phase !== "analyzing") return undefined;
    const video = videoRef.current;
    if (!video) return undefined;
    const onTime = () => {
      const pct = clipProgress(video.currentTime, video.duration);
      setState((s) => (s.progressPct === pct ? s : { ...s, progressPct: pct }));
      const w = nextProgressWrite(lastWriteRef.current, pct);
      const id = idRef.current;
      if (w != null && id && store) {
        lastWriteRef.current = w;
        store.update(id, { status: "processing", progressPct: w }).catch(() => { /* best effort */ });
      }
      // Thumbnail pose: the latest body seen up to ~45 % of the clip.
      if (pct <= 45) {
        const lm = poseRef.current.getLatestPose().landmarks as Pt[] | null;
        if (lm) thumbLmRef.current = lm.map((p) => ({ ...p }));
      }
    };
    const onEnded = () => { void finish(); };
    const onError = () => fail("unsupported_video");
    const onVisibility = () => {
      if (document.visibilityState === "hidden") video.pause();
      else if (phaseRef.current === "analyzing") video.play().catch(() => { /* resumes on next tap */ });
    };
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);
    document.addEventListener("visibilitychange", onVisibility);
    video.currentTime = 0;
    video.play().catch(() => fail("unsupported_video"));
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [state.phase, store, finish, fail]);

  const cancel = useCallback(() => {
    if (RUNNING.includes(phaseRef.current)) fail("interrupted");
  }, [fail]);

  const reset = useCallback(() => {
    if (RUNNING.includes(phaseRef.current)) return;
    releaseVideo();
    set(IDLE);
  }, [releaseVideo, set]);

  // Leaving the page mid-analysis marks the doc failed (best effort) and frees the file.
  useEffect(() => () => {
    if (RUNNING.includes(phaseRef.current) && idRef.current && store) {
      store.update(idRef.current, { status: "failed", error: "interrupted" }).catch(() => { /* page is going away */ });
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, [store]);

  return { videoRef, state, start, cancel, reset, getLatestPose: pose.getLatestPose };
}
