"use client";

/**
 * EmptyState — reusable empty / zero-data placeholder.
 *
 * Props:
 *   emoji       {string}    — large icon character, e.g. "🥊"
 *   title       {ReactNode} — primary message
 *   hint        {ReactNode} — optional secondary description
 *   action      {ReactNode} — optional button / link element
 *   padding     {string}    — outer padding, default "60px 24px"
 */
export default function EmptyState({ emoji, title, hint, action, padding = "60px 24px" }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding,
        textAlign: "center",
      }}
    >
      {emoji && (
        <div style={{ fontSize: 44, opacity: 0.4, lineHeight: 1 }}>{emoji}</div>
      )}
      {title && (
        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,0.55)" }}>
          {title}
        </p>
      )}
      {hint && (
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)", maxWidth: 260, lineHeight: 1.5 }}>
          {hint}
        </p>
      )}
      {action}
    </div>
  );
}
