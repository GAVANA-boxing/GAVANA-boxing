"use client";

export default function GymLoadingSkeleton() {
  return (
    <div style={{ minHeight: "100dvh", background: "#0B0B0C", padding: "calc(28px + env(safe-area-inset-top)) 16px 40px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", display: "grid", gap: 14 }}>
        <div className="shimmer" style={{ width: 40, height: 40, borderRadius: 10 }} />
        <div className="shimmer" style={{ height: 200, borderRadius: 18 }} />
        <div className="shimmer" style={{ height: 80, borderRadius: 14 }} />
        <div className="shimmer" style={{ height: 60, borderRadius: 14 }} />
        <div className="shimmer" style={{ height: 120, borderRadius: 14 }} />
      </div>
    </div>
  );
}
