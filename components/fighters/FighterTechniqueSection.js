"use client";

import DiagramPlaceholder from "@/components/visual/DiagramPlaceholder";
import TechniqueLessonCard from "@/components/fighters/TechniqueLessonCard";
import { BLOCK_DIAGRAM_TYPE } from "@/lib/visualAssets";
import { GOLD } from "@/lib/tokens";

// ─── Technique lessons section body ──────────────────────────────────────────
// Props:
//   lessons  — FIGHTER_TECHNIQUES[fighter.id] array
//   locale   — locale string
//   accent   — fighter accent color
//   router   — Next.js router
//   fighterId — string
export default function FighterTechniqueSection({ lessons, locale, accent, router, fighterId }) {
  const acc = accent;

  // Localise a field that may be a string or { en, mn, ko } object
  const L = (f) => {
    if (!f) return "";
    if (typeof f === "object" && !Array.isArray(f)) return f[locale] || f.en || "";
    return f;
  };

  const DIFF_C = { beginner: "#10B981", intermediate: "#F59E0B", advanced: "#F87171" };

  return (
    <>
      {/* Technique visual thumbnail strip (only when > 1 lesson) */}
      {lessons.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14, WebkitOverflowScrolling: "touch" }}>
          {lessons.map((lesson, i) => {
            const diagramType = BLOCK_DIAGRAM_TYPE[lesson.teachingBlocks?.[0]?.type] || "ring";
            const dc = DIFF_C[lesson.difficulty] || GOLD;
            return (
              <div key={i} style={{
                flexShrink: 0, width: 84, borderRadius: 10, overflow: "hidden",
                background: `${acc}08`, border: `1px solid ${acc}22`,
              }}>
                <div style={{ height: 54, overflow: "hidden" }}>
                  <DiagramPlaceholder type={diagramType} accent={acc} width={84} height={54} />
                </div>
                <div style={{ padding: "5px 7px 7px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                    <span style={{ fontSize: 7, fontWeight: 900, color: dc, background: `${dc}18`, borderRadius: 3, padding: "1px 4px", letterSpacing: 0.5 }}>
                      {lesson.difficulty?.slice(0, 3)?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: "rgba(255,255,255,0.65)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {lesson.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lessons.map((lesson, i) => (
        <TechniqueLessonCard
          key={i}
          index={i + 1}
          title={lesson.title}
          difficulty={lesson.difficulty}
          teachingBlocks={lesson.teachingBlocks.map((b) => ({ ...b, value: L(b.value) }))}
          explanation={L(lesson.explanation)}
          bodyCue={L(lesson.bodyCue)}
          commonMistake={L(lesson.commonMistake)}
          coachNotes={L(lesson.coachNotes)}
          drillSteps={(lesson.drillSteps || []).map(L)}
          accent={acc}
          defaultOpen={i === 0}
          locale={locale}
          fighterId={fighterId}
          router={router}
        />
      ))}
    </>
  );
}
