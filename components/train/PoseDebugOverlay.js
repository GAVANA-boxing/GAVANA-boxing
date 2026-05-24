"use client";
import { useEffect, useState } from "react";

// Only renders in development — zero cost in production
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
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "1px 0" }}>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 9, color: color || "rgba(255,255,255,0.75)", fontWeight: 900, textAlign: "right", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

function Dot({ ok }) {
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7, borderRadius: "50%",
      background: ok ? "#34D399" : "#F87171", flexShrink: 0,
    }} />
  );
}

export default function PoseDebugOverlay({ getDebugInfo, isActive }) {
  if (!IS_DEV) return null;

  const [info, setInfo] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setInfo(getDebugInfo?.()), 300);
    return () => clearInterval(id);
  }, [getDebugInfo]);

  if (!info) return null;

  const { status, error, frameError, fps, framesAttempted, framesWithBody,
          totalPoseFrames, landmarksDetected, landmarkCount, jointPresence, latestMetrics } = info;

  const statusColor =
    status === "ready"   ? "#34D399" :
    status === "loading" ? "#F59E0B" : "#F87171";

  const jp = jointPresence || {};

  return (
    <div style={{
      position: "absolute", top: 8, left: 8, zIndex: 50, pointerEvents: "none",
      background: "rgba(0,0,0,0.88)", borderRadius: 8, padding: "8px 11px",
      border: `1px solid ${statusColor}50`, minWidth: 185,
    }}>
      <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>
        POSE DEBUG
      </div>

      {/* ── System status ── */}
      <Row label="MediaPipe"    value={status.toUpperCase()} color={statusColor} />
      <Row label="Landmarks"    value={isActive ? (landmarksDetected ? `DETECTED (${landmarkCount})` : "NONE") : "—"}
                                color={!isActive ? "rgba(255,255,255,0.3)" : landmarksDetected ? "#34D399" : "#F87171"} />
      <Row label="FPS"          value={isActive ? (fps || "—") : "—"} />
      <Row label="Frames tried" value={framesAttempted} />
      <Row label="With body"    value={framesWithBody} />
      <Row label="Pose frames"  value={totalPoseFrames} />

      {/* ── Error message ── */}
      {(error || frameError) && (
        <div style={{ marginTop: 5, fontSize: 7.5, color: "#F87171", lineHeight: 1.35, wordBreak: "break-word" }}>
          ERR: {(error || frameError || "").slice(0, 100)}
        </div>
      )}

      {/* ── Joint presence ── */}
      {isActive && landmarksDetected && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "5px 0" }} />
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 800, marginBottom: 3 }}>JOINTS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              ["Shoulders", jp.L_SHOULDER && jp.R_SHOULDER],
              ["Wrists",    jp.L_WRIST    && jp.R_WRIST],
              ["Hips",      jp.L_HIP      && jp.R_HIP],
              ["Ankles",    jp.L_ANKLE    && jp.R_ANKLE],
            ].map(([label, ok]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Dot ok={ok} />
                <span style={{ fontSize: 9, color: ok ? "rgba(255,255,255,0.6)" : "rgba(255,100,100,0.7)", fontWeight: 700 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── No body hint ── */}
      {isActive && !landmarksDetected && status === "ready" && (
        <div style={{ marginTop: 5, fontSize: 8, color: "#F59E0B", lineHeight: 1.35 }}>
          Model ready — step back so full torso is visible
        </div>
      )}

      {/* ── Live metric values ── */}
      {isActive && latestMetrics && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "5px 0" }} />
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 800, marginBottom: 3 }}>METRICS</div>
          {latestMetrics.stanceWidth    && <Row label="Stance"    value={latestMetrics.stanceWidth.status}    color={STATUS_COLOR[latestMetrics.stanceWidth.status]} />}
          {latestMetrics.guardHeight    && <Row label="Guard"     value={latestMetrics.guardHeight.status}    color={STATUS_COLOR[latestMetrics.guardHeight.status]} />}
          {latestMetrics.punchExtension && <Row label="Extension" value={latestMetrics.punchExtension.status} color={STATUS_COLOR[latestMetrics.punchExtension.status]} />}
          {latestMetrics.rotation       && <Row label="Rotation"  value={latestMetrics.rotation.status}       color={STATUS_COLOR[latestMetrics.rotation.status]} />}
          {latestMetrics.balance        && <Row label="Balance"   value={latestMetrics.balance.status}        color={STATUS_COLOR[latestMetrics.balance.status]} />}
        </>
      )}
    </div>
  );
}
