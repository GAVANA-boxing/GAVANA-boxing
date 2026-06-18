"use client";
import { FIGHTER_TECHNIQUES } from "@/lib/fighterTechniques";
import { GOLD } from "@/lib/tokens";
import { T, DIFF_COLOR } from "./TechniqueSheetLocale";

/**
 * Bottom-sheet listing all techniques for a given fighter.
 *
 * @param {{ fighter: object, onClose: () => void, onSelectTech: (fighter: object, tech: object) => void, locale: string }} props
 */
export default function FighterTechSheet({ fighter, onClose, onSelectTech, locale }) {
  const techniques = FIGHTER_TECHNIQUES[fighter.id] || [];
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.7)" }}
      />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 301,
        background: "#0f0c0d",
        borderRadius: "20px 20px 0 0",
        border: "1px solid rgba(255,255,255,0.09)", borderBottom: "none",
        maxHeight: "72vh",
        display: "flex", flexDirection: "column",
      }}>
        {/* Handle */}
        <div style={{ padding: "12px 16px 10px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)", margin: "0 auto 12px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: `${fighter.accent}20`, border: `1.5px solid ${fighter.accent}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 900, color: fighter.accent,
            }}>
              {fighter.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>{fighter.name}</p>
              <p style={{ margin: 0, fontSize: 10, color: fighter.accent, fontWeight: 700 }}>{fighter.style}</p>
            </div>
          </div>
        </div>

        {/* Technique list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px", paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>
          {techniques.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
              {(T[locale] || T.en).noTechniques}
            </p>
          )}
          {techniques.map((tech, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectTech(fighter, tech)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, padding: "12px 13px", marginBottom: 8,
                borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)", cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{tech.title}</p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.3 }}>
                  {(tech.teachingBlocks || []).map(b => b.type).join(" · ")}
                </p>
              </div>
              <span style={{
                fontSize: 9, fontWeight: 900, letterSpacing: 0.5,
                color: DIFF_COLOR[tech.difficulty] || GOLD,
                background: `${DIFF_COLOR[tech.difficulty] || GOLD}16`,
                border: `1px solid ${DIFF_COLOR[tech.difficulty] || GOLD}28`,
                borderRadius: 6, padding: "3px 8px", textTransform: "uppercase", flexShrink: 0,
              }}>{tech.difficulty}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
