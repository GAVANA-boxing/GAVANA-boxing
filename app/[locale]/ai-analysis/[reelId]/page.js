"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getFirebase } from "@/lib/lazyFirebase";
import { redAlpha, goldAlpha } from "@/lib/tokens";

const CYAN = "#22D3EE";
const cA = (a) => `rgba(34,211,238,${a})`;

// ─── Tactical Canvas ─────────────────────────────────────────────────────────

const NODES = [
  { id: "head",    nx: 0.50, ny: 0.18 },
  { id: "lsho",   nx: 0.36, ny: 0.38 },
  { id: "rsho",   nx: 0.64, ny: 0.38 },
  { id: "core",   nx: 0.50, ny: 0.58 },
  { id: "lhip",   nx: 0.38, ny: 0.72 },
  { id: "rhip",   nx: 0.62, ny: 0.72 },
];
const EDGES = [
  [0,1],[0,2],[1,2],[1,3],[2,3],[3,4],[3,5],[4,5],
];

function TacticalCanvas({ active, width, height }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const startRef = useRef(null);
  const opacityRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let running = true;

    function draw(ts) {
      if (!running) return;
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;

      // Fade in/out
      const target = active ? 1 : 0;
      opacityRef.current += (target - opacityRef.current) * 0.08;
      const op = opacityRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (op < 0.01) {
        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      const W = canvas.width;
      const H = canvas.height;

      // Scan line — sweeps every 12s
      const scanCycle = (elapsed % 12000) / 12000;
      const scanY = scanCycle * H;
      const grad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 8);
      grad.addColorStop(0, cA(0));
      grad.addColorStop(0.7, cA(0.06 * op));
      grad.addColorStop(1, cA(0.32 * op));
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 60, W, 68);

      // Scan line bright edge
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(W, scanY);
      ctx.strokeStyle = cA(0.55 * op);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Compute node pixel positions
      const pts = NODES.map(n => ({ x: n.nx * W, y: n.ny * H }));

      // Edges
      ctx.lineWidth = 1;
      ctx.strokeStyle = cA(0.28 * op);
      EDGES.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(pts[a].x, pts[a].y);
        ctx.lineTo(pts[b].x, pts[b].y);
        ctx.stroke();
      });

      // Nodes
      pts.forEach((p, i) => {
        const pulse = 0.5 + 0.5 * Math.sin(elapsed / 700 + i * 1.1);
        const r = 4 + pulse * 2;

        // Crosshair
        ctx.strokeStyle = cA(0.35 * op);
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(p.x - 10, p.y); ctx.lineTo(p.x - r - 2, p.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x + 10, p.y); ctx.lineTo(p.x + r + 2, p.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x, p.y - 10); ctx.lineTo(p.x, p.y - r - 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x, p.y + 10); ctx.lineTo(p.x, p.y + r + 2); ctx.stroke();

        // Glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
        grd.addColorStop(0, cA(0.35 * op));
        grd.addColorStop(1, cA(0));
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = cA((0.7 + 0.3 * pulse) * op);
        ctx.fill();
      });

      // Corner brackets
      const bSize = 16, bOff = 10;
      ctx.strokeStyle = cA(0.4 * op);
      ctx.lineWidth = 1.5;
      [[bOff,bOff,1,1],[W-bOff,bOff,-1,1],[bOff,H-bOff,1,-1],[W-bOff,H-bOff,-1,-1]].forEach(([x,y,sx,sy]) => {
        ctx.beginPath(); ctx.moveTo(x, y + sy*bSize); ctx.lineTo(x, y); ctx.lineTo(x + sx*bSize, y); ctx.stroke();
      });

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }}
    />
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const R = 38;
  const circ = 2 * Math.PI * R;
  const pct = Math.min(Math.max((score - 5) / 5, 0), 1);
  const dash = pct * circ;

  return (
    <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
      <svg width={96} height={96} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={48} cy={48} r={R} fill="none" stroke={cA(0.12)} strokeWidth={5} />
        <circle
          cx={48} cy={48} r={R} fill="none"
          stroke={CYAN} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${cA(0.7)})` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: CYAN, letterSpacing: -0.5, lineHeight: 1 }}>{score.toFixed(1)}</span>
        <span style={{ fontSize: 8, fontWeight: 700, color: cA(0.6), letterSpacing: 1.2, marginTop: 2 }}>SCORE</span>
      </div>
    </div>
  );
}

// ─── Metric Bar ───────────────────────────────────────────────────────────────

function MetricBar({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: 0.6 }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: CYAN }}>{Math.round(value * 10) / 10}</span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: cA(0.1), overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${(value / 10) * 100}%`,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${cA(0.7)}, ${CYAN})`,
          boxShadow: `0 0 8px ${cA(0.5)}`,
          transition: "width 600ms cubic-bezier(0.16,1,0.3,1)",
        }} />
      </div>
    </div>
  );
}

// ─── Compute score from AI data ───────────────────────────────────────────────

function computeScore(data) {
  if (!data) return 7.0;
  const s = Array.isArray(data.strengths) ? data.strengths.length : 0;
  const w = Array.isArray(data.weaknesses) ? data.weaknesses.length : 0;
  return Math.min(10, Math.max(4, 7.0 + Math.min(s * 0.3, 1.2) - Math.min(w * 0.2, 0.8)));
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIAnalysisPage() {
  const router = useRouter();
  const { locale, reelId } = useParams();

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

  // Auto-fetch AI when reel loads
  useEffect(() => {
    if (reel && !aiData) fetchAI();
  }, [reel]); // eslint-disable-line react-hooks/exhaustive-deps

  const score = computeScore(aiData);
  const guard = aiData ? Math.min(10, 5 + (aiData.strengths?.length || 0) * 0.5) : 0;
  const comboFlow = aiData ? Math.min(10, 4.5 + (aiData.strengths?.length || 0) * 0.4 + Math.random() * 0.8) : 0;
  const footwork = aiData ? Math.min(10, 5.5 + (aiData.strengths?.length || 0) * 0.3) : 0;

  return (
    <div style={{ minHeight: "100dvh", background: "#0B0B0C", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", gap: 12,
        padding: "calc(12px + env(safe-area-inset-top)) 16px 12px",
        background: "rgba(11,11,12,0.92)",
        borderBottom: `1px solid ${cA(0.12)}`,
        backdropFilter: "blur(20px)",
      }}>
        <button
          onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 12, border: `1px solid ${cA(0.2)}`, background: cA(0.06), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: cA(0.7) }}>GAVANA · AI</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: 0.5 }}>COMBAT ANALYSIS</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: cA(0.08), border: `1px solid ${cA(0.2)}` }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: CYAN, boxShadow: `0 0 6px ${cA(0.9)}`, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: cA(0.85), letterSpacing: 1 }}>LIVE</span>
        </div>
      </div>

      {/* Video + Canvas Section */}
      <div
        ref={videoContainerRef}
        style={{ position: "relative", width: "100%", aspectRatio: "9/16", maxHeight: "55vh", background: "#000", overflow: "hidden" }}
      >
        {reel?.videoUrl ? (
          <video
            ref={videoRef}
            src={reel.videoUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            autoPlay loop muted playsInline
            poster={reel.thumbnailUrl || undefined}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
            {loading ? (
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${cA(0.3)}`, borderTopColor: CYAN, animation: "spin 0.8s linear infinite" }} />
            ) : (
              <span style={{ color: cA(0.4), fontSize: 13 }}>No video</span>
            )}
          </div>
        )}

        {canvasSize.w > 0 && (
          <TacticalCanvas active={trackingOn} width={canvasSize.w} height={canvasSize.h} />
        )}

        {/* Tracking toggle */}
        <button
          onClick={() => setTrackingOn(v => !v)}
          style={{
            position: "absolute", bottom: 12, right: 12, zIndex: 10,
            padding: "7px 14px", borderRadius: 20,
            border: `1px solid ${trackingOn ? cA(0.55) : "rgba(255,255,255,0.2)"}`,
            background: trackingOn ? cA(0.15) : "rgba(0,0,0,0.55)",
            backdropFilter: "blur(10px)",
            color: trackingOn ? CYAN : "rgba(255,255,255,0.7)",
            fontSize: 10, fontWeight: 900, letterSpacing: 1.5,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            transition: "all 200ms ease",
          }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={12} cy={12} r={10}/><circle cx={12} cy={12} r={3}/>
          </svg>
          {trackingOn ? "TRACKING ON" : "AI INSIGHT"}
        </button>
      </div>

      {/* Analysis Body */}
      <div style={{ flex: 1, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20, paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>

        {/* Score + Metrics */}
        {aiData ? (
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <ScoreRing score={score} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <MetricBar label="GUARD" value={guard} />
              <MetricBar label="COMBO FLOW" value={comboFlow} />
              <MetricBar label="FOOTWORK" value={footwork} />
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: cA(0.06), border: `1px solid ${cA(0.15)}`, flexShrink: 0, animation: "pulse 1.5s infinite" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {["GUARD","COMBO FLOW","FOOTWORK"].map(l => (
                <div key={l} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ height: 10, width: 70, borderRadius: 4, background: "rgba(255,255,255,0.06)", animation: "pulse 1.5s infinite" }} />
                  <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.04)" }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Style + Technique tags */}
        {aiData && (aiData.style || aiData.technique) && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {aiData.style && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: redAlpha(0.1), border: `1px solid ${redAlpha(0.3)}`, fontSize: 12, fontWeight: 800, color: "#FF3B30" }}>
                {aiData.styleEmoji && <span>{aiData.styleEmoji}</span>}
                {aiData.style}
              </div>
            )}
            {aiData.technique && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: cA(0.07), border: `1px solid ${cA(0.25)}`, fontSize: 12, fontWeight: 800, color: CYAN }}>
                {aiData.techniqueEmoji && <span>{aiData.techniqueEmoji}</span>}
                {aiData.technique}
              </div>
            )}
          </div>
        )}

        {/* Strengths */}
        {aiData?.strengths?.length > 0 && (
          <div style={{ borderRadius: 16, background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: "rgba(74,222,128,0.7)", marginBottom: 10 }}>STRENGTHS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {aiData.strengths.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                  <span style={{ color: "#4ade80", fontWeight: 800, flexShrink: 0 }}>+</span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weaknesses */}
        {aiData?.weaknesses?.length > 0 && (
          <div style={{ borderRadius: 16, background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)", padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: "rgba(248,113,113,0.7)", marginBottom: 10 }}>WEAKNESSES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {aiData.weaknesses.map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                  <span style={{ color: "#f87171", fontWeight: 800, flexShrink: 0 }}>−</span>
                  {w}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Fix */}
        {aiData?.improve && (
          <div style={{ borderRadius: 16, background: `${goldAlpha(0.06)}`, border: `1px solid ${goldAlpha(0.25)}`, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: goldAlpha(0.7), marginBottom: 8 }}>KEY FIX</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{aiData.improve}</div>
          </div>
        )}

        {/* Next Drill */}
        {aiData?.nextDrill && (
          <div style={{ borderRadius: 16, background: cA(0.05), border: `1px solid ${cA(0.2)}`, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: cA(0.7), marginBottom: 8 }}>NEXT DRILL</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{aiData.nextDrill}</div>
          </div>
        )}

        {/* Technique cue */}
        {aiData?.techniqueCue && (
          <div style={{ borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "12px 14px", fontStyle: "italic", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, textAlign: "center" }}>
            "{aiData.techniqueCue}"
          </div>
        )}

        {/* Loading state */}
        {aiLoading && !aiData && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 24 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${cA(0.2)}`, borderTopColor: CYAN, animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 12, color: cA(0.5), fontWeight: 700, letterSpacing: 1 }}>ANALYZING TECHNIQUE...</span>
          </div>
        )}

        {/* Coach CTA */}
        <button
          onClick={() => router.push(`/${locale}/train?reelId=${reelId}`)}
          style={{
            width: "100%", minHeight: 52, borderRadius: 16,
            background: `linear-gradient(135deg, rgba(255,59,48,0.85), rgba(204,40,32,0.85))`,
            border: `1px solid ${redAlpha(0.4)}`,
            color: "#fff", fontSize: 14, fontWeight: 900, letterSpacing: 0.5,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: `0 8px 24px ${redAlpha(0.25)}`,
            backdropFilter: "blur(10px)",
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          TRAIN THIS MOVE
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  );
}
