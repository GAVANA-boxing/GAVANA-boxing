"use client";

import { GOLD, goldAlpha } from "@/lib/tokens";
import { DRILL_TYPES } from "./drillsConstants";

const LABEL = { mn: "Дасгалын төрөл", en: "Drill Type" };

/**
 * @param {{ selectedType: string, onSelect: (type: string) => void, locale: string }} props
 */
export default function TypeChips({ selectedType, onSelect, locale }) {
  const mn = locale === "mn";

  return (
    <>
      <p style={{ margin: "0 0 8px", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase" }}>
        {mn ? LABEL.mn : LABEL.en}
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {DRILL_TYPES.map((t) => {
          const active = selectedType === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onSelect(t.key)}
              style={{
                flex: 1, padding: "9px 0",
                borderRadius: 11,
                background: active ? goldAlpha(0.12) : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${active ? goldAlpha(0.4) : "rgba(255,255,255,0.07)"}`,
                color: active ? GOLD : "rgba(255,255,255,0.4)",
                fontSize: 12, fontWeight: 800, cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              {mn ? t.labelMn : t.labelEn}
            </button>
          );
        })}
      </div>
    </>
  );
}
