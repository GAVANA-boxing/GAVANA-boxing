"use client";

import { redAlpha, whiteAlpha } from "@/lib/tokens";

/**
 * ErrorRetry — standardized inline error state.
 * Use as a drop-in replacement for ad-hoc "Section unavailable" fallbacks.
 *
 * Props:
 *   message  – short description (string)
 *   onRetry  – () => void
 *   compact  – boolean (smaller version for inline use)
 */
export default function ErrorRetry({ message, onRetry, compact = false }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: compact ? 8 : 12,
      padding: compact ? "16px 12px" : "28px 20px",
      textAlign: "center",
    }}>
      <span style={{ fontSize: compact ? 24 : 32 }}>⚠️</span>
      <p style={{
        margin: 0,
        color: whiteAlpha(0.35),
        fontSize: compact ? 12 : 13,
        lineHeight: 1.5,
        maxWidth: 260,
      }}>
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: compact ? "6px 16px" : "9px 22px",
            borderRadius: 10,
            border: `1px solid ${redAlpha(0.35)}`,
            background: redAlpha(0.08),
            color: "rgba(248,113,113,0.9)",
            fontSize: compact ? 11 : 12,
            fontWeight: 900,
            cursor: "pointer",
            letterSpacing: 0.5,
            transition: "background 160ms ease, border-color 160ms ease",
          }}
        >
          RETRY →
        </button>
      )}
    </div>
  );
}
