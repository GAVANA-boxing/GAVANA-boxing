"use client";

import { useState } from "react";
import { GOLD, RADIUS, whiteAlpha, goldAlpha } from "@/lib/tokens";
import DiagramPlaceholder from "@/components/visual/DiagramPlaceholder";
import FighterSilhouette from "@/components/visual/FighterSilhouette";

const PANEL_LABEL = {
  en: { focus: "Focus Areas", habit: "Signature Habit", cue: "Cue", drill: "Beginner Drill", advanced: "Advanced Lesson", steps: "Steps", note: "Note" },
  mn: { focus: "Анхаарах чиглэлүүд", habit: "Онцлог зуршил", cue: "Зааварчилгаа", drill: "Анхан шатны дасгал", advanced: "Дэвшилтэт хичээл", steps: "Алхамууд", note: "Тэмдэглэл" },
  ko: { focus: "집중 영역", habit: "시그니처 습관", cue: "포인트", drill: "초급 드릴", advanced: "심화 레슨", steps: "단계", note: "참고" },
};

function FocusCard({ area, accent, index }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      style={{
        width: "100%", textAlign: "left",
        padding: "10px 12px",
        background: open ? `${accent}10` : "rgba(255,255,255,0.025)",
        border: `1px solid ${open ? accent + "35" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 10, cursor: "pointer",
        marginBottom: 6,
        transition: "background 200ms, border-color 200ms",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>{area.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 900, color: open ? "#fff" : "rgba(255,255,255,0.6)", flex: 1, textAlign: "left" }}>
          {area.title}
        </span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke={open ? accent : "rgba(255,255,255,0.3)"}
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms", flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      {open && (
        <p style={{ margin: "8px 0 0 22px", fontSize: 12, color: "rgba(255,255,255,0.58)", lineHeight: 1.55, textAlign: "left" }}>
          {area.description}
        </p>
      )}
    </button>
  );
}

export default function FighterAcademyPanel({ academy, fighterId, locale = "en" }) {
  const [drillOpen, setDrillOpen] = useState(false);
  if (!academy) return null;
  const L = PANEL_LABEL[locale] || PANEL_LABEL.en;
  const acc = academy.accentColor;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Fighter silhouette banner ── */}
      {fighterId && (
        <div style={{
          borderRadius: 12, overflow: "hidden",
          border: `1px solid ${acc}22`,
          background: `${acc}06`,
          display: "flex", alignItems: "stretch", height: 96,
        }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "10px 14px" }}>
            <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 1.8, color: acc, textTransform: "uppercase", marginBottom: 4 }}>
              {academy.systemLabel}
            </div>
            <div style={{
              fontSize: 16, fontWeight: 1000, color: "#fff", lineHeight: 1.1,
              fontFamily: "var(--font-display, 'Anton', sans-serif)", textTransform: "uppercase",
              letterSpacing: "-0.01em", marginBottom: 6,
            }}>
              {academy.systemEmoji} {academy.systemName}
            </div>
            <div style={{ height: 48 }}>
              <DiagramPlaceholder type={academy.diagramType} accent={acc} width={72} height={48} />
            </div>
          </div>
          <div style={{ width: 72, flexShrink: 0 }}>
            <FighterSilhouette fighterId={fighterId} accent={acc} width={72} height={96} />
          </div>
        </div>
      )}

      {/* ── System header (no fighterId fallback) ── */}
      {!fighterId && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px", borderRadius: 12,
          background: `${acc}0a`, border: `1px solid ${acc}22`,
        }}>
          <div style={{ height: 56, flexShrink: 0 }}>
            <DiagramPlaceholder type={academy.diagramType} accent={acc} width={56} height={56} />
          </div>
          <div>
            <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 1.8, color: acc, textTransform: "uppercase", marginBottom: 3 }}>
              {academy.systemLabel}
            </div>
            <div style={{
              fontSize: 15, fontWeight: 1000, color: "#fff", lineHeight: 1.1,
              fontFamily: "var(--font-display, 'Anton', sans-serif)", textTransform: "uppercase",
              letterSpacing: "-0.01em",
            }}>
              {academy.systemEmoji} {academy.systemName}
            </div>
          </div>
        </div>
      )}

      {/* ── Focus areas ── */}
      <div>
        <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 1.8, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 8 }}>
          {L.focus}
        </div>
        {academy.focusAreas.map((area, i) => (
          <FocusCard key={i} area={area} accent={acc} index={i} />
        ))}
      </div>

      {/* ── Signature habit ── */}
      <div style={{
        padding: "12px 14px", borderRadius: 12,
        background: `${goldAlpha(0.06)}`, border: `1px solid ${goldAlpha(0.18)}`,
        borderLeft: `3px solid ${goldAlpha(0.5)}`,
      }}>
        <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 1.8, color: GOLD, textTransform: "uppercase", marginBottom: 6 }}>
          ⭐ {L.habit}
        </div>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 6, lineHeight: 1.3 }}>
          {academy.signatureHabit.title}
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.58)", lineHeight: 1.55 }}>
          {academy.signatureHabit.description}
        </p>
        <div style={{
          padding: "8px 10px", borderRadius: 8,
          background: `${goldAlpha(0.08)}`, border: `1px solid ${goldAlpha(0.2)}`,
        }}>
          <div style={{ fontSize: 7, fontWeight: 900, color: GOLD, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 }}>
            {L.cue}
          </div>
          <p style={{ margin: 0, fontSize: 11.5, color: "#fde68a", lineHeight: 1.5, fontStyle: "italic" }}>
            &ldquo;{academy.signatureHabit.cue}&rdquo;
          </p>
        </div>
      </div>

      {/* ── Beginner drill ── */}
      <div style={{
        borderRadius: 12, overflow: "hidden",
        border: `1px solid ${acc}22`,
      }}>
        <button
          type="button"
          onClick={() => setDrillOpen((v) => !v)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px", background: drillOpen ? `${acc}10` : "rgba(255,255,255,0.025)",
            border: "none", cursor: "pointer",
            transition: "background 200ms",
          }}
        >
          <div>
            <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 1.5, color: acc, textTransform: "uppercase", marginBottom: 2, textAlign: "left" }}>
              🎯 {L.drill}
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", textAlign: "left" }}>
              {academy.beginnerDrill.title}
            </div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke={drillOpen ? acc : "rgba(255,255,255,0.3)"}
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: drillOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms", flexShrink: 0 }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {drillOpen && (
          <div style={{ padding: "0 14px 14px" }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
              {academy.beginnerDrill.description}
            </p>
            <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 1.2, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 8 }}>
              {L.steps}
            </div>
            {academy.beginnerDrill.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: i < academy.beginnerDrill.steps.length - 1 ? 7 : 0 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: `${acc}18`, border: `1px solid ${acc}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 900, color: acc, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, paddingTop: 1 }}>{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Advanced lesson reference ── */}
      <div style={{
        padding: "10px 14px", borderRadius: 10,
        background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.16)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>⚡</span>
        <div>
          <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 1.2, color: "#93C5FD", textTransform: "uppercase", marginBottom: 2 }}>
            {L.advanced}
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{academy.advancedLessonTitle}</div>
          {academy.advancedLessonNote && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>{academy.advancedLessonNote}</div>
          )}
        </div>
      </div>
    </div>
  );
}
