"use client";

export default function ProfileLoadingSkeleton() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0B0B0C",
        padding: "calc(28px + env(safe-area-inset-top)) 16px 40px",
      }}
      className="page-enter"
    >
      <div style={{ maxWidth: 540, margin: "0 auto", display: "grid", gap: 14 }}>
        <div className="shimmer" style={{ width: 40, height: 40, borderRadius: 10 }} />
        <div className="shimmer" style={{ height: 220, borderRadius: 20 }} />
        <div className="shimmer" style={{ height: 80, borderRadius: 16 }} />
        <div className="shimmer" style={{ height: 60, borderRadius: 14 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer" style={{ height: 70, borderRadius: 14 }} />
          ))}
        </div>
        <div className="shimmer" style={{ height: 160, borderRadius: 16 }} />
      </div>
    </div>
  );
}
