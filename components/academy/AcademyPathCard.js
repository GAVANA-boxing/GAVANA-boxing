"use client";

import { RADIUS } from "@/lib/tokens";
import { ACADEMY_PATHS, getPathProgress, getLessonStatus, pathTitle, pathDesc } from "@/lib/academyPaths";
import { ACADEMY_LESSONS } from "@/lib/academyLessons";

const DIFF_LABEL = {
  beginner:     { en: "Beginner",     mn: "Анхан шат", ko: "초급" },
  intermediate: { en: "Intermediate", mn: "Дунд шат",  ko: "중급" },
  advanced:     { en: "Advanced",     mn: "Дэвшилтэт", ko: "고급" },
};

function diffLabel(d, locale) {
  return DIFF_LABEL[d]?.[locale] || DIFF_LABEL[d]?.en || d;
}

export default function AcademyPathCard({ currentPathId, lessonProgress, locale, onSelectPath, onContinue }) {
  const path = ACADEMY_PATHS.find(p => p.id === currentPathId) || ACADEMY_PATHS[0];
  const progress = getPathProgress(path, lessonProgress);
  const acc = path.accentColor;
  const nextLesson = progress.nextLessonId ? ACADEMY_LESSONS.find(l => l.id === progress.nextLessonId) : null;

  const L = {
    yourPath: locale === "mn" ? "ТАНЫ ЗАМ" : locale === "ko" ? "내 경로" : "YOUR PATH",
    min: locale === "mn" ? "мин" : locale === "ko" ? "분" : "min",
    next: locale === "mn" ? "Дараагийн:" : locale === "ko" ? "다음:" : "Next:",
    cont: locale === "mn" ? "Үргэлжлүүлэх →" : locale === "ko" ? "계속하기 →" : "Continue →",
    done: locale === "mn" ? "Зам дуусгасан! 🏆" : locale === "ko" ? "경로 완료! 🏆" : "Path complete! 🏆",
    change: locale === "mn" ? "Зам солих" : locale === "ko" ? "경로 변경" : "Change Path",
    other: locale === "mn" ? "Бусад замууд" : locale === "ko" ? "다른 경로" : "Other Paths",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ── Current path card ── */}
      <div style={{
        borderRadius: 16, overflow: "hidden",
        border: `1px solid ${acc}28`,
        background: `linear-gradient(160deg, ${acc}0d 0%, rgba(0,0,0,0.22) 100%)`,
      }}>
        {/* Header row */}
        <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${acc}14` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{path.emoji}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.8, color: acc, textTransform: "uppercase", marginBottom: 1 }}>
                  {L.yourPath}
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {pathTitle(path, locale)}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span style={{
                fontSize: 7, fontWeight: 900, letterSpacing: 0.8,
                color: acc, background: `${acc}14`, border: `1px solid ${acc}28`,
                borderRadius: 4, padding: "2px 7px", textTransform: "uppercase",
              }}>
                {diffLabel(path.difficulty, locale)}
              </span>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", fontWeight: 700 }}>
                {path.estimatedMinutes}{L.min}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${progress.pct}%`,
                background: `linear-gradient(90deg, ${acc}, ${acc}bb)`,
                borderRadius: 2,
                transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
              }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color: acc, flexShrink: 0 }}>
              {progress.done}/{progress.total}
            </span>
          </div>
        </div>

        {/* Lesson dot strip */}
        <div style={{ padding: "8px 14px 0", display: "flex", gap: 4 }}>
          {path.lessonIds.map(lid => {
            const st = getLessonStatus(lid, lessonProgress);
            return (
              <div
                key={lid}
                style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: st === "completed" ? "#34D399"
                    : st === "in_progress"  ? "#F59E0B"
                    : "rgba(255,255,255,0.07)",
                  transition: "background 0.3s",
                }}
              />
            );
          })}
        </div>

        {/* Next lesson row */}
        <div style={{ padding: "10px 14px 12px" }}>
          {nextLesson ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 7.5, fontWeight: 900, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 2 }}>
                  {L.next}
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {nextLesson.emoji} {nextLesson.title}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onContinue(progress.nextLessonId)}
                style={{
                  flexShrink: 0, padding: "9px 16px",
                  background: `linear-gradient(145deg, ${acc}, ${acc}cc)`,
                  border: "none", borderRadius: 10,
                  color: "#000", fontSize: 11, fontWeight: 900,
                  cursor: "pointer", letterSpacing: 0.3,
                  boxShadow: `0 3px 12px ${acc}44`,
                }}
              >
                {L.cont}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: "#34D399" }}>{L.done}</span>
              <button
                type="button"
                onClick={() => onSelectPath(ACADEMY_PATHS.find(p => p.id !== currentPathId)?.id || "foundation")}
                style={{
                  padding: "7px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 800, cursor: "pointer",
                }}
              >
                {L.change}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Path selector tabs ── */}
      <style>{`.ap-scroll::-webkit-scrollbar{display:none}`}</style>
      <div className="ap-scroll" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <div style={{ display: "flex", gap: 6, paddingBottom: 2 }}>
          {ACADEMY_PATHS.map(p => {
            const pp = getPathProgress(p, lessonProgress);
            const isActive = p.id === currentPathId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPath(p.id)}
                style={{
                  flexShrink: 0,
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 11px", borderRadius: 20,
                  background: isActive ? `${p.accentColor}18` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isActive ? p.accentColor + "45" : "rgba(255,255,255,0.08)"}`,
                  color: isActive ? p.accentColor : "rgba(255,255,255,0.38)",
                  fontSize: 9.5, fontWeight: 900, cursor: "pointer",
                  transition: "all 0.15s", whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 12 }}>{p.emoji}</span>
                <span>{pathTitle(p, locale)}</span>
                {pp.done > 0 && (
                  <span style={{
                    fontSize: 7.5, fontWeight: 900,
                    color: pp.pct === 100 ? "#34D399" : isActive ? p.accentColor : "rgba(255,255,255,0.3)",
                    background: pp.pct === 100 ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${pp.pct === 100 ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 3, padding: "1px 4px",
                  }}>
                    {pp.pct}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
