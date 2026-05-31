"use client";

import { RADIUS, FONT_SIZE, FONT_WEIGHT, whiteAlpha } from "@/lib/tokens";

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
          borderRadius: RADIUS.md,
          background: whiteAlpha(0.04),
          border: `1px solid ${whiteAlpha(0.07)}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: FONT_SIZE.xl, lineHeight: 1,
          flexShrink: 0,
        }}>
          {emoji}
        </div>
      )}
      {title && (
        <p style={{ margin: 0, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.black, color: whiteAlpha(0.65), letterSpacing: -0.1 }}>
          {title}
        </p>
      )}
      {hint && (
        <p style={{ margin: 0, fontSize: FONT_SIZE.base, color: whiteAlpha(0.3), maxWidth: 270, lineHeight: 1.55 }}>
          {hint}
        </p>
      )}
      {action}
    </div>
  );
}
