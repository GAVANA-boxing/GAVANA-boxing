"use client";

import { MUTED, GOLD } from "@/lib/tokens";

export default function SectionHeader({ label, action, onAction, gold = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: gold ? GOLD : MUTED,
        }}
      >
        {label}
      </span>
      {action && (
        <button
          onClick={onAction}
          style={{
            background: "none",
            border: "none",
            color: MUTED,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}
