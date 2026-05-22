"use client";

export default function EmptyState({ emoji, title, hint, action, padding = "56px 24px" }) {
  return (
    <div
      className="page-enter"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding,
        textAlign: "center",
      }}
    >
      {emoji && (
        <div style={{
          width: 48, height: 48,
          borderRadius: 14,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, lineHeight: 1,
          flexShrink: 0,
        }}>
          {emoji}
        </div>
      )}
      {title && (
        <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "rgba(255,255,255,0.65)", letterSpacing: -0.1 }}>
          {title}
        </p>
      )}
      {hint && (
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.3)", maxWidth: 270, lineHeight: 1.55 }}>
          {hint}
        </p>
      )}
      {action}
    </div>
  );
}
