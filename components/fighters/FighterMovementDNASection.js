"use client";

import DiagramPlaceholder from "@/components/visual/DiagramPlaceholder";
import { getFighterAssets, MOVEMENT_ATTR_LABELS } from "@/lib/visualAssets";
import s from "@/components/fighters/fighterStyles";

// ─── Movement DNA section body (rendered inside a FighterSection wrapper) ─────
// Props: fighter, locale, accent, moveDNADesc (localized string)
export default function FighterMovementDNASection({ fighter, locale, accent, moveDNADesc }) {
  const acc = accent;
  const assets = getFighterAssets(fighter.id);
  const { movementProfile, animalEmoji, animal } = assets;

  return (
    <>
      {/* Visual movement profile + animal archetype */}
      <div style={{ marginBottom: 14 }}>
        {/* Animal archetype badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "9px 12px", borderRadius: 10, background: `${acc}08`, border: `1px solid ${acc}18` }}>
          <DiagramPlaceholder type="animal" accent={acc} width={48} height={48} animalEmoji={animalEmoji} animal={animal} />
          <div>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: acc, textTransform: "uppercase", marginBottom: 3 }}>
              {animal} Archetype
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
              {fighter.movementDNA.type}
            </div>
          </div>
        </div>
        {/* Movement profile bars */}
        {Object.entries(movementProfile).map(([key, val]) => {
          const pct = Math.round(val * 100);
          const label = MOVEMENT_ATTR_LABELS[key]?.[locale] || key;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ width: 64, fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: 0.8, flexShrink: 0 }}>
                {label}
              </span>
              <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${pct}%`, borderRadius: 3,
                  background: acc,
                  boxShadow: `0 0 6px ${acc}55`,
                  transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
                }} />
              </div>
              <span style={{ width: 26, textAlign: "right", fontSize: 9, fontWeight: 900, color: pct >= 60 ? acc : "rgba(255,255,255,0.3)", fontFamily: "monospace", flexShrink: 0 }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

      {/* DNA type + tags + description */}
      <div style={{ ...s.dnaBox, borderColor: acc + "35", background: acc + "0a" }}>
        <div style={s.dnaHeader}>
          <span style={{ ...s.dnaType, color: acc }}>{fighter.movementDNA.type}</span>
          <div style={s.dnaTags}>
            {fighter.movementDNA.tags.map((tag) => (
              <span key={tag} style={{ ...s.dnaTag, borderColor: acc + "40", color: acc + "bb" }}>{tag}</span>
            ))}
          </div>
        </div>
        <p style={s.dnaDesc}>{moveDNADesc}</p>
      </div>
    </>
  );
}
