"use client";
import { useState } from "react";
import { GOLD, goldAlpha } from "@/lib/tokens";
import { getLocal } from "@/lib/i18n";

const LEVEL_COLOR = { beginner: "#10B981", intermediate: "#F59E0B", advanced: "#F87171" };
const LEVEL_EMOJI = { beginner: "🟢", intermediate: "🟡", advanced: "🔴" };

export default function LessonDrillSection({ lesson, locale, L }) {
  const [activeDrillLevel, setActiveDrillLevel] = useState("beginner");
  const activeDrill =
    lesson.drillProgression?.find(d => d.level === activeDrillLevel) ||
    lesson.drillProgression?.[0];

  if (lesson.drillProgression?.length > 0) {
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 1.5, color: GOLD, textTransform: "uppercase", marginBottom: 8 }}>
          {L.drillProg}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {lesson.drillProgression.map(d => {
            const isActive = activeDrillLevel === d.level;
            const lc = LEVEL_COLOR[d.level] || GOLD;
            return (
              <button
                key={d.level}
                type="button"
                onClick={() => setActiveDrillLevel(d.level)}
                style={{
                  flex: 1, padding: "6px 8px", borderRadius: 8,
                  background: isActive ? `${lc}18` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isActive ? lc + "45" : "rgba(255,255,255,0.08)"}`,
                  color: isActive ? lc : "rgba(255,255,255,0.35)",
                  fontSize: 8.5, fontWeight: 900, cursor: "pointer",
                  transition: "all 0.15s", textTransform: "uppercase", letterSpacing: 0.5,
                }}
              >
                {LEVEL_EMOJI[d.level]} {L[d.level] || d.level}
              </button>
            );
          })}
        </div>
        {activeDrill && (
          <div style={{
            padding: "10px 12px", borderRadius: 9,
            background: goldAlpha(0.06), border: `1px solid ${goldAlpha(0.18)}`,
            borderLeft: "2.5px solid rgba(245,196,81,0.5)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 7.5, fontWeight: 900, color: GOLD, letterSpacing: 1.2, textTransform: "uppercase" }}>
                🎯 {getLocal(activeDrill.title, locale)}
              </div>
              {activeDrill.duration && (
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
                  {activeDrill.duration}
                </span>
              )}
            </div>
            {activeDrill.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: i < activeDrill.steps.length - 1 ? 6 : 0 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: goldAlpha(0.14), border: `1px solid ${goldAlpha(0.28)}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 900, color: GOLD, flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, paddingTop: 1 }}>
                  {getLocal(step, locale)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (lesson.drill) {
    return (
      <div style={{
        padding: "10px 12px", borderRadius: 9, marginBottom: 14,
        background: goldAlpha(0.06), border: `1px solid ${goldAlpha(0.18)}`,
        borderLeft: "2.5px solid rgba(245,196,81,0.5)",
      }}>
        <div style={{ fontSize: 7.5, fontWeight: 900, color: GOLD, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
          🎯 {L.drill} · {getLocal(lesson.drill.title, locale)}
        </div>
        {lesson.drill.steps.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: i < lesson.drill.steps.length - 1 ? 6 : 0 }}>
            <span style={{
              width: 18, height: 18, borderRadius: 5,
              background: goldAlpha(0.14), border: `1px solid ${goldAlpha(0.28)}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 900, color: GOLD, flexShrink: 0,
            }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, paddingTop: 1 }}>
              {getLocal(step, locale)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
