"use client";

import { GOLD, goldAlpha, whiteAlpha } from "@/lib/tokens";

const JOURNEY_L = {
  en: { title: "IDENTITY JOURNEY", complete: "complete" },
  mn: { title: "МӨН ЧАНАРЫН ЗАМ", complete: "дууссан" },
  ko: { title: "아이덴티티 여정", complete: "완료" },
};

export default function IdentityJourneyStrip({ sessions, dna, studiedIds, currentExperiment, locale }) {
  const L = JOURNEY_L[locale] || JOURNEY_L.en;
  const expDays = currentExperiment?.startDate?.seconds
    ? Math.floor((Date.now() / 1000 - currentExperiment.startDate.seconds) / 86400)
    : 0;

  const STEPS = [
    {
      emoji: "🥊",
      labels: { en: "First Session", mn: "Анхны тренинг", ko: "첫 훈련" },
      done: sessions.length >= 1,
    },
    {
      emoji: "🔬",
      labels: { en: "DNA Analysis", mn: "ДНХ шинжилгээ", ko: "DNA 분석" },
      done: sessions.length >= 3,
    },
    {
      emoji: "📚",
      labels: { en: "Study Fighter", mn: "Тулаанч судалсан", ko: "파이터 학습" },
      done: studiedIds.length >= 1,
    },
    {
      emoji: "🧬",
      labels: { en: "Archetype Locked", mn: "Archetype баталгаажсан", ko: "아키타입 확정" },
      done: !dna.building && !!dna.archetypeKey,
    },
    {
      emoji: "⚗️",
      labels: { en: "Experiment", mn: "Туршилт эхэлсэн", ko: "실험 시작" },
      done: currentExperiment != null,
    },
    {
      emoji: "📖",
      labels: { en: "Study 3 Fighters", mn: "3 тулаанч судалсан", ko: "3명 학습" },
      done: studiedIds.length >= 3,
    },
    {
      emoji: "🔄",
      labels: { en: "Evolution Revealed", mn: "Хувьсал илэрсэн", ko: "진화 공개" },
      done: currentExperiment != null && expDays >= 7,
    },
    {
      emoji: "⚔️",
      labels: { en: "Study 5 Fighters", mn: "5 тулаанч судалсан", ko: "5명 학습" },
      done: studiedIds.length >= 5,
    },
  ];

  const completedCount = STEPS.filter((s) => s.done).length;
  const pct = Math.round((completedCount / STEPS.length) * 100);
  const currentIdx = STEPS.findIndex((s) => !s.done);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Header + progress bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.25), textTransform: "uppercase" }}>
          {L.title}
        </span>
        <span style={{ fontSize: 9, fontWeight: 900, color: pct >= 100 ? "#34D399" : GOLD }}>
          {pct}% {L.complete}
        </span>
      </div>
      <div style={{ height: 2, borderRadius: 1, background: whiteAlpha(0.06), overflow: "hidden", marginBottom: 10 }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: pct >= 100 ? "#34D399" : `linear-gradient(90deg, ${GOLD}80, ${GOLD})`,
          transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
        }} />
      </div>

      {/* Steps — horizontal scroll */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
        {STEPS.map((step, i) => {
          const isCurrent = i === currentIdx;
          const label = step.labels[locale] || step.labels.en;
          return (
            <div key={i} style={{
              flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              padding: "8px 10px", borderRadius: 10, minWidth: 66,
              background: step.done ? "rgba(52,211,153,0.07)" : isCurrent ? goldAlpha(0.07) : whiteAlpha(0.025),
              border: step.done
                ? "1px solid rgba(52,211,153,0.22)"
                : isCurrent
                ? `1px solid ${goldAlpha(0.35)}`
                : `1px solid ${whiteAlpha(0.05)}`,
            }}>
              <span style={{ fontSize: 17, lineHeight: 1, filter: step.done || isCurrent ? "none" : "grayscale(1) opacity(0.28)" }}>
                {step.done ? "✅" : step.emoji}
              </span>
              <span style={{
                fontSize: 7.5, fontWeight: 800, textAlign: "center", lineHeight: 1.35,
                color: step.done ? "#34D399" : isCurrent ? GOLD : whiteAlpha(0.22),
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
