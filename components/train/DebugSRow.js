"use client";

export default function DebugSRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "1.5px 0" }}>
      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", fontWeight: 700, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 8, color: color || "rgba(255,255,255,0.85)", fontWeight: 900, textAlign: "right" }}>{value}</span>
    </div>
  );
}
