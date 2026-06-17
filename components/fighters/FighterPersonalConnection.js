"use client";

import { GOLD } from "@/lib/tokens";
import { translate } from "@/lib/i18n";

// ─── Personal connection panel (derived from training history) ────────────────
// Props: fighter, personalConnection (from getPersonalConnection), locale, accent
export default function FighterPersonalConnection({ fighter, personalConnection, locale, accent }) {
  if (!personalConnection) return null;
  const t = (key) => translate(locale, key);
  const acc = accent;

  return (
    <div style={{
      marginBottom: 16,
      padding: "14px 16px",
      borderRadius: 14,
      background: `linear-gradient(135deg, ${acc}0a 0%, rgba(0,0,0,0) 100%)`,
      border: `1px solid ${acc}30`,
      borderLeft: `3px solid ${acc}`,
    }}>
      <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 8 }}>
        {personalConnection.isDirectlyRelevant ? t("fighterPersonalFocus") : t("fighterPersonalLearn")}
      </div>

      <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.4 }}>
        {personalConnection.isDirectlyRelevant
          ? `Your ${personalConnection.primaryFocus} is ${personalConnection.primaryValue?.toFixed(1)} — ${fighter.name} is one of the best at this.`
          : `${fighter.name} excels at ${personalConnection.teaches.slice(0, 2).join(" & ")}.`}
      </p>

      {(personalConnection.focusStudy.length > 0 || personalConnection.focusDrills.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {personalConnection.focusStudy.map((item, i) => (
            <div key={`s${i}`} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: acc, fontSize: 10, flexShrink: 0, marginTop: 2 }}>→</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{item}</span>
            </div>
          ))}
          {personalConnection.focusDrills.map((item, i) => (
            <div key={`d${i}`} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: GOLD, fontSize: 10, flexShrink: 0, marginTop: 2 }}>▸</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{item}</span>
            </div>
          ))}
        </div>
      )}

      {personalConnection.relevantWeak.length > 1 && (
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {personalConnection.relevantWeak.map((area) => (
            <span key={area} style={{
              fontSize: 9, fontWeight: 800, padding: "2px 8px",
              borderRadius: 999, background: `${acc}14`,
              border: `1px solid ${acc}30`, color: acc,
            }}>
              {area} {personalConnection.teaches.includes(area) ? "↑" : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
