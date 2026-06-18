"use client";

import { useState } from "react";
import { GOLD, RADIUS } from "@/lib/tokens";
import { getLocal } from "@/lib/i18n";
import LessonExpandedBody from "@/components/knowledge/LessonExpandedBody";

const DIFF_COLOR = { beginner: "#10B981", intermediate: "#F59E0B", advanced: "#F87171" };

const LABEL = {
  en: {
    expand: "Show Lesson", collapse: "Hide",
    beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced",
  },
  mn: {
    expand: "Хичээл харах", collapse: "Хаах",
    beginner: "Анхан", intermediate: "Дунд", advanced: "Ахисан",
  },
  ko: {
    expand: "레슨 보기", collapse: "닫기",
    beginner: "입문", intermediate: "중급", advanced: "고급",
  },
};

export default function AcademyLessonCard({ lesson, locale = "en", lessonStatus = "not_started", bestScore, onStudyFighter, router }) {
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
        onClick={() => setOpen(v => !v)}
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
                {getLocal(lesson.title, locale)}
              </div>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", fontWeight: 600, marginTop: 1 }}>
                {getLocal(lesson.subtitle, locale)}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {lessonStatus === "completed" && (
              <span style={{
                fontSize: 8, fontWeight: 900,
                color: "#34D399", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.28)",
                borderRadius: 4, padding: "2px 6px",
              }}>✓</span>
            )}
            {lessonStatus === "in_progress" && bestScore > 0 && (
              <span style={{
                fontSize: 7.5, fontWeight: 900,
                color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 4, padding: "2px 6px",
              }}>{bestScore.toFixed(1)}</span>
            )}
            <span style={{
              fontSize: 7.5, fontWeight: 900, letterSpacing: 0.8,
              color: diffColor, background: `${diffColor}16`, border: `1px solid ${diffColor}28`,
              borderRadius: 4, padding: "2px 6px", textTransform: "uppercase",
            }}>
              {L[lesson.difficulty] || lesson.difficulty}
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

      {/* ── Expanded body ──────────────────────────────────────────────────── */}
      {open && (
        <LessonExpandedBody
          lesson={lesson}
          locale={locale}
          acc={acc}
          onStudyFighter={onStudyFighter}
          router={router}
        />
      )}
    </div>
  );
}
