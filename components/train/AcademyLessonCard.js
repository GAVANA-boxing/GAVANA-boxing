"use client";

// After a round done with an Academy lesson: did it count for the lesson, and what is next.
// What "done" means per lesson is in lib/academyProgress.js — a punch lesson needs the pass
// score; a defence / footwork lesson is done by completing the round (the score doesn't measure
// that skill, so it is never called "passed"). A lesson finished earlier stays finished: the
// card reads the stored progress too, so it never contradicts Home or the Academy list.
//
// One action at most: the next lesson, once this one is done. "Again" is the result screen's own
// primary button — it is not repeated here.
import { ACADEMY_LESSONS } from "@/lib/academyLessons";
import { lessonRoundResult, academySummary, ACADEMY_PASS_SCORE } from "@/lib/academyProgress";
import { loc, tx } from "@/lib/loc";
import { BRAND } from "@/components/ui/brand";

export default function AcademyLessonCard({ academyLesson, result, punches = null, lessonProgress = null, onNext, locale, router }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const score = Number(result?.score) || 0;
  // The result modal only renders this card for a scored round; `punches` is passed when known.
  const r = lessonRoundResult(academyLesson.id, { score, punches: punches ?? 99 });
  const done = r.done || Boolean(lessonProgress?.[academyLesson.id]?.completed);
  const acc = academyLesson.accentColor || BRAND.gold;

  // The next lesson = the first one not done once this one counts as done (not simply "the one
  // after this in the list": lessons can be done in any order).
  const next = done
    ? academySummary(ACADEMY_LESSONS, { ...(lessonProgress || {}), [academyLesson.id]: { completed: true } }).next
    : null;
  // On the Train page the lesson is opened in place (onNext); elsewhere a normal navigation.
  const openNext = () => (onNext ? onNext(next) : router?.push(`/${locale}/train?academyLesson=${next.id}`));

  return (
    <section data-testid="academy-lesson-result" style={{ margin: "0 20px 8px", padding: 14, borderRadius: 16, background: `${acc}0d`, border: `1px solid ${acc}33` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span aria-hidden="true" style={{ fontSize: 22, flexShrink: 0 }}>{academyLesson.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: acc }}>{L("Академийн хичээл", "아카데미 수업", "Academy lesson")}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: BRAND.text, marginTop: 1, overflowWrap: "anywhere" }}>{tx(academyLesson.title, locale)}</div>
        </div>
        <span data-testid="academy-lesson-status" style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 999, fontSize: 13, fontWeight: 800, color: done ? BRAND.green : BRAND.gold, background: done ? "rgba(52,211,153,0.12)" : "rgba(245,196,81,0.12)", border: `1px solid ${done ? "rgba(52,211,153,0.4)" : "rgba(245,196,81,0.4)"}` }}>
          {done ? L("✓ Дууссан", "✓ 완료", "✓ Done") : `${score.toFixed(1)} / ${ACADEMY_PASS_SCORE}`}
        </span>
      </div>

      {!done ? (
        <p data-testid="academy-lesson-hint" style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.45, color: BRAND.muted }}>
          {L(`${ACADEMY_PASS_SCORE} оноонд хүрвэл хичээл дуусна.`, `${ACADEMY_PASS_SCORE}점이면 수업 완료.`, `Score ${ACADEMY_PASS_SCORE} to finish this lesson.`)}
        </p>
      ) : next ? (
        <button type="button" data-testid="academy-next-lesson" onClick={openNext} style={rowBtn(next.accentColor || acc)}>
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {L("Дараагийн хичээл", "다음 수업", "Next lesson")}: {next.emoji} {tx(next.title, locale)}
          </span>
          <span aria-hidden="true">→</span>
        </button>
      ) : (
        <p style={{ margin: "10px 0 0", fontSize: 14, color: BRAND.green }}>{L("Бүх хичээл дууссан.", "모든 수업을 마쳤어요.", "All lessons done.")}</p>
      )}
    </section>
  );
}

const rowBtn = (color) => ({
  marginTop: 12, width: "100%", minHeight: 48, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
  borderRadius: 12, background: `${color}1a`, border: `1px solid ${color}45`, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
});
