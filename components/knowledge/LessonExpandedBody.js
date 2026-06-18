"use client";

import { GOLD, RADIUS, goldAlpha } from "@/lib/tokens";
import { getLocal } from "@/lib/i18n";
import DiagramPlaceholder from "@/components/visual/DiagramPlaceholder";
import LessonDrillSection from "@/components/knowledge/LessonDrillSection";
import LessonSubHeader from "@/components/knowledge/LessonSubHeader";
import LessonCollapsible from "@/components/knowledge/LessonCollapsible";

const BODY_L = {
  en: {
    bodyMechanics: "Body Mechanics", whatFeel: "What You Should Feel",
    cues: "Key Cues", mistake: "Common Mistake",
    fighterEx: "Fighter Example", animalEx: "Animal Analogy",
    scoring: "How GAVANA Scores This", coachCue: "Coach Cue",
    fighter: "Study More",
  },
  mn: {
    bodyMechanics: "Биеийн механик", whatFeel: "Мэдрэмж",
    cues: "Гол зааварчилгаа", mistake: "Нийтлэг алдаа",
    fighterEx: "Тулаанчийн жишээ", animalEx: "Амьтны зүйр",
    scoring: "GAVANA хэрхэн оноолох вэ", coachCue: "Коучийн заавар",
    fighter: "Дэлгэрэнгүй",
  },
  ko: {
    bodyMechanics: "신체 역학", whatFeel: "느껴야 할 것",
    cues: "핵심 포인트", mistake: "일반적인 실수",
    fighterEx: "파이터 예시", animalEx: "동물 유추",
    scoring: "GAVANA 채점 방식", coachCue: "코치 큐",
    fighter: "더 공부하기",
  },
};

/**
 * Props:
 *   lesson          – lesson data object
 *   locale          – "en" | "mn" | "ko"
 *   acc             – lesson accent color string
 *   onStudyFighter  – optional callback (fighterId) => void
 *   router          – Next.js router instance
 */
export default function LessonExpandedBody({ lesson, locale, acc, onStudyFighter, router }) {
  const L = BODY_L[locale] || BODY_L.en;

  return (
    <div style={{ padding: "0 14px 14px" }}>

      {/* Hero diagram */}
      <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
        <DiagramPlaceholder type={lesson.diagramType} accent={acc} width="100%" height={90} />
      </div>

      {/* Concept */}
      {(lesson.concept || lesson.explanation) && (
        <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.65 }}>
          {getLocal(lesson.concept || lesson.explanation, locale)}
        </p>
      )}

      {/* Body Mechanics */}
      {lesson.bodyMechanics?.length > 0 && (
        <LessonCollapsible label={L.bodyMechanics} acc={acc} defaultOpen={true}>
          <div style={{ marginBottom: 10 }}>
            {lesson.bodyMechanics.map((point, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 7 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: `${acc}18`, border: `1px solid ${acc}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 900, color: acc, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, paddingTop: 1 }}>{getLocal(point, locale)}</span>
              </div>
            ))}
          </div>
        </LessonCollapsible>
      )}

      {/* What You Should Feel */}
      {lesson.whatYouShouldFeel?.length > 0 && (
        <LessonCollapsible label={L.whatFeel} acc={goldAlpha(0.6)} defaultOpen={false}>
          <div style={{
            padding: "10px 12px", borderRadius: 9, marginBottom: 10,
            background: goldAlpha(0.04), border: `1px solid ${goldAlpha(0.15)}`,
            borderLeft: `2.5px solid ${goldAlpha(0.45)}`,
          }}>
            {lesson.whatYouShouldFeel.map((cue, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: i < lesson.whatYouShouldFeel.length - 1 ? 6 : 0 }}>
                <span style={{ fontSize: 9, color: GOLD, flexShrink: 0, marginTop: 2 }}>◦</span>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, fontStyle: "italic" }}>{getLocal(cue, locale)}</span>
              </div>
            ))}
          </div>
        </LessonCollapsible>
      )}

      {/* Key Cues */}
      {lesson.keyCues?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <LessonSubHeader label={L.cues} acc={acc} />
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
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.5, paddingTop: 1 }}>{getLocal(cue, locale)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Common Mistake */}
      {lesson.commonMistake && (
        <LessonCollapsible label={`⚠️ ${L.mistake}`} acc="#F87171" defaultOpen={false}>
          <div style={{
            padding: "10px 12px", borderRadius: 9, marginBottom: 10,
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
            borderLeft: "2.5px solid rgba(239,68,68,0.6)",
          }}>
            <p style={{ margin: 0, fontSize: 12, color: "#fca5a5", lineHeight: 1.5 }}>{getLocal(lesson.commonMistake, locale)}</p>
          </div>
        </LessonCollapsible>
      )}

      {/* Drill Progression */}
      <LessonDrillSection lesson={lesson} locale={locale} L={L} />

      {/* Fighter Example */}
      {lesson.fighterExample && (
        <div style={{ marginBottom: 14 }}>
          <LessonSubHeader label={L.fighterEx} acc={lesson.fighterExample.accent} />
          <div style={{
            padding: "10px 12px", borderRadius: 9,
            background: `${lesson.fighterExample.accent}08`,
            border: `1px solid ${lesson.fighterExample.accent}22`,
          }}>
            <div style={{ fontSize: 9.5, fontWeight: 900, color: lesson.fighterExample.accent, marginBottom: 5 }}>
              {lesson.fighterExample.name}
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>
              {getLocal(lesson.fighterExample.observation, locale)}
            </p>
          </div>
        </div>
      )}

      {/* Animal Analogy */}
      {lesson.animalAnalogy && (
        <div style={{ marginBottom: 14 }}>
          <LessonSubHeader label={L.animalEx} acc="rgba(255,255,255,0.35)" />
          <div style={{
            padding: "9px 12px", borderRadius: 9,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{lesson.animalAnalogy.emoji}</span>
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.45)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>
                {lesson.animalAnalogy.animal}
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
                {getLocal(lesson.animalAnalogy.description, locale)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* How GAVANA Scores This */}
      {lesson.scoringMetrics?.length > 0 && (
        <LessonCollapsible label={L.scoring} acc="rgba(255,255,255,0.28)" defaultOpen={false}>
          <div style={{ marginBottom: 10 }}>
            {lesson.scoringMetrics.map((m, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                padding: "7px 10px", marginBottom: 5, borderRadius: 7,
                background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: acc, flexShrink: 0, marginTop: 6 }} />
                <div>
                  <div style={{ fontSize: 8.5, fontWeight: 900, color: acc, letterSpacing: 0.8, marginBottom: 2 }}>
                    {m.metric}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
                    {getLocal(m.description, locale)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </LessonCollapsible>
      )}

      {/* Coach Cue */}
      {(lesson.coachCue || lesson.coachTip) && (
        <LessonCollapsible label={`💡 ${L.coachCue}`} acc={goldAlpha(0.7)} defaultOpen={false}>
          <div style={{
            padding: "9px 12px", borderRadius: 9, marginBottom: 10,
            background: goldAlpha(0.04), border: `1px solid ${goldAlpha(0.18)}`,
            borderLeft: `2.5px solid ${goldAlpha(0.55)}`,
          }}>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, fontStyle: "italic" }}>
              &ldquo;{getLocal(lesson.coachCue || lesson.coachTip, locale)}&rdquo;
            </p>
          </div>
        </LessonCollapsible>
      )}

      {/* Train + Ask Coach CTAs */}
      <div style={{ display: "flex", gap: 8, marginBottom: onStudyFighter ? 10 : 0 }}>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/train?academyLesson=${lesson.id}`)}
          style={{
            flex: 1, padding: "10px 14px",
            background: `${acc}14`, border: `1px solid ${acc}30`,
            borderRadius: RADIUS.md,
            color: acc, fontSize: 10, fontWeight: 900,
            letterSpacing: 1.5, textTransform: "uppercase",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          {locale === "mn" ? "Дасгалдах" : "Train This"}
        </button>
        <button
          type="button"
          onClick={() => {
            const q = locale === "mn"
              ? `Би "${getLocal(lesson.title, locale)}" хичээлийг судалж байна. Яаж сайжруулах вэ?`
              : `I'm studying "${getLocal(lesson.title, locale)}" from GAVANA Academy. How do I improve this technique?`;
            router.push(`/${locale}/coach/chat?q=${encodeURIComponent(q)}`);
          }}
          style={{
            flex: 1, padding: "10px 14px",
            background: goldAlpha(0.09), border: `1px solid ${goldAlpha(0.22)}`,
            borderRadius: RADIUS.md,
            color: GOLD, fontSize: 10, fontWeight: 900,
            letterSpacing: 1.5, textTransform: "uppercase",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          }}
        >
          💬 {locale === "mn" ? "Асуух" : "Ask Coach"}
        </button>
      </div>

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
  );
}
