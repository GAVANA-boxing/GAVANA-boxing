"use client";

import { useState } from "react";
import { GOLD, RADIUS, whiteAlpha, goldAlpha } from "@/lib/tokens";
import DiagramPlaceholder from "@/components/visual/DiagramPlaceholder";

const DIFF_COLOR = { beginner: "#10B981", intermediate: "#F59E0B", advanced: "#F87171" };

const LABEL = {
  en: { cues: "Key Cues", mistake: "Common Mistake", drill: "Drill", tip: "Coach Tip", fighter: "Study More", expand: "Show Lesson", collapse: "Hide" },
  mn: { cues: "Гол зааварчилгаа", mistake: "Нийтлэг алдаа", drill: "Дасгал", tip: "Коучийн зөвлөгөө", fighter: "Дэлгэрэнгүй", expand: "Хичээл харах", collapse: "Хаах" },
  ko: { cues: "핵심 포인트", mistake: "일반적인 실수", drill: "드릴", tip: "코치 팁", fighter: "더 공부하기", expand: "레슨 보기", collapse: "닫기" },
};

export default function AcademyLessonCard({ lesson, locale = "en", onStudyFighter, router }) {
  const [open, setOpen] = useState(false);
  const L = LABEL[locale] || LABEL.en;
  const acc = lesson.accentColor;
  const diffColor = DIFF_COLOR[lesson.difficulty] || GOLD;

  return (
    <div style={{
      border: `1px solid ${open ? acc + "30" : acc + "16"}`,
      borderLeft: `3px solid ${open ? acc : acc + "44"}`,
      borderRadius: RADIUS.lg, overflow: "hidden",
      marginBottom: 8,
      background: open
        ? `linear-gradient(160deg, ${acc}08 0%, rgba(0,0,0,0.16) 100%)`
        : "rgba(255,255,255,0.013)",
      transition: "background 240ms ease, border-color 240ms ease",
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", textAlign: "left", padding: "12px 14px 10px", background: "transparent", border: "none", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{lesson.emoji}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 900, color: open ? "#fff" : "rgba(255,255,255,0.7)",
                letterSpacing: 0.3, lineHeight: 1.2, transition: "color 240ms ease",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {lesson.title}
              </div>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", fontWeight: 600, marginTop: 1 }}>
                {lesson.subtitle}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{
              fontSize: 7.5, fontWeight: 900, letterSpacing: 0.8,
              color: diffColor, background: `${diffColor}16`, border: `1px solid ${diffColor}28`,
              borderRadius: 4, padding: "2px 6px", textTransform: "uppercase",
            }}>
              {lesson.difficulty}
            </span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke={open ? acc : "rgba(255,255,255,0.28)"}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: "transform 220ms ease, stroke 220ms ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* Animal + fighter chips */}
        <div style={{ display: "flex", gap: 5 }}>
          <span style={{
            fontSize: 8, fontWeight: 800, color: acc,
            background: `${acc}12`, border: `1px solid ${acc}22`,
            borderRadius: 4, padding: "2px 7px",
          }}>
            {lesson.animalEmoji} {lesson.animal}
          </span>
          <span style={{
            fontSize: 8, fontWeight: 800, color: lesson.relatedFighterAccent,
            background: `${lesson.relatedFighterAccent}10`, border: `1px solid ${lesson.relatedFighterAccent}20`,
            borderRadius: 4, padding: "2px 7px",
          }}>
            Study: {lesson.relatedFighterName}
          </span>
        </div>
      </button>

      {/* ── Expanded body ────────────────────────────────────────────────────── */}
      {open && (
        <div style={{ padding: "0 14px 14px" }}>

          {/* Hero diagram */}
          <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
            <DiagramPlaceholder type={lesson.diagramType} accent={acc} width="100%" height={90} />
          </div>

          {/* Explanation */}
          <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.65 }}>
            {lesson.explanation}
          </p>

          {/* Key cues */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 1.5, color: acc, textTransform: "uppercase", marginBottom: 8 }}>
              {L.cues}
            </div>
            {lesson.keyCues.map((cue, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 7 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: `${acc}18`, border: `1px solid ${acc}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 900, color: acc, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.5, paddingTop: 1 }}>
                  {cue}
                </span>
              </div>
            ))}
          </div>

          {/* Common mistake */}
          <div style={{
            padding: "10px 12px", borderRadius: 9, marginBottom: 14,
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
            borderLeft: "2.5px solid rgba(239,68,68,0.6)",
          }}>
            <div style={{ fontSize: 7.5, fontWeight: 900, color: "#F87171", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>
              ⚠️ {L.mistake}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#fca5a5", lineHeight: 1.5 }}>{lesson.commonMistake}</p>
          </div>

          {/* Drill */}
          <div style={{
            padding: "10px 12px", borderRadius: 9, marginBottom: 14,
            background: `${goldAlpha(0.06)}`, border: `1px solid ${goldAlpha(0.18)}`,
            borderLeft: "2.5px solid rgba(245,196,81,0.5)",
          }}>
            <div style={{ fontSize: 7.5, fontWeight: 900, color: GOLD, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
              🎯 {L.drill} · {lesson.drill.title}
            </div>
            {lesson.drill.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: i < lesson.drill.steps.length - 1 ? 6 : 0 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: `${goldAlpha(0.14)}`, border: `1px solid ${goldAlpha(0.28)}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 900, color: GOLD, flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, paddingTop: 1 }}>{step}</span>
              </div>
            ))}
          </div>

          {/* Coach tip */}
          {lesson.coachTip && (
            <div style={{
              padding: "9px 12px", borderRadius: 9, marginBottom: 14,
              background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.18)",
              borderLeft: "2.5px solid rgba(96,165,250,0.45)",
            }}>
              <div style={{ fontSize: 7.5, fontWeight: 900, color: "#93C5FD", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>
                💡 {L.tip}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.58)", lineHeight: 1.5, fontStyle: "italic" }}>
                &ldquo;{lesson.coachTip}&rdquo;
              </p>
            </div>
          )}

          {/* Study more fighter CTA */}
          {onStudyFighter && (
            <button
              type="button"
              onClick={() => onStudyFighter(lesson.relatedFighter)}
              style={{
                width: "100%", padding: "10px 14px",
                background: `${lesson.relatedFighterAccent}14`,
                border: `1px solid ${lesson.relatedFighterAccent}30`,
                borderRadius: RADIUS.md,
                color: lesson.relatedFighterAccent, fontSize: 10, fontWeight: 900,
                letterSpacing: 1.5, textTransform: "uppercase",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {L.fighter} → {lesson.relatedFighterName}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
