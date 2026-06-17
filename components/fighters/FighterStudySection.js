"use client";

import { GOLD } from "@/lib/tokens";
import s from "@/components/fighters/fighterStyles";

// ─── "What to Study" + "Habits to Copy" section body ─────────────────────────
// Props: whatToStudy (string[]), habits (string[]), locale, accent
export default function FighterStudySection({ whatToStudy, habits, locale, accent }) {
  const habitsLabel = locale === "mn" ? "Дуурайх зуршлууд" : "Habits to copy";

  return (
    <>
      {whatToStudy.map((item, i) => (
        <div key={i} style={s.numRow}>
          <span style={{ ...s.numBadge, background: accent + "22", color: accent }}>{i + 1}</span>
          <span style={s.rowText}>{item}</span>
        </div>
      ))}
      {habits.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.25)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
            {habitsLabel}
          </div>
          {habits.map((item, i) => (
            <div key={i} style={s.dotRow}>
              <span style={{ ...s.dotMark, background: GOLD }} />
              <span style={s.rowText}>{item}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
