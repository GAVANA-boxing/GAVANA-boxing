"use client";
import { GOLD } from "@/lib/tokens";
import { getLocal } from "@/lib/i18n";
import { T, BLOCK_ICON } from "./TechniqueSheetLocale";

/**
 * Scrollable content body for a technique detail sheet.
 * Renders explanation, teaching blocks, body cue, what-you-should-feel,
 * common mistake, drill steps, coach notes, and scoring metrics.
 *
 * @param {{ fighter: object, technique: object, locale: string }} props
 */
export default function TechDetailContent({ fighter, technique, locale }) {
  const t = T[locale] || T.en;

  const SECTION = (emoji, label, children) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.45)",
        letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span>{emoji}</span>{label}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>
      {/* What it is */}
      {technique.explanation && SECTION("📖", t.whatItIs,
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
          {getLocal(technique.explanation, locale)}
        </p>
      )}

      {/* Teaching blocks */}
      {(technique.teachingBlocks || []).length > 0 && SECTION("⚡", t.howToDo,
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {technique.teachingBlocks.map((block, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{BLOCK_ICON[block.type] || "▸"}</span>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1 }}>{block.type}</p>
                <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.45 }}>{getLocal(block.value, locale)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Body cue */}
      {technique.bodyCue && SECTION("🤸", t.bodyFeel,
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, fontStyle: "italic" }}>
          &ldquo;{getLocal(technique.bodyCue, locale)}&rdquo;
        </p>
      )}

      {/* What you should feel */}
      {(technique.whatYouShouldFeel || []).length > 0 && SECTION("✋", t.whatFeel,
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {technique.whatYouShouldFeel.map((cue, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.18)" }}>
              <span style={{ color: "#60A5FA", flexShrink: 0, fontSize: 13 }}>·</span>
              <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.45, fontStyle: "italic" }}>{cue}</p>
            </div>
          ))}
        </div>
      )}

      {/* Common mistake */}
      {technique.commonMistake && SECTION("⚠️", t.commonMistake,
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)" }}>
          <p style={{ margin: 0, fontSize: 12.5, color: "#fca5a5", lineHeight: 1.45 }}>{getLocal(technique.commonMistake, locale)}</p>
        </div>
      )}

      {/* Drill */}
      {(technique.drillSteps || []).length > 0 && SECTION("🎯", t.drill,
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {technique.drillSteps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, background: `${GOLD}18`, border: `1px solid ${GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: GOLD, flexShrink: 0 }}>{i + 1}</span>
              <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.45 }}>{getLocal(step, locale)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Coach notes */}
      {technique.coachNotes && SECTION("💡", t.coachNotes,
        <p style={{ margin: 0, fontSize: 12.5, color: GOLD, lineHeight: 1.5 }}>{getLocal(technique.coachNotes, locale)}</p>
      )}

      {/* Scoring metrics */}
      {(technique.scoringMetrics || []).length > 0 && SECTION("📊", t.howScored,
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {technique.scoringMetrics.map((m, i) => (
            <div key={i} style={{ padding: "9px 12px", borderRadius: 8, background: "rgba(245,196,81,0.06)", border: "1px solid rgba(245,196,81,0.18)" }}>
              <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 900, color: GOLD, letterSpacing: 0.5 }}>{m.metric}</p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{m.description}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: "calc(80px + env(safe-area-inset-bottom))" }} />
    </div>
  );
}
