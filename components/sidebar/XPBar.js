"use client";

export default function XPBar({ progress, color }) {
  return (
    <div style={{
      width: "100%",
      height: 2,
      borderRadius: 1,
      background: "rgba(255,255,255,0.07)",
      overflow: "hidden",
    }}>
      <div style={{
        height: "100%",
        width: `${Math.min(100, Math.max(0, progress))}%`,
        borderRadius: 1,
        background: color,
        boxShadow: `0 0 6px ${color}`,
        transition: "width 800ms cubic-bezier(0.16,1,0.3,1)",
      }} />
    </div>
  );
}
