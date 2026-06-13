"use client";

import { useState } from "react";
import { GOLD, RADIUS, goldAlpha } from "@/lib/tokens";
import DiagramPlaceholder from "@/components/visual/DiagramPlaceholder";
import { getLocal } from "@/lib/i18n";

const DIFF_COLOR = { beginner: "#10B981", intermediate: "#F59E0B", advanced: "#F87171" };
const LEVEL_COLOR = { beginner: "#10B981", intermediate: "#F59E0B", advanced: "#F87171" };
const LEVEL_EMOJI = { beginner: "🟢", intermediate: "🟡", advanced: "🔴" };

const LABEL = {
  en: {
    cues: "Key Cues", mistake: "Common Mistake", drill: "Drill", tip: "Coach Tip",
    fighter: "Study More", expand: "Show Lesson", collapse: "Hide",
    bodyMechanics: "Body Mechanics", whatFeel: "What You Should Feel",
    drillProg: "Drill Progression", fighterEx: "Fighter Example",
    animalEx: "Animal Analogy", scoring: "How GAVANA Scores This",
    coachCue: "Coach Cue", concept: "The Concept",
    beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced",
  },
  mn: {
    cues: "Гол зааварчилгаа", mistake: "Нийтлэг алдаа", drill: "Дасгал",
    tip: "Коучийн зөвлөгөө", fighter: "Дэлгэрэнгүй", expand: "Хичээл харах", collapse: "Хаах",
    bodyMechanics: "Биеийн механик", whatFeel: "Мэдрэмж",
    drillProg: "Дасгалын шат", fighterEx: "Тулаанчийн жишээ",
    animalEx: "Амьтны зүйр", scoring: "GAVANA хэрхэн оноолох вэ",
    coachCue: "Коучийн заавар", concept: "Үндсэн ойлголт",
    beginner: "Анхан", intermediate: "Дунд", advanced: "Ахисан",
  },
  ko: {
    cues: "핵심 포인트", mistake: "일반적인 실수", drill: "드릴",
    tip: "코치 팁", fighter: "더 공부하기", expand: "레슨 보기", collapse: "닫기",
    bodyMechanics: "신체 역학", whatFeel: "느껴야 할 것",
    drillProg: "드릴 단계", fighterEx: "파이터 예시",
    animalEx: "동물 유추", scoring: "GAVANA 채점 방식",
    coachCue: "코치 큐", concept: "개념",
    beginner: "입문", intermediate: "중급", advanced: "고급",
  },
};

// ── Small inline section header ───────────────────────────────────────────────
function SubHeader({ label, acc, asSpan = false }) {
  const style = { fontSize: 7.5, fontWeight: 900, letterSpacing: 1.5, color: acc || "rgba(255,255,255,0.32)", textTransform: "uppercase", marginBottom: 8 };
  return asSpan
    ? <span style={{ ...style, display: "block" }}>{label}</span>
    : <div style={style}>{label}</div>;
}

// ── Collapsible wrapper ───────────────────────────────────────────────────────
function Collapsible({ label, acc, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 14 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", background: "none", border: "none", padding: "0 0 6px", cursor: "pointer",
        }}
      >
        <SubHeader label={label} acc={acc} asSpan />
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke={acc || "rgba(255,255,255,0.3)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms", flexShrink: 0, marginBottom: 8 }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && children}
    </div>
  );
}

export default function AcademyLessonCard({ lesson, locale = "en", lessonStatus = "not_started", bestScore, onStudyFighter, router }) {
  const [open, setOpen] = useState(false);
  const [activeDrillLevel, setActiveDrillLevel] = useState("beginner");
  const L = LABEL[locale] || LABEL.en;
  const acc = lesson.accentColor;
  const diffColor = DIFF_COLOR[lesson.difficulty] || GOLD;

  const activeDrill = lesson.drillProgression?.find(d => d.level === activeDrillLevel) || lesson.drillProgression?.[0];

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
            <Collapsible label={L.bodyMechanics} acc={acc} defaultOpen={true}>
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
            </Collapsible>
          )}

          {/* What You Should Feel */}
          {lesson.whatYouShouldFeel?.length > 0 && (
            <Collapsible label={L.whatFeel} acc={goldAlpha(0.6)} defaultOpen={false}>
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
            </Collapsible>
          )}

          {/* Key Cues */}
          {lesson.keyCues?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <SubHeader label={L.cues} acc={acc} />
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

          {/* Common Mistake — collapsed by default to reduce scroll fatigue */}
          {lesson.commonMistake && (
            <Collapsible label={`⚠️ ${L.mistake}`} acc="#F87171" defaultOpen={false}>
              <div style={{
                padding: "10px 12px", borderRadius: 9, marginBottom: 10,
                background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
                borderLeft: "2.5px solid rgba(239,68,68,0.6)",
              }}>
                <p style={{ margin: 0, fontSize: 12, color: "#fca5a5", lineHeight: 1.5 }}>{getLocal(lesson.commonMistake, locale)}</p>
              </div>
            </Collapsible>
          )}

          {/* Drill Progression */}
          {lesson.drillProgression?.length > 0 ? (
            <div style={{ marginBottom: 14 }}>
              <SubHeader label={L.drillProg} acc={GOLD} />
              {/* Level selector */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {lesson.drillProgression.map(d => {
                  const isActive = activeDrillLevel === d.level;
                  const lc = LEVEL_COLOR[d.level] || GOLD;
                  return (
                    <button
                      key={d.level}
                      type="button"
                      onClick={() => setActiveDrillLevel(d.level)}
                      style={{
                        flex: 1, padding: "6px 8px", borderRadius: 8,
                        background: isActive ? `${lc}18` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isActive ? lc + "45" : "rgba(255,255,255,0.08)"}`,
                        color: isActive ? lc : "rgba(255,255,255,0.35)",
                        fontSize: 8.5, fontWeight: 900, cursor: "pointer",
                        transition: "all 0.15s", textTransform: "uppercase", letterSpacing: 0.5,
                      }}
                    >
                      {LEVEL_EMOJI[d.level]} {L[d.level] || d.level}
                    </button>
                  );
                })}
              </div>
              {/* Active drill content */}
              {activeDrill && (
                <div style={{
                  padding: "10px 12px", borderRadius: 9,
                  background: `${goldAlpha(0.06)}`, border: `1px solid ${goldAlpha(0.18)}`,
                  borderLeft: "2.5px solid rgba(245,196,81,0.5)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 7.5, fontWeight: 900, color: GOLD, letterSpacing: 1.2, textTransform: "uppercase" }}>
                      🎯 {getLocal(activeDrill.title, locale)}
                    </div>
                    {activeDrill.duration && (
                      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
                        {activeDrill.duration}
                      </span>
                    )}
                  </div>
                  {activeDrill.steps.map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: i < activeDrill.steps.length - 1 ? 6 : 0 }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: 5,
                        background: `${goldAlpha(0.14)}`, border: `1px solid ${goldAlpha(0.28)}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 900, color: GOLD, flexShrink: 0,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, paddingTop: 1 }}>{getLocal(step, locale)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : lesson.drill && (
            /* Fallback: simple drill for lessons without drillProgression */
            <div style={{
              padding: "10px 12px", borderRadius: 9, marginBottom: 14,
              background: `${goldAlpha(0.06)}`, border: `1px solid ${goldAlpha(0.18)}`,
              borderLeft: "2.5px solid rgba(245,196,81,0.5)",
            }}>
              <div style={{ fontSize: 7.5, fontWeight: 900, color: GOLD, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
                🎯 {L.drill} · {getLocal(lesson.drill.title, locale)}
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
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, paddingTop: 1 }}>{getLocal(step, locale)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Fighter Example */}
          {lesson.fighterExample && (
            <div style={{ marginBottom: 14 }}>
              <SubHeader label={L.fighterEx} acc={lesson.fighterExample.accent} />
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
              <SubHeader label={L.animalEx} acc="rgba(255,255,255,0.35)" />
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
            <Collapsible label={L.scoring} acc="rgba(255,255,255,0.28)" defaultOpen={false}>
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
            </Collapsible>
          )}

          {/* Coach Cue — collapsed by default to reduce scroll fatigue */}
          {(lesson.coachCue || lesson.coachTip) && (
            <Collapsible label={`💡 ${L.coachCue}`} acc={goldAlpha(0.7)} defaultOpen={false}>
              <div style={{
                padding: "9px 12px", borderRadius: 9, marginBottom: 10,
                background: goldAlpha(0.04), border: `1px solid ${goldAlpha(0.18)}`,
                borderLeft: `2.5px solid ${goldAlpha(0.55)}`,
              }}>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, fontStyle: "italic" }}>
                  &ldquo;{getLocal(lesson.coachCue || lesson.coachTip, locale)}&rdquo;
                </p>
              </div>
            </Collapsible>
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
      )}
    </div>
  );
}
