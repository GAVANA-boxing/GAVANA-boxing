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
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "1px 0" }}>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 9, color: color || "rgba(255,255,255,0.75)", fontWeight: 900, textAlign: "right" }}>{value}</span>
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

// Shows metric status when valid, "SKIPPED" (dim) when visibility-gated, "—" when no data yet
function MetricRow({ label, metric, validity }) {
  if (validity === "unknown") return <Row label={label} value="—" color="rgba(255,255,255,0.2)" />;
  if (validity === "skipped") return <Row label={label} value="SKIPPED" color="rgba(255,180,0,0.45)" />;
  if (!metric) return <Row label={label} value="—" color="rgba(255,255,255,0.2)" />;
  return <Row label={label} value={metric.status} color={STATUS_COLOR[metric.status]} />;
}

export default function PoseDebugOverlay({ getDebugInfo, isActive }) {
  if (!IS_DEV) return null;

  const [info, setInfo] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setInfo(getDebugInfo?.()), 300);
    return () => clearInterval(id);
  }, [getDebugInfo]);

  if (!info) return null;

  const {
    status, error, frameError, fps, framesAttempted, framesWithBody,
    totalPoseFrames, landmarksDetected, landmarkCount, lowerBodyVisible,
    jointPresence, metricValidity, latestMetrics, cameraQuality,
    punchPhase, punchCount, elbowAngle, velocity,
    lastSnapVelocity, lastRecoilVelocity, lastRecoilMs,
  } = info;

  const statusColor =
    status === "ready"   ? "#34D399" :
    status === "loading" ? "#F59E0B" : "#F87171";
  const jp = jointPresence || {};
  const mv = metricValidity || {};

  return (
    <div style={{
      position: "absolute", top: 8, left: 8, zIndex: 50, pointerEvents: "none",
      background: "rgba(0,0,0,0.88)", borderRadius: 8, padding: "8px 11px",
      border: `1px solid ${statusColor}50`, minWidth: 190,
    }}>
      <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>
        POSE DEBUG
      </div>

      {/* ── System ── */}
      <Row label="MediaPipe"    value={status.toUpperCase()} color={statusColor} />
      <Row label="Landmarks"
           value={isActive ? (landmarksDetected ? `DETECTED (${landmarkCount})` : "NONE") : "—"}
           color={!isActive ? "rgba(255,255,255,0.3)" : landmarksDetected ? "#34D399" : "#F87171"} />
      <Row label="Lower body"
           value={isActive ? (lowerBodyVisible ? "VISIBLE" : landmarksDetected ? "NOT VISIBLE" : "—") : "—"}
           color={!isActive ? "rgba(255,255,255,0.3)" : lowerBodyVisible ? "#34D399" : landmarksDetected ? "#F59E0B" : "rgba(255,255,255,0.3)"} />
      <Row label="Camera"
           value={isActive && landmarksDetected ? (cameraQuality || "—").replace(/_/g, " ").toUpperCase() : "—"}
           color={
             !isActive || !landmarksDetected ? "rgba(255,255,255,0.3)" :
             cameraQuality === "full_body"    ? "#34D399" :
             cameraQuality === "too_close"    ? "#F87171" : "#F59E0B"
           } />
      <Row label="FPS"          value={isActive ? (fps || "—") : "—"} />
      <Row label="Frames tried" value={framesAttempted} />
      <Row label="With body"    value={framesWithBody} />
      <Row label="Pose frames"  value={totalPoseFrames} />

      {/* ── Punch phase ── */}
      {isActive && landmarksDetected && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "5px 0" }} />
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 800, marginBottom: 3 }}>PUNCH PHASE</div>
          <Row label="Phase"
               value={(punchPhase || "—").toUpperCase()}
               color={
                 punchPhase === "extending" ? "#34D399" :
                 punchPhase === "recoiling" ? "#F59E0B" : "rgba(255,255,255,0.5)"
               } />
          <Row label="Elbow °"     value={isActive ? (elbowAngle ?? "—") : "—"} />
          <Row label="Vel now"     value={isActive ? (velocity ?? "—") : "—"} />
          <Row label="Punches"     value={punchCount ?? 0} color={punchCount > 0 ? "#34D399" : "rgba(255,255,255,0.3)"} />
          {lastSnapVelocity != null && (
            <>
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "3px 0" }} />
              <Row label="Last snap"   value={lastSnapVelocity}   color={lastSnapVelocity >= 0.032 ? "#34D399" : lastSnapVelocity >= 0.016 ? "#F59E0B" : "#F87171"} />
              <Row label="Last recoil" value={lastRecoilVelocity ?? "—"} />
              <Row label="Recoil ms"   value={lastRecoilMs != null ? `${lastRecoilMs}ms` : "—"}
                   color={lastRecoilMs != null ? (lastRecoilMs < 280 ? "#34D399" : lastRecoilMs > 520 ? "#F87171" : "#F59E0B") : undefined} />
            </>
          )}
        </>
      )}

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

      {/* ── Metric validity (valid / skipped / unknown) ── */}
      {isActive && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "5px 0" }} />
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 800, marginBottom: 3 }}>METRICS</div>
          <MetricRow label="Guard"     metric={latestMetrics?.guardHeight}    validity={mv.guardHeight} />
          <MetricRow label="Extension" metric={latestMetrics?.punchExtension} validity={mv.punchExtension} />
          <MetricRow label="Rotation"  metric={latestMetrics?.rotation}       validity={mv.rotation} />
          <MetricRow label="Stance"    metric={latestMetrics?.stanceWidth}    validity={mv.stanceWidth} />
          <MetricRow label="Balance"   metric={latestMetrics?.balance}        validity={mv.balance} />
        </>
      )}

      {/* ── Hints ── */}
      {isActive && !landmarksDetected && status === "ready" && (
        <div style={{ marginTop: 5, fontSize: 8, color: "#F59E0B", lineHeight: 1.35 }}>
          Model ready — step back so full torso is visible
        </div>
      )}
      {isActive && landmarksDetected && !lowerBodyVisible && (
        <div style={{ marginTop: 5, fontSize: 8, color: "#F59E0B", lineHeight: 1.35 }}>
          Step back — hips &amp; ankles not in frame
        </div>
      )}
    </div>
  );
}
