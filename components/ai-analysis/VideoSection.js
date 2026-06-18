"use client";

import TacticalCanvas from "./TacticalCanvas";

const CYAN = "#22D3EE";
const cA = (a) => `rgba(34,211,238,${a})`;

/**
 * @param {{
 *   reel: object | null,
 *   loading: boolean,
 *   isBoxing: boolean,
 *   trackingOn: boolean,
 *   onTrackingToggle: () => void,
 *   canvasSize: { w: number, h: number },
 *   videoContainerRef: React.RefObject,
 *   videoRef: React.RefObject,
 * }} props
 */
export default function VideoSection({
  reel,
  loading,
  isBoxing,
  trackingOn,
  onTrackingToggle,
  canvasSize,
  videoContainerRef,
  videoRef,
}) {
  return (
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

      {isBoxing && (
        <button
          onClick={onTrackingToggle}
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
            <circle cx={12} cy={12} r={10} /><circle cx={12} cy={12} r={3} />
          </svg>
          {trackingOn ? "TRACKING ON" : "AI INSIGHT"}
        </button>
      )}
    </div>
  );
}
