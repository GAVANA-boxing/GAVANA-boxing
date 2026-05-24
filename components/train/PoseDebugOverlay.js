"use client";
import { useEffect, useState } from "react";

const IS_DEV = process.env.NODE_ENV === "development";

const STATUS_COLOR = {
  good:           "#34D399",
  too_narrow:     "#F59E0B",
  too_wide:       "#F59E0B",
  too_low:        "#F87171",
  too_high:       "#F87171",
  under_extended: "#F87171",
  hyper_extended: "#F59E0B",
  under_rotated:  "#F87171",
  over_rotated:   "#F87171",
  off_balance:    "#F87171",
};

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "1px 0" }}>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 700, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 9, color: color || "rgba(255,255,255,0.8)", fontWeight: 900, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function PoseDebugOverlay({ getDebugInfo, isActive }) {
  // Return null in production — no code runs, no network calls
  if (!IS_DEV) return null;

  const [info, setInfo] = useState(null);

  useEffect(() => {
    // Poll debug info whether active or not so "loading" state is always visible
    const id = setInterval(() => setInfo(getDebugInfo?.()), 300);
    return () => clearInterval(id);
  }, [getDebugInfo]);

  if (!info) return null;

  const { status, error, landmarksDetected, totalMetricFrames, detectCount, fps, latestMetrics } = info;

  const statusColor =
    status === "ready"   ? "#34D399" :
    status === "loading" ? "#F59E0B" :
    /* failed */           "#F87171";

  return (
    <div style={{
      position: "absolute", top: 8, left: 8, zIndex: 50, pointerEvents: "none",
      background: "rgba(0,0,0,0.82)", borderRadius: 8, padding: "8px 12px",
      border: `1px solid ${statusColor}40`, minWidth: 170,
    }}>
      <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.28)", marginBottom: 5 }}>
        POSE DEBUG
      </div>

      <Row label="MediaPipe"  value={status.toUpperCase()} color={statusColor} />
      <Row
        label="Landmarks"
        value={isActive ? (landmarksDetected ? "DETECTED" : "NONE") : "—"}
        color={!isActive ? "rgba(255,255,255,0.3)" : landmarksDetected ? "#34D399" : "#F87171"}
      />
      <Row label="FPS"        value={isActive ? (fps || "—") : "—"} />
      <Row label="Pose frames" value={totalMetricFrames} />
      <Row label="With body"  value={detectCount} />

      {error && (
        <div style={{ marginTop: 5, fontSize: 8, color: "#F87171", wordBreak: "break-all", lineHeight: 1.3 }}>
          ERR: {error.slice(0, 80)}
        </div>
      )}

      {isActive && latestMetrics && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "5px 0" }} />
          {latestMetrics.stanceWidth    && <Row label="Stance"    value={latestMetrics.stanceWidth.status}    color={STATUS_COLOR[latestMetrics.stanceWidth.status]} />}
          {latestMetrics.guardHeight    && <Row label="Guard"     value={latestMetrics.guardHeight.status}    color={STATUS_COLOR[latestMetrics.guardHeight.status]} />}
          {latestMetrics.punchExtension && <Row label="Extension" value={latestMetrics.punchExtension.status} color={STATUS_COLOR[latestMetrics.punchExtension.status]} />}
          {latestMetrics.rotation       && <Row label="Rotation"  value={latestMetrics.rotation.status}       color={STATUS_COLOR[latestMetrics.rotation.status]} />}
          {latestMetrics.balance        && <Row label="Balance"   value={latestMetrics.balance.status}        color={STATUS_COLOR[latestMetrics.balance.status]} />}
        </>
      )}

      {isActive && !landmarksDetected && status === "ready" && (
        <div style={{ marginTop: 5, fontSize: 8, color: "#F59E0B", lineHeight: 1.3 }}>
          Model ready — no body detected in frame
        </div>
      )}
    </div>
  );
}
