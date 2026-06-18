"use client";

import { ACADEMY_LESSONS } from "@/lib/academyLessons";

const PASS_SCORE = 6.5;

const L = {
  progressTracked: { mn: "Дэвшил хадгаласан ✓", en: "Progress tracked ✓" },
  notComplete: (locale, score) =>
    locale === "mn"
      ? `6.5/10 хүрвэл хичээл дуусна. Одоо ${score} байна. Дахин дасгалдана уу.`
      : `Score 6.5/10 to complete this lesson. You got ${score}. Train again to improve.`,
  nextLesson: { mn: "Дараагийн хичээл", en: "Next Lesson" },
  trainBtn: "Train →",
};

export default function AcademyLessonCard({ academyLesson, result, locale, router }) {
  const score = result?.score ?? 0;
  const goalMet = score >= PASS_SCORE;
  const acc = academyLesson.accentColor;

  const currentIdx = ACADEMY_LESSONS.findIndex((l) => l.id === academyLesson.id);
  const nextLesson = currentIdx >= 0 ? ACADEMY_LESSONS[currentIdx + 1] : null;

  return (
    <div style={{
      margin: "0 20px 8px",
      padding: "12px 14px",
      borderRadius: 12,
      background: `${acc}07`,
      border: `1px solid ${acc}25`,
      borderLeft: `3px solid ${acc}66`,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>{academyLesson.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.8, color: acc, textTransform: "uppercase" }}>
            ACADEMY LESSON · {L.progressTracked[locale] ?? L.progressTracked.en}
          </div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#fff", marginTop: 1 }}>
            {academyLesson.title}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 20,
            background: goalMet ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
            border: `1px solid ${goalMet ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
          }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: goalMet ? "#34D399" : "#F87171", letterSpacing: 1 }}>
              {goalMet ? "✓ COMPLETE" : `${score.toFixed(1)}/6.5`}
            </span>
          </div>
        </div>
      </div>

      {/* Not-yet-passed hint */}
      {!goalMet && (
        <div style={{ marginBottom: 8, padding: "7px 10px", borderRadius: 8, background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.14)" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
            {L.notComplete(locale, score.toFixed(1))}
          </span>
        </div>
      )}

      {/* Next lesson row */}
      {nextLesson && (
        <div style={{
          padding: "8px 10px", borderRadius: 8,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        }}>
          <div>
            <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 1.2, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 2 }}>
              {L.nextLesson[locale] ?? L.nextLesson.en}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.65)" }}>
              {nextLesson.emoji} {nextLesson.title}
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/train?academyLesson=${nextLesson.id}`)}
            style={{
              flexShrink: 0, padding: "5px 12px", borderRadius: 8,
              background: `${nextLesson.accentColor}18`, border: `1px solid ${nextLesson.accentColor}35`,
              color: nextLesson.accentColor, fontSize: 9, fontWeight: 900,
              cursor: "pointer", letterSpacing: 1, textTransform: "uppercase",
            }}
          >
            {L.trainBtn}
          </button>
        </div>
      )}
    </div>
  );
}
