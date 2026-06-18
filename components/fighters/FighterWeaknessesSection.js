"use client";

import s from "@/components/fighters/fighterStyles";

// ─── Weaknesses section body ──────────────────────────────────────────────────
// Props: weaknesses (string[])
export default function FighterWeaknessesSection({ weaknesses }) {
  return (
    <div style={{
      background: "rgba(248,113,113,0.04)",
      backgroundImage: "repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(248,113,113,0.03) 5px, rgba(248,113,113,0.03) 10px)",
      border: "1px solid rgba(248,113,113,0.18)",
      borderLeft: "3px solid rgba(248,113,113,0.55)",
      borderRadius: "3px 12px 12px 3px",
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 9,
    }}>
      {weaknesses.map((item, i) => (
        <div key={i} style={{ ...s.dotRow, marginBottom: 0 }}>
          <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1, opacity: 0.8 }}>⚠️</span>
          <span style={{ ...s.rowText, color: "#c8a0a0", fontStyle: "italic" }}>{item}</span>
        </div>
      ))}
    </div>
  );
}
