"use client";

// The five preset drills as one row of chips on the Train start screen. A chip sets the round's
// drill (length, target) in place; tapping the chosen one again goes back to the default round.
import { DRILLS, FOCUS_COLORS } from "@/lib/drillConfig";
import { loc } from "@/lib/loc";
import { BRAND } from "@/components/ui/brand";

export const PRESET_DRILLS = ["shadowboxing", "jab-rhythm", "pressure-drill", "defense-slips", "footwork"];

const NAMES = {
  "shadowboxing":   ["Сүүдэр бокс", "섀도복싱", "Shadowboxing"],
  "jab-rhythm":     ["Жабын хэмнэл", "잽 리듬", "Jab rhythm"],
  "pressure-drill": ["Дарамт", "압박 드릴", "Pressure"],
  "defense-slips":  ["Хамгаалалт", "방어", "Defence"],
  "footwork":       ["Хөлийн хөдөлгөөн", "풋워크", "Footwork"],
};

export function drillChipName(locale, id) {
  const n = NAMES[id];
  return n ? loc(locale, ...n) : id;
}

export default function DrillChips({ locale = "en", value = null, onChange }) {
  return (
    <div data-testid="drill-chips" role="group" aria-label={loc(locale, "Дасгал", "드릴", "Drills")}
      style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 16px 6px", margin: "0 -16px", scrollbarWidth: "none" }}>
      {PRESET_DRILLS.map((id) => {
        const on = value === id;
        const color = FOCUS_COLORS[DRILLS[id].focusType] || BRAND.muted;
        return (
          <button key={id} type="button" aria-pressed={on} data-testid={`drill-chip-${id}`}
            onClick={() => onChange?.(on ? null : id)}
            style={{ flexShrink: 0, minHeight: 44, padding: "0 14px", borderRadius: 999, fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
              border: `1px solid ${on ? color : BRAND.line}`, background: on ? `${color}33` : "rgba(255,255,255,0.05)", color: BRAND.text }}>
            {drillChipName(locale, id)} · {DRILLS[id].durationSeconds}{loc(locale, "с", "초", "s")}
          </button>
        );
      })}
    </div>
  );
}
