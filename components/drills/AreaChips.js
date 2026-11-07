"use client";

import { RADIUS } from "@/lib/tokens";
import { AREAS, AREA_COLOR, areaLabel } from "./drillsConstants";

const LABEL = { mn: "Чиглэл", ko: "영역", en: "Area" };

/**
 * @param {{ selectedArea: string | null, onSelect: (area: string) => void, locale: string }} props
 */
export default function AreaChips({ selectedArea, onSelect, locale }) {
  const mn = locale === "mn";

  return (
    <>
      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase" }}>
        {LABEL[locale] || LABEL.en}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
        {AREAS.map((area) => {
          const col = AREA_COLOR[area];
          const active = selectedArea === area;
          return (
            <button
              key={area}
              type="button"
              onClick={() => onSelect(area)}
              style={{
                padding: "9px 15px",
                fontFamily: "inherit",
                borderRadius: RADIUS.full,
                background: active ? `${col}22` : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${active ? col + "66" : "rgba(255,255,255,0.08)"}`,
                color: active ? col : "rgba(255,255,255,0.45)",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              {areaLabel(area, locale)}
            </button>
          );
        })}
      </div>
    </>
  );
}
