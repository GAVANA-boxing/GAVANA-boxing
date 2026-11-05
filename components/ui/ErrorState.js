"use client";

import { RADIUS, FONT_SIZE, FONT_WEIGHT, whiteAlpha, redAlpha, RED } from "@/lib/tokens";

/**
 * The one inline error block — the error-state sibling of EmptyState. Use it
 * inside a screen when a load fails (the global app/error.js stays for thrown
 * render errors). Pass `onRetry` to show a retry button.
 */
export default function ErrorState({
  emoji = "⚠️",
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  padding = "56px 24px",
}) {
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
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: RADIUS.md,
          background: redAlpha(0.1),
          border: `1px solid ${redAlpha(0.3)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: FONT_SIZE.xl,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {emoji}
      </div>
      {title && (
        <p style={{ margin: 0, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.black, color: whiteAlpha(0.7), letterSpacing: -0.1 }}>
          {title}
        </p>
      )}
      {message && (
        <p style={{ margin: 0, fontSize: FONT_SIZE.base, color: whiteAlpha(0.35), maxWidth: 270, lineHeight: 1.55 }}>
          {message}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 4,
            padding: "8px 20px",
            borderRadius: RADIUS.sm,
            border: `1px solid ${redAlpha(0.35)}`,
            background: redAlpha(0.08),
            color: RED,
            fontSize: FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.bold,
            cursor: "pointer",
            letterSpacing: 0.3,
          }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
