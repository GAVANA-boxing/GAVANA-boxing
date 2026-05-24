"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { computePoseMetrics, poseMetricsScore } from "@/lib/mediapipePoseMetrics";

const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const THROTTLE_MS = 100; // ~10fps

export function usePoseDetection({ videoRef, isActive }) {
  const [isReady, setIsReady] = useState(false);
  const landmarkerRef = useRef(null);
  const lastRunRef = useRef(0);
  const rafRef = useRef(null);
  const frameMetricsRef = useRef([]);
  const latestLandmarksRef = useRef(null);

  // Load PoseLandmarker once — fails silently if unavailable
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const { PoseLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setIsReady(true);
        }
      } catch {
        // Pose metrics optional — silently skip if MediaPipe unavailable
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // rAF detection loop, throttled to THROTTLE_MS
  useEffect(() => {
    if (!isActive || !isReady) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      const now = performance.now();
      if (now - lastRunRef.current < THROTTLE_MS) return;
      lastRunRef.current = now;

      const video = videoRef.current;
      if (!video || video.readyState < 2 || !landmarkerRef.current) return;

      try {
        const res = landmarkerRef.current.detectForVideo(video, now);
        const landmarks = res.landmarks?.[0];
        if (landmarks) {
          latestLandmarksRef.current = landmarks;
          const metrics = computePoseMetrics(landmarks);
          if (metrics) frameMetricsRef.current.push(metrics);
        }
      } catch { /* fail silently per-frame */ }
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, isReady, videoRef]);

  // Clear buffers when a new session starts
  useEffect(() => {
    if (isActive) {
      frameMetricsRef.current = [];
      latestLandmarksRef.current = null;
    }
  }, [isActive]);

  const computeSessionSummary = useCallback(() => {
    const frames = frameMetricsRef.current;
    if (frames.length < 5) return null; // too few frames — not representative

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

  return { isReady, computeSessionSummary, getLatestMetrics, latestLandmarksRef, frameMetricsRef };
}
