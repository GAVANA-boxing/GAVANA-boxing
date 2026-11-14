"use client";

// "Your next Academy lesson" — one tap opens the lesson as a guided round. Used on the Train
// start screen (for a beginner) and on Home. The count is real: lessons marked done in
// users.academyProgress (hooks/useAcademyProgress), never derived from how many rounds exist.
import { ACADEMY_LESSONS } from "@/lib/academyLessons";
import { academySummary } from "@/lib/academyProgress";
import { loc, tx } from "@/lib/loc";
import { BRAND, card } from "@/components/ui/brand";

export default function AcademyNextCard({ lessonProgress, locale = "en", router, compact = false }) {
  const { total, done, next, nextIndex } = academySummary(ACADEMY_LESSONS, lessonProgress);
  if (!next) return null; // all lessons done — nothing to push
  const accent = next.accentColor || BRAND.gold;
  const L = (mn, ko, en) => loc(locale, mn, ko, en);

  return (
    <button
      type="button"
      data-testid="academy-next"
      onClick={() => router.push(`/${locale}/train?academyLesson=${next.id}`)}
      style={{
        ...card, width: "100%", display: "flex", alignItems: "center", gap: 12, minHeight: compact ? 64 : 76,
        padding: "12px 14px", cursor: "pointer", color: BRAND.text, fontFamily: "inherit", textAlign: "left",
        borderColor: `${accent}55`, background: `${accent}12`,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: compact ? 24 : 30, flexShrink: 0 }}>{next.emoji}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: BRAND.muted }}>
          {L("Академи", "아카데미", "Academy")} · {L(`${nextIndex + 1}-р хичээл`, `${nextIndex + 1}번째 수업`, `Lesson ${nextIndex + 1}`)}
        </span>
        <span style={{ display: "block", marginTop: 2, fontSize: 17, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tx(next.title, locale)}
        </span>
        {/* done / total as dots: progress at a glance, nothing to read */}
        <span aria-label={`${done}/${total}`} style={{ display: "flex", gap: 4, marginTop: 8 }}>
          {ACADEMY_LESSONS.map((l, i) => (
            <span key={l.id} style={{ width: 14, height: 4, borderRadius: 2, background: lessonProgress?.[l.id]?.completed ? BRAND.gold : i === nextIndex ? `${accent}aa` : "rgba(255,255,255,0.14)" }} />
          ))}
        </span>
      </span>
      <span aria-hidden="true" style={{ flexShrink: 0, fontSize: 20, fontWeight: 800, color: accent }}>→</span>
    </button>
  );
}
