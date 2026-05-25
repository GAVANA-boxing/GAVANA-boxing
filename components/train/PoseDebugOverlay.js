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
    punchPhase, leftPhase, rightPhase, punchCount, leftElbow, rightElbow, velocity,
    lastPunchType, lastPunchHand, lastSnapVelocity, lastRecoilVelocity, lastRecoilMs,
    lastPunchConfidence, lastPunchConfidenceLabel, lastPunchLateralPct,
    handLiveData,
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
          <Row label="L (jab)"
               value={(leftPhase || "guard").toUpperCase()}
               color={leftPhase === "extending" ? "#34D399" : leftPhase === "recoiling" ? "#F59E0B" : "rgba(255,255,255,0.35)"} />
          <Row label="R (cross)"
               value={(rightPhase || "guard").toUpperCase()}
               color={rightPhase === "extending" ? "#34D399" : rightPhase === "recoiling" ? "#F59E0B" : "rgba(255,255,255,0.35)"} />
          <Row label="L elbow °"   value={leftElbow  ?? "—"} />
          <Row label="R elbow °"   value={rightElbow ?? "—"} />
          <Row label="Vel now"     value={isActive ? (velocity ?? "—") : "—"} />
          <Row label="Punches"     value={punchCount ?? 0} color={punchCount > 0 ? "#34D399" : "rgba(255,255,255,0.3)"} />
          {lastPunchType && (
            <Row label="Last type"
                 value={`${(lastPunchHand || "").toUpperCase()[0] || "?"} ${(lastPunchType || "").toUpperCase()}`}
                 color="#F59E0B" />
          )}
          {lastSnapVelocity != null && (
            <>
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "3px 0" }} />
              <Row label="Last snap"   value={lastSnapVelocity}   color={lastSnapVelocity >= 0.032 ? "#34D399" : lastSnapVelocity >= 0.016 ? "#F59E0B" : "#F87171"} />
              <Row label="Last recoil" value={lastRecoilVelocity ?? "—"} />
              <Row label="Recoil ms"   value={lastRecoilMs != null ? `${lastRecoilMs}ms` : "—"}
                   color={lastRecoilMs != null ? (lastRecoilMs < 280 ? "#34D399" : lastRecoilMs > 520 ? "#F87171" : "#F59E0B") : undefined} />
              {lastPunchConfidence != null && (
                <>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "3px 0" }} />
                  <Row label="Confidence"
                       value={`${Math.round(lastPunchConfidence * 100)}% ${(lastPunchConfidenceLabel || "").toUpperCase()}`}
                       color={lastPunchConfidenceLabel === "high" ? "#34D399" : lastPunchConfidenceLabel === "medium" ? "#F59E0B" : "#F87171"} />
                  <Row label="Lateral %"
                       value={lastPunchLateralPct != null ? `${lastPunchLateralPct}%` : "—"}
                       color={lastPunchLateralPct != null && lastPunchLateralPct >= 35 ? "#34D399" : "rgba(255,255,255,0.35)"} />
                </>
              )}
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

      {/* ── Per-hand live data (calibration) ── */}
      {isActive && handLiveData && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "5px 0" }} />
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 800, marginBottom: 3 }}>HANDS</div>
          {[["L", handLiveData.left], ["R", handLiveData.right]].map(([side, h]) => {
            const phaseColor =
              h.phase === "extending" ? "#34D399" :
              h.phase === "recoiling" ? "#F59E0B" : "rgba(255,255,255,0.35)";
            const hintColor =
              h.classifyHint?.includes("jab") || h.classifyHint?.includes("cross")
                ? "#34D399" : h.classifyHint === "hook?" ? "#F59E0B" : "rgba(255,255,255,0.25)";
            return (
              <div key={side} style={{ marginBottom: 5 }}>
                <div style={{ fontSize: 7.5, fontWeight: 900, color: "rgba(255,255,255,0.25)", letterSpacing: 1.5, marginBottom: 2 }}>
                  {side === "L" ? "LEFT (JAB)" : "RIGHT (CROSS)"}
                </div>
                <Row label="Phase"      value={h.phase.toUpperCase()} color={phaseColor} />
                <Row label="Elbow °"    value={h.elbowAngle ?? "—"} color={
                  h.elbowAngle > 130 ? "#34D399" : h.elbowAngle > 110 ? "#F59E0B" : "rgba(255,255,255,0.5)"
                } />
                <Row label="relVel"     value={h.relVel ?? "—"} color={
                  h.relVel >= 0.020 ? "#34D399" : h.relVel >= 0.010 ? "#F59E0B" : "rgba(255,255,255,0.35)"
                } />
                <Row label="normVel"    value={h.normVel ?? "—"} color={
                  h.normVel >= 0.050 ? "#34D399" : h.normVel >= 0.025 ? "#F59E0B" : "rgba(255,255,255,0.35)"
                } />
                <Row label="extDelta"   value={h.extDelta ?? "—"} />
                <Row label="extDeltaN"  value={h.extDeltaNorm ?? "—"} color={
                  h.extDeltaNorm >= 0.12 ? "#34D399" : h.extDeltaNorm >= 0.06 ? "#F59E0B" : "rgba(255,255,255,0.35)"
                } />
                <Row label="guardBase"  value={h.guardBase ?? "—"} color="rgba(255,255,255,0.3)" />
                <Row label="shWidth"    value={h.shoulderWidth ?? "—"} color="rgba(255,255,255,0.3)" />
                <Row label="sh↔wr"      value={h.shoulderWristDist ?? "—"} />
                <Row label="zRelΔ"      value={h.zRelDelta != null ? h.zRelDelta.toFixed(3) : "—"} color={
                  h.zRelDelta < -0.005 ? "#34D399" : "rgba(255,255,255,0.35)"
                } />
                <Row label="relX / relY" value={`${h.relWristX ?? "—"} / ${h.relWristY ?? "—"}`} color="rgba(255,255,255,0.3)" />
                {h.phase === "extending" && (
                  <>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "2px 0" }} />
                    <Row label="Str score"  value={h.straightScore ?? 0} color={h.straightScore > h.hookScore ? "#34D399" : "rgba(255,255,255,0.4)"} />
                    <Row label="Hook score" value={h.hookScore ?? 0}     color={h.hookScore > h.straightScore ? "#F59E0B" : "rgba(255,255,255,0.4)"} />
                    <Row label="Fwd Δz"     value={h.forwardDelta != null ? h.forwardDelta.toFixed(3) : "—"} color={h.forwardDelta < -0.02 ? "#34D399" : "rgba(255,255,255,0.35)"} />
                    <Row label="Lateral%"   value={h.lateralPct != null ? `${h.lateralPct}%` : "—"}         color={h.lateralPct > 42 ? "#F59E0B" : h.lateralPct < 28 ? "#34D399" : "rgba(255,255,255,0.4)"} />
                    <Row label="→ Type"     value={h.classifyHint ?? "—"} color={hintColor} />
                  </>
                )}
              </div>
            );
          })}

          {/* Last punch classify reason */}
          {lastPunchType && info.lastPunchReasons && (
            <div style={{ fontSize: 7, color: "rgba(255,255,255,0.25)", lineHeight: 1.4, marginTop: 2, wordBreak: "break-all" }}>
              {info.lastPunchReasons}
            </div>
          )}

          {/* Trigger reason (why the last extend was entered) */}
          {[["L", handLiveData?.left], ["R", handLiveData?.right]].map(([side, h]) => (
            h?.triggerReason && h.triggerReason !== "—" ? (
              <div key={side} style={{ fontSize: 7, color: "#F59E0B", lineHeight: 1.35, marginTop: 2, wordBreak: "break-all" }}>
                {side}: {h.triggerReason}
              </div>
            ) : null
          ))}
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
