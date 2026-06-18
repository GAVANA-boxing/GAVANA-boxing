"use client";

import { GOLD } from "@/lib/tokens";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";

const ARCH_LABELS = {
  pressure:   { en: "Pressure",  mn: "Дарамт",   ko: "프레셔" },
  outboxer:   { en: "Outboxer",  mn: "Аутбоксер", ko: "아웃복서" },
  counter:    { en: "Counter",   mn: "Контр",     ko: "카운터" },
  explosive:  { en: "Explosive", mn: "Тэсрэлт",   ko: "폭발적" },
  technician: { en: "Technician",mn: "Техникч",   ko: "테크니션" },
};

const COPY = {
  heading: { mn: "ЭНЭ 7 ХОНОГ", ko: "이번 주", en: "THIS WEEK" },
  best:     { mn: "Шилдэг",      ko: "최고",     en: "Best" },
  session:  { mn: "тренинг",     ko: "세션",     en: "session" },
};

export default function WeeklyDNADigest({ locale, weeklySessionCount, weeklyBestScore, userArchetype }) {
  const archLabel = userArchetype
    ? (ARCH_LABELS[userArchetype]?.[locale] || ARCH_LABELS[userArchetype]?.en || userArchetype)
    : null;
  const archColor = userArchetype ? (ARCH_TRAINING_COLORS[userArchetype] || GOLD) : null;
  const sessionWord = locale === "mn" ? COPY.session.mn : locale === "ko" ? COPY.session.ko : `${COPY.session.en}${weeklySessionCount !== 1 ? "s" : ""}`;

  return (
    <div style={{ borderRadius: 12, padding: "10px 14px", background: "rgba(245,196,81,0.05)", border: "1px solid rgba(245,196,81,0.15)", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>📊</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(245,196,81,0.7)", marginBottom: 2 }}>
          {COPY.heading[locale] || COPY.heading.en}
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.65)" }}>
          {weeklySessionCount} {sessionWord}
          {archLabel && archColor && (
            <span style={{ color: archColor }}> · {archLabel}</span>
          )}
          {weeklyBestScore != null && (
            <span style={{ color: "rgba(255,255,255,0.35)" }}>
              {" "}· {COPY.best[locale] || COPY.best.en} {weeklyBestScore.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
