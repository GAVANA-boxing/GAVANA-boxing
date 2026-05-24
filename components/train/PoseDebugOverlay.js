"use client";
import { useEffect, useState } from "react";

// Dev-only overlay — stripped from production builds
if (process.env.NODE_ENV === "production") {
  module.exports = { default: () => null };
}

const STATUS_COLOR = {
  good:            "#34D399",
  too_narrow:      "#F59E0B",
  too_wide:        "#F59E0B",
  too_low:         "#F87171",
  too_high:        "#F87171",
  under_extended:  "#F87171",
  hyper_extended:  "#F59E0B",
  under_rotated:   "#F87171",
  over_rotated:    "#F87171",
  off_balance:     "#F87171",
};

function Row({ label, status }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "1px 0" }}>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 9, color: STATUS_COLOR[status] || "#fff", fontWeight: 900 }}>{status}</span>
    </div>
  );
}

export default function PoseDebugOverlay({ getLatestMetrics, isActive }) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (!isActive) { setMetrics(null); return; }
    const id = setInterval(() => setMetrics(getLatestMetrics?.()), 500);
    return () => clearInterval(id);
  }, [isActive, getLatestMetrics]);

  if (!metrics) return null;

  return (
    <div style={{
      position: "absolute", top: 8, left: 8, zIndex: 50, pointerEvents: "none",
      background: "rgba(0,0,0,0.72)", borderRadius: 8, padding: "7px 11px",
      border: "1px solid rgba(255,255,255,0.10)", minWidth: 150,
    }}>
      <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.28)", marginBottom: 5 }}>
        POSE DEBUG
      </div>
      {metrics.stanceWidth    && <Row label="Stance"    status={metrics.stanceWidth.status} />}
      {metrics.guardHeight    && <Row label="Guard"     status={metrics.guardHeight.status} />}
      {metrics.punchExtension && <Row label="Extension" status={metrics.punchExtension.status} />}
      {metrics.rotation       && <Row label="Rotation"  status={metrics.rotation.status} />}
      {metrics.balance        && <Row label="Balance"   status={metrics.balance.status} />}
    </div>
  );
}
