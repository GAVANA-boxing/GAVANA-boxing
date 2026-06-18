"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getFirebase } from "@/lib/lazyFirebase";
import { pageBg } from "@/lib/tokens";
import { translate } from "@/lib/i18n";
import AnalysisHeader from "@/components/ai-analysis/AnalysisHeader";
import VideoSection from "@/components/ai-analysis/VideoSection";
import AnalysisBody from "@/components/ai-analysis/AnalysisBody";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isBoxingContent(reel) {
  if (!reel) return false;
  if (reel.isDemo) return true;
  const type = (reel.contentType || reel.type || "").toLowerCase();
  const cat = (reel.category || "").toLowerCase();
  return type === "training" || type === "educational" ||
         cat === "boxing" || cat === "sparring";
}

function computeScore(data) {
  if (!data) return 7.0;
  const s = Array.isArray(data.strengths) ? data.strengths.length : 0;
  const w = Array.isArray(data.weaknesses) ? data.weaknesses.length : 0;
  return Math.min(10, Math.max(4, 7.0 + Math.min(s * 0.3, 1.2) - Math.min(w * 0.2, 0.8)));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AIAnalysisPage() {
  const router = useRouter();
  const { locale, reelId } = useParams();
  const t = (key) => translate(locale, key);

  const [reel, setReel] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [trackingOn, setTrackingOn] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const videoContainerRef = useRef(null);
  const videoRef = useRef(null);

  // Load reel from Firestore
  useEffect(() => {
    if (!reelId) return;
    let cancelled = false;
    (async () => {
      try {
        const { db } = await getFirebase();
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "reels", reelId));
        if (!cancelled && snap.exists()) setReel({ id: snap.id, ...snap.data() });
      } catch { /* silent */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [reelId]);

  // Measure video container for canvas
  useEffect(() => {
    const el = videoContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setCanvasSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fetch AI data
  const fetchAI = useCallback(async () => {
    if (!reel || aiData || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reelId: reel.id, videoUrl: reel.videoUrl, caption: reel.caption }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiData(data);
      }
    } catch { /* silent */ }
    setAiLoading(false);
  }, [reel, aiData, aiLoading]);

  // Auto-fetch AI only for boxing content
  useEffect(() => {
    if (reel && !aiData && isBoxingContent(reel)) fetchAI();
  }, [reel]); // eslint-disable-line react-hooks/exhaustive-deps

  const isBoxing = isBoxingContent(reel);
  const score = computeScore(aiData);
  const guard = aiData ? Math.min(10, 5 + (aiData.strengths?.length || 0) * 0.5) : 0;
  const comboFlow = aiData ? Math.min(10, 4.5 + (aiData.strengths?.length || 0) * 0.4 + Math.random() * 0.8) : 0;
  const footwork = aiData ? Math.min(10, 5.5 + (aiData.strengths?.length || 0) * 0.3) : 0;

  return (
    <div className="page-enter" style={{ minHeight: "100dvh", background: pageBg(), display: "flex", flexDirection: "column" }}>

      <AnalysisHeader onBack={() => router.back()} />

      <VideoSection
        reel={reel}
        loading={loading}
        isBoxing={isBoxing}
        trackingOn={trackingOn}
        onTrackingToggle={() => setTrackingOn((v) => !v)}
        canvasSize={canvasSize}
        videoContainerRef={videoContainerRef}
        videoRef={videoRef}
      />

      <AnalysisBody
        locale={locale}
        t={t}
        isBoxing={isBoxing}
        loading={loading}
        reel={reel}
        aiData={aiData}
        aiLoading={aiLoading}
        score={score}
        guard={guard}
        comboFlow={comboFlow}
        footwork={footwork}
        onUpload={() => router.push(`/${locale}/upload`)}
        onTrainThisMove={() => router.push(`/${locale}/train?reelId=${reelId}`)}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  );
}
