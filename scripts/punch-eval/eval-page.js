"use client";
import { useEffect } from "react";
import { PunchPhaseDetector } from "@/lib/punchPhaseDetector";

const BASE = "https://storage.googleapis.com/mediapipe-models/pose_landmarker";
const MODELS = {
  lite: `${BASE}/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
  full: `${BASE}/pose_landmarker_full/float16/1/pose_landmarker_full.task`,
  heavy: `${BASE}/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task`,
};

async function run() {
  const q = new URLSearchParams(location.search);
  const src = q.get("src"), fps = Number(q.get("fps") || 10), model = q.get("model") || "lite", stance = q.get("stance") || "orthodox";
  const runtimeImport = new Function("url", "return import(url)");
  const { FilesetResolver, PoseLandmarker } = await runtimeImport("/mediapipe/vision_bundle.mjs");
  const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  const lm = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODELS[model], delegate: "CPU" },
    runningMode: "VIDEO", numPoses: 1,
    minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
  });
  const video = document.createElement("video");
  video.muted = true; video.playsInline = true; video.preload = "auto"; video.src = src;
  await new Promise((r, j) => { video.onloadeddata = r; video.onerror = () => j(new Error("video load failed")); });
  const seek = (t) => new Promise((r) => { video.onseeked = r; video.currentTime = t; });

  // Detector timing uses Date.now(); drive it from video time for reproducible runs.
  const realNow = Date.now; let sim = 1e9; Date.now = () => sim;
  const det = new PunchPhaseDetector(); det.setStance(stance);
  let frames = 0, withBody = 0; const vis = [];
  const dump = q.get("dump") === "1" ? [] : null; // per-frame landmarks for offline tuning (scripts/punch-eval/replay.mjs)
  for (let t = 0; t < video.duration - 1e-3; t += 1 / fps) {
    await seek(t);
    sim = 1e9 + Math.round(t * 1000);
    const res = lm.detectForVideo(video, Math.round(t * 1000) + 1);
    const L = res.landmarks?.[0];
    frames++;
    if (L && L.length >= 29) {
      withBody++;
      vis.push(Math.min(...[11, 12, 13, 14, 15, 16].map((i) => L[i].visibility ?? 0)));
      det.update(L, res.worldLandmarks?.[0] || null);
      if (dump) {
        const W = res.worldLandmarks?.[0];
        dump.push({
          t: Math.round(t * 1000),
          L: L.map((p) => [+p.x.toFixed(4), +p.y.toFixed(4), +p.z.toFixed(4), +(p.visibility ?? 0).toFixed(3)]),
          ...(W ? { W: W.map((p) => [+p.x.toFixed(4), +p.y.toFixed(4), +p.z.toFixed(4)]) } : {}),
        });
      }
    }
  }
  Date.now = realNow;
  window.__RESULT = {
    src, fps, model, stance, frames, withBody,
    armVisMedian: vis.sort((a, b) => a - b)[Math.floor(vis.length / 2)] ?? null,
    events: det.getPunchEvents().map((e) => ({ t: +((e.ts - 1e9) / 1000).toFixed(2), type: e.type, hand: e.hand, conf: e.confidenceLabel, travel: e.travel })),
    stanceHint: det.getStanceHint(),
    stats: det.getSessionStats(),
    ...(dump ? { landmarks: dump } : {}),
  };
}

export default function Eval() {
  useEffect(() => { run().catch((e) => { window.__RESULT = { error: String(e) }; }); }, []);
  return <p>evaluating…</p>;
}
