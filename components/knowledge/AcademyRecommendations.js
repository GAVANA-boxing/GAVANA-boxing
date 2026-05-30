"use client";

import { useMemo } from "react";
import { ACADEMY_LESSONS } from "@/lib/academyLessons";
import { ACADEMY_PATHS, getPathProgress, getLessonStatus } from "@/lib/academyPaths";

// Circular sequence: completing one punch naturally leads to the next skill
const SEQUENCE_NEXT = {
  "jab-mechanics":        "cross-mechanics",
  "cross-mechanics":      "hook-mechanics",
  "hook-mechanics":       "footwork-angle-exit",
  "footwork-angle-exit":  "guard-recovery",
  "guard-recovery":       "jab-mechanics",
};

// Fallback priority for weakness when no attempts exist
const WEAKNESS_PRIORITY = [
  "guard-recovery", "footwork-angle-exit", "cross-mechanics", "hook-mechanics", "jab-mechanics",
];

const TYPE_META = {
  weakness: { color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.18)" },
  style:    { color: "#A855F7", bg: "rgba(168,85,247,0.08)",  border: "rgba(168,85,247,0.18)" },
  path:     { color: "#34D399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.18)" },
};

function getLesson(id) { return ACADEMY_LESSONS.find(l => l.id === id); }
function scoreOf(id, lp) { return lp[id]?.bestScore || 0; }

function buildRecommendations(lessonProgress, currentPathId, locale) {
  const used = new Set();
  const results = [];

  // ── 1. Weakness fix ───────────────────────────────────────────────────────
  const inProgress = ACADEMY_LESSONS
    .filter(l => getLessonStatus(l.id, lessonProgress) === "in_progress")
    .sort((a, b) => scoreOf(a.id, lessonProgress) - scoreOf(b.id, lessonProgress));

  let wLesson = inProgress[0] || null;

  if (!wLesson) {
    // No in-progress lessons — pick first not-started by priority
    wLesson = WEAKNESS_PRIORITY
      .map(getLesson).filter(Boolean)
      .find(l => getLessonStatus(l.id, lessonProgress) === "not_started")
      || ACADEMY_LESSONS[0];
  }

  if (wLesson) {
    const score = scoreOf(wLesson.id, lessonProgress);
    const reason = score > 0
      ? (locale === "mn" ? `Оноо: ${score.toFixed(1)}/10 — сайжруулах боломжтой` : `Score ${score.toFixed(1)}/10 — room to improve`)
      : (locale === "mn" ? "Ихэнх боксерт энэ хэсэг хэцүү байдаг" : "Most boxers struggle here first");
    results.push({
      lesson: wLesson, type: "weakness",
      label: locale === "mn" ? "СУЛЫН ЗАСВАР" : locale === "ko" ? "약점 보완" : "WEAKNESS FIX",
      reason,
    });
    used.add(wLesson.id);
  }

  // ── 2. Style match — build on best lesson ─────────────────────────────────
  const allAttempted = ACADEMY_LESSONS
    .filter(l => lessonProgress[l.id]?.attempted)
    .sort((a, b) => scoreOf(b.id, lessonProgress) - scoreOf(a.id, lessonProgress));

  const bestId = allAttempted[0]?.id;
  const seqId = SEQUENCE_NEXT[bestId] || "cross-mechanics";
  let sLesson = getLesson(seqId);

  // Deduplicate — if already used, pick first unused
  if (!sLesson || used.has(sLesson.id)) {
    sLesson = ACADEMY_LESSONS.find(l => !used.has(l.id)) || null;
  }

  if (sLesson) {
    const reason = bestId
      ? (locale === "mn"
          ? `${getLesson(bestId)?.title || ""}-н дараагийн алхам`
          : `Builds on your ${getLesson(bestId)?.title || ""}`)
      : (locale === "mn" ? "Таны загварт тохирно" : "Matches your style");
    results.push({
      lesson: sLesson, type: "style",
      label: locale === "mn" ? "ЗАГВАР ТОХИРОЛ" : locale === "ko" ? "스타일 매치" : "STYLE MATCH",
      reason,
    });
    used.add(sLesson.id);
  }

  // ── 3. Path momentum ──────────────────────────────────────────────────────
  const path = ACADEMY_PATHS.find(p => p.id === currentPathId) || ACADEMY_PATHS[0];
  const { nextLessonId } = getPathProgress(path, lessonProgress);
  let pLesson = nextLessonId ? getLesson(nextLessonId) : null;

  if (!pLesson || used.has(pLesson.id)) {
    pLesson = ACADEMY_LESSONS.find(l => !used.has(l.id)) || null;
  }

  if (pLesson) {
    const pathName = path.title?.[locale] || path.title?.en || "";
    results.push({
      lesson: pLesson, type: "path",
      label: locale === "mn" ? "ЗАМЫН ДАРААГИЙН" : locale === "ko" ? "경로 다음" : "NEXT ON PATH",
      reason: `${path.emoji} ${pathName}`,
    });
  }

  return results;
}

export default function AcademyRecommendations({ lessonProgress, currentPathId, locale, router }) {
  const recs = useMemo(
    () => buildRecommendations(lessonProgress, currentPathId, locale),
    [lessonProgress, currentPathId, locale],
  );

  if (recs.length === 0) return null;

  const trainLabel = locale === "mn" ? "Дасгалдах →" : locale === "ko" ? "훈련 →" : "Train →";
  const sectionTitle = locale === "mn" ? "Танд санал болгох" : locale === "ko" ? "추천 레슨" : "Recommended for you";

  return (
    <div>
      <div style={{
        fontSize: 7.5, fontWeight: 900, letterSpacing: 1.8,
        color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 10,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span>✦</span> {sectionTitle}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {recs.map(({ lesson, type, label, reason }) => {
          const acc = lesson.accentColor;
          const meta = TYPE_META[type] || TYPE_META.path;
          return (
            <div
              key={lesson.id}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 13px", borderRadius: 12,
                background: `${acc}07`,
                border: `1px solid ${acc}1e`,
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{lesson.emoji}</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: 3 }}>
                  <span style={{
                    fontSize: 7, fontWeight: 900, letterSpacing: 1.2,
                    color: meta.color,
                    background: meta.bg,
                    border: `1px solid ${meta.border}`,
                    borderRadius: 3, padding: "2px 6px", textTransform: "uppercase",
                  }}>
                    {label}
                  </span>
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 900, color: "#fff",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {lesson.title}
                </div>
                {reason && (
                  <div style={{
                    fontSize: 9.5, color: "rgba(255,255,255,0.32)", marginTop: 1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {reason}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => router.push(`/${locale}/train?academyLesson=${lesson.id}`)}
                style={{
                  flexShrink: 0, padding: "6px 12px", borderRadius: 8,
                  background: `${acc}16`, border: `1px solid ${acc}32`,
                  color: acc, fontSize: 9.5, fontWeight: 900,
                  cursor: "pointer", letterSpacing: 0.5, whiteSpace: "nowrap",
                }}
              >
                {trainLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
