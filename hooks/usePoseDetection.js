"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { computePoseMetrics, poseMetricsScore } from "@/lib/mediapipePoseMetrics";

// Loaded from CDN via script tag — bypasses webpack entirely so no bundling errors.
// Version must match the WASM path version below.
const MP_SCRIPT_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/vision_bundle.js";
const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const THROTTLE_MS = 100; // ~10fps

// Key landmark indices for presence checks
const KEY_LANDMARKS = {
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_WRIST: 15,    R_WRIST: 16,
  L_HIP: 23,      R_HIP: 24,
  L_ANKLE: 27,    R_ANKLE: 28,
};

// Singleton script-load promise — only one script tag ever injected
let _scriptPromise = null;

function loadMediaPipeFromCDN() {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));

  // Already loaded
  if (window.MediaPipeTasksVision?.PoseLandmarker) {
    return Promise.resolve(window.MediaPipeTasksVision);
  }

  if (!_scriptPromise) {
    _scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = MP_SCRIPT_URL;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        const lib = window.MediaPipeTasksVision;
        if (lib?.PoseLandmarker && lib?.FilesetResolver) {
          resolve(lib);
        } else {
          reject(new Error("Script loaded but PoseLandmarker not on window.MediaPipeTasksVision"));
        }
      };
      script.onerror = () => reject(new Error("CDN script failed to load: " + MP_SCRIPT_URL));
      document.head.appendChild(script);
    });
  }

  return _scriptPromise;
}

// "loading" | "ready" | "failed"
export function usePoseDetection({ videoRef, isActive }) {
  const [poseStatus, setPoseStatus] = useState("loading");
  const [poseError, setPoseError] = useState(null);

  const landmarkerRef     = useRef(null);
  const lastRunRef        = useRef(0);
  const rafRef            = useRef(null);
  const frameMetricsRef   = useRef([]);
  const latestLandmarksRef = useRef(null);

  // Diagnostic counters (refs — no re-render on update)
  const frameAttemptRef   = useRef(0);  // frames fed to detectForVideo
  const detectCountRef    = useRef(0);  // frames that returned >= 1 landmark
  const fpsCountRef       = useRef(0);
  const fpsRef            = useRef(0);
  const lastFpsTickRef    = useRef(0);
  const lastFrameErrorRef = useRef(null);

  // ── Load PoseLandmarker via CDN script tag ─────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { PoseLandmarker, FilesetResolver } = await loadMediaPipeFromCDN();
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);

        // Try GPU first; fall back to CPU (GPU fails silently on many mobile browsers)
        let landmarker;
        try {
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        } catch {
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        }

        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setPoseStatus("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setPoseStatus("failed");
          setPoseError(err?.message || String(err));
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Detection loop ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive || poseStatus !== "ready") {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    lastFpsTickRef.current = performance.now();
    fpsCountRef.current = 0;

    function loop() {
      rafRef.current = requestAnimationFrame(loop);

      const now = performance.now();
      if (now - lastRunRef.current < THROTTLE_MS) return;
      lastRunRef.current = now;

      // FPS calc every second
      fpsCountRef.current++;
      const elapsed = now - lastFpsTickRef.current;
      if (elapsed >= 1000) {
        fpsRef.current = Math.round((fpsCountRef.current / elapsed) * 1000);
        fpsCountRef.current = 0;
        lastFpsTickRef.current = now;
      }

      const video = videoRef.current;
      if (!video || video.readyState < 2 || !landmarkerRef.current) return;

      frameAttemptRef.current++;
      try {
        const res = landmarkerRef.current.detectForVideo(video, now);
        const landmarks = res.landmarks?.[0];
        if (landmarks && landmarks.length >= 29) {
          latestLandmarksRef.current = landmarks;
          detectCountRef.current++;
          lastFrameErrorRef.current = null;
          const metrics = computePoseMetrics(landmarks);
          if (metrics) frameMetricsRef.current.push(metrics);
        } else {
          latestLandmarksRef.current = null;
        }
      } catch (err) {
        lastFrameErrorRef.current = err?.message || String(err);
      }
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, poseStatus, videoRef]);

  // Clear buffers at session start
  useEffect(() => {
    if (isActive) {
      frameMetricsRef.current = [];
      latestLandmarksRef.current = null;
      detectCountRef.current = 0;
      frameAttemptRef.current = 0;
    }
  }, [isActive]);

  // ── Session summary ────────────────────────────────────────────────────
  const computeSessionSummary = useCallback(() => {
    const frames = frameMetricsRef.current;
    if (frames.length < 5) return null;

    const METRIC_KEYS = [
      { key: "stanceWidth",    valKey: "ratio" },
      { key: "guardHeight",    valKey: "deltaY" },
      { key: "punchExtension", valKey: "angleDeg" },
      { key: "rotation",       valKey: "rotationDeg" },
      { key: "balance",        valKey: "drift" },
    ];

    const summary = {};
    for (const { key, valKey } of METRIC_KEYS) {
      const valid = frames.filter((f) => f[key] !== null);
      if (!valid.length) { summary[key] = null; continue; }

      const statusCounts = {};
      for (const f of valid) statusCounts[f[key].status] = (statusCounts[f[key].status] || 0) + 1;
      const dominantStatus = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0][0];
      const avgVal = valid.reduce((s, f) => s + f[key][valKey], 0) / valid.length;

      summary[key] = {
        ...valid[0][key],
        [valKey]: Math.round(avgVal * 100) / 100,
        status: dominantStatus,
      };
    }

    summary.score = poseMetricsScore(summary);
    summary.frameCount = frames.length;
    return summary;
  }, []);

  // ── Debug info snapshot ────────────────────────────────────────────────
  const getDebugInfo = useCallback(() => {
    const lm = latestLandmarksRef.current;
    const hasLm = lm !== null && lm.length >= 29;

    // Check presence of key joints (visibility > 0.5)
    const jointPresence = {};
    if (hasLm) {
      for (const [name, idx] of Object.entries(KEY_LANDMARKS)) {
        jointPresence[name] = (lm[idx]?.visibility ?? 0) > 0.5;
      }
    }

    return {
      status:          poseStatus,
      error:           poseError,
      frameError:      lastFrameErrorRef.current,
      fps:             fpsRef.current,
      framesAttempted: frameAttemptRef.current,
      framesWithBody:  detectCountRef.current,
      totalPoseFrames: frameMetricsRef.current.length,
      landmarksDetected: hasLm,
      landmarkCount:   hasLm ? lm.length : 0,
      jointPresence,
      latestMetrics:   frameMetricsRef.current.length
        ? frameMetricsRef.current[frameMetricsRef.current.length - 1]
        : null,
    };
  }, [poseStatus, poseError]);

  return {
    poseStatus,
    poseError,
    computeSessionSummary,
    getDebugInfo,
    latestLandmarksRef,
    frameMetricsRef,
  };
}
