"use client";

export default function DebugSSection({ title, children }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ fontSize: 6.5, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.22)", marginBottom: 5 }}>
        {title}
      </div>
      {children}
    </div>
  );
}
