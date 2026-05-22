"use client";

import { SURFACE, BORDER } from "@/lib/tokens";

export default function DashboardCard({ children, style, onClick, accent }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        overflow: "hidden",
        ...(accent ? { borderLeft: `3px solid ${accent}` } : {}),
        ...(onClick ? { cursor: "pointer" } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
