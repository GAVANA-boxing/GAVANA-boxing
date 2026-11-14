"use client";

// After a round done with an Academy lesson: did it count for the lesson, and what is next.
// What "done" means per lesson is in lib/academyProgress.js — a punch lesson needs the pass
// score; a defence / footwork lesson is done by completing the round (the score doesn't measure
// that skill, so it is never called "passed").
import { ACADEMY_LESSONS } from "@/lib/academyLessons";
import { lessonRoundResult, ACADEMY_PASS_SCORE } from "@/lib/academyProgress";
import { loc, tx } from "@/lib/loc";
import { BRAND } from "@/components/ui/brand";

export default function AcademyLessonCard({ academyLesson, result, punches = null, locale, router }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const score = Number(result?.score) || 0;
  // The result modal only renders this card for a scored round; `punches` is passed when known.
  const r = lessonRoundResult(academyLesson.id, { score, punches: punches ?? 99 });
  const acc = academyLesson.accentColor || BRAND.gold;

  const currentIdx = ACADEMY_LESSONS.findIndex((l) => l.id === academyLesson.id);
  const nextLesson = currentIdx >= 0 ? ACADEMY_LESSONS[currentIdx + 1] : null;
  const again = () => router.push(`/${locale}/train?academyLesson=${academyLesson.id}`);

  return (
    <section data-testid="academy-lesson-result" style={{ margin: "0 20px 8px", padding: 14, borderRadius: 16, background: `${acc}0d`, border: `1px solid ${acc}33` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span aria-hidden="true" style={{ fontSize: 22, flexShrink: 0 }}>{academyLesson.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: acc }}>{L("Академийн хичээл", "아카데미 수업", "Academy lesson")}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: BRAND.text, marginTop: 1, overflowWrap: "anywhere" }}>{tx(academyLesson.title, locale)}</div>
        </div>
        <span data-testid="academy-lesson-status" style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 999, fontSize: 13, fontWeight: 800, color: r.done ? BRAND.green : BRAND.gold, background: r.done ? "rgba(52,211,153,0.12)" : "rgba(245,196,81,0.12)", border: `1px solid ${r.done ? "rgba(52,211,153,0.4)" : "rgba(245,196,81,0.4)"}` }}>
          {r.done ? L("✓ Хийгдсэн", "✓ 완료", "✓ Done") : `${score.toFixed(1)} / ${ACADEMY_PASS_SCORE}`}
        </span>
      </div>

      {!r.done && (
        <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.45, color: BRAND.muted }}>
          {L(`${ACADEMY_PASS_SCORE} оноо хүрвэл хичээл дуусна.`, `${ACADEMY_PASS_SCORE}점이면 수업 완료.`, `Score ${ACADEMY_PASS_SCORE} to finish this lesson.`)}
        </p>
      )}

      {!r.done ? (
        <button type="button" data-testid="academy-again" onClick={again} style={rowBtn(acc)}>
          <span>{L("Дахин хийх", "다시 하기", "Do it again")}</span><span aria-hidden="true">→</span>
        </button>
      ) : nextLesson ? (
        <button type="button" data-testid="academy-next-lesson" onClick={() => router.push(`/${locale}/train?academyLesson=${nextLesson.id}`)} style={rowBtn(nextLesson.accentColor || acc)}>
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {L("Дараагийн хичээл", "다음 수업", "Next lesson")}: {nextLesson.emoji} {tx(nextLesson.title, locale)}
          </span>
          <span aria-hidden="true">→</span>
        </button>
      ) : (
        <p style={{ margin: "10px 0 0", fontSize: 14, color: BRAND.green }}>{L("Бүх хичээл хийгдлээ.", "모든 수업을 마쳤어요.", "All lessons done.")}</p>
      )}
    </section>
  );
}

const rowBtn = (color) => ({
  marginTop: 12, width: "100%", minHeight: 48, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
  borderRadius: 12, background: `${color}1a`, border: `1px solid ${color}45`, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
});
