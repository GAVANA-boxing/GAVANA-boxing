"use client";

import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";

export default function FighterStyleChip({ fighterArchetype, t, onChangeStyle }) {
  if (!fighterArchetype || !ARCHETYPE_DISPLAY[fighterArchetype]) return null;

  const arch = ARCHETYPE_DISPLAY[fighterArchetype];

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", borderRadius: 12, marginBottom: 14,
      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.065)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{arch.emoji}</span>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: 1.2 }}>
            {t("dashboardFighterStyleLabel")}
          </div>
          <div style={{ fontSize: 13, fontWeight: 900, color: arch.color }}>{arch.name}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onChangeStyle}
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.22)", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "4px 8px" }}
      >
        {t("dashboardChangeStyle")}
      </button>
    </div>
  );
}
