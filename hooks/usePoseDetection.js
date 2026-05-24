"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { computePoseMetrics, poseMetricsScore } from "@/lib/mediapipePoseMetrics";

// WASM version must match the installed @mediapipe/tasks-vision version exactly
const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const THROTTLE_MS = 100; // ~10fps

// "loading" | "ready" | "failed"
export function usePoseDetection({ videoRef, isActive }) {
  const [poseStatus, setPoseStatus] = useState("loading");
  const [poseError, setPoseError] = useState(null);
  const landmarkerRef = useRef(null);
  const lastRunRef = useRef(0);
  const rafRef = useRef(null);
  const frameMetricsRef = useRef([]);
  const latestLandmarksRef = useRef(null);
  const frameCountRef = useRef(0);   // total frames attempted
  const detectCountRef = useRef(0);  // frames with landmarks
  const lastFpsTimeRef = useRef(performance.now());
  const fpsRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const { PoseLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");

        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

        // Try GPU first; fall back to CPU if it throws
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

  // rAF detection loop — only runs while recording and landmarker is ready
  useEffect(() => {
    if (!isActive || poseStatus !== "ready") {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    function loop() {
      rafRef.current = requestAnimationFrame(loop);

      const now = performance.now();
      if (now - lastRunRef.current < THROTTLE_MS) return;
      lastRunRef.current = now;

      // FPS tracking
      const elapsed = now - lastFpsTimeRef.current;
      if (elapsed >= 1000) {
        fpsRef.current = Math.round((frameCountRef.current / elapsed) * 1000);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      const video = videoRef.current;
      if (!video || video.readyState < 2 || !landmarkerRef.current) return;

      frameCountRef.current++;

      try {
        const res = landmarkerRef.current.detectForVideo(video, now);
        const landmarks = res.landmarks?.[0];
        if (landmarks && landmarks.length > 0) {
          latestLandmarksRef.current = landmarks;
          detectCountRef.current++;
          const metrics = computePoseMetrics(landmarks);
          if (metrics) frameMetricsRef.current.push(metrics);
        } else {
          latestLandmarksRef.current = null;
        }
      } catch (err) {
        // Per-frame errors tracked but not surfaced — model may recover next frame
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
      frameCountRef.current = 0;
    }
  }, [isActive]);

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

  const getLatestMetrics = useCallback(() => {
    const frames = frameMetricsRef.current;
    return frames.length ? frames[frames.length - 1] : null;
  }, []);

  // All diagnostic info for the debug overlay
  const getDebugInfo = useCallback(() => ({
    status: poseStatus,
    error: poseError,
    landmarksDetected: latestLandmarksRef.current !== null,
    totalMetricFrames: frameMetricsRef.current.length,
    detectCount: detectCountRef.current,
    fps: fpsRef.current,
    latestMetrics: frameMetricsRef.current.length
      ? frameMetricsRef.current[frameMetricsRef.current.length - 1]
      : null,
  }), [poseStatus, poseError]);

  return {
    poseStatus,
    poseError,
    computeSessionSummary,
    getLatestMetrics,
    getDebugInfo,
    latestLandmarksRef,
    frameMetricsRef,
  };
}
