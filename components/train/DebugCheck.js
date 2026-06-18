"use client";

export default function DebugCheck({ ok, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "1.5px 0" }}>
      <span style={{ fontSize: 9, color: ok ? "#34D399" : "#F87171", fontWeight: 900, flexShrink: 0 }}>{ok ? "✔" : "✗"}</span>
      <span style={{ fontSize: 8, color: ok ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)", fontWeight: 700 }}>{text}</span>
    </div>
  );
}
