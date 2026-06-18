"use client";

import { whiteAlpha, goldAlpha } from "@/lib/tokens";

export default function AIDebriefCard({ debrief, debriefLoading, debriefSource }) {
  return (
    <div style={{
      margin: "0 20px 0",
      padding: "12px 14px",
      borderRadius: 12,
      background: "rgba(245,196,81,0.04)",
      border: "1px solid rgba(245,196,81,0.14)",
      borderLeft: "3px solid rgba(245,196,81,0.55)",
    }}>
      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: goldAlpha(0.55), textTransform: "uppercase" }}>
          AI Debrief
        </div>
        {!debriefLoading && debriefSource === "error" && (
          <span style={{
            fontSize: 8, fontWeight: 900, letterSpacing: 1,
            color: "rgba(255,100,100,0.6)",
            background: "rgba(255,100,100,0.08)",
            border: "1px solid rgba(255,100,100,0.2)",
            borderRadius: 4, padding: "1px 5px", textTransform: "uppercase",
          }}>
            AI ERROR
          </span>
        )}
      </div>

      {/* Body */}
      {debriefLoading ? (
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: "50%",
              background: goldAlpha(0.4),
              animation: `dotBounce 1.1s ease-in-out ${i * 0.18}s infinite`,
            }} />
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 12, color: whiteAlpha(0.72), lineHeight: 1.6, fontStyle: "italic" }}>
          {debrief}
        </p>
      )}
    </div>
  );
}
