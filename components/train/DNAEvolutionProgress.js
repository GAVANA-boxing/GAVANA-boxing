"use client";

import { GOLD } from "@/lib/tokens";

const ARCH_COLORS = {
  pressure:   "#EF4444",
  outboxer:   "#3B82F6",
  counter:    "#8B5CF6",
  explosive:  "#F59E0B",
  technician: "#10B981",
};

const COPY = {
  heading:    { mn: "ДНХ ШИНЭЧЛЭЛТ",             ko: "DNA 업데이트",        en: "DNA EVOLUTION" },
  start:      { mn: "Бэлтгэл хийж ДНХ-аа шинэчил", ko: "훈련하여 DNA를 업데이트하세요", en: "Train to start your next DNA cycle" },
  countdown:  {
    mn: (n) => `${n} дасгал дараа ДНХ шинэчлэгдэнэ`,
    ko: (n) => `${n}세션 후 DNA 업데이트`,
    en: (n) => `${n} session${n !== 1 ? "s" : ""} until DNA update`,
  },
};

export default function DNAEvolutionProgress({ locale, userArchetype, totalSessionCount, router }) {
  const acc = ARCH_COLORS[userArchetype] || GOLD;
  const sessionsToNext = 5 - (totalSessionCount % 5);
  const cyclePct = ((totalSessionCount % 5) / 5) * 100;

  const bodyText = sessionsToNext === 5
    ? (COPY.start[locale] || COPY.start.en)
    : ((COPY.countdown[locale] || COPY.countdown.en)(sessionsToNext));

  return (
    <div
      onClick={() => router.push(`/${locale}/fighter-profile`)}
      style={{ borderRadius: 12, padding: "10px 14px", background: `${acc}06`, border: `1px solid ${acc}20`, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
    >
      <div style={{ flexShrink: 0 }}>
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
          <circle
            cx="16" cy="16" r="12" fill="none" stroke={acc} strokeWidth="2.5"
            strokeDasharray="75.4"
            strokeDashoffset={75.4 * (1 - cyclePct / 100)}
            strokeLinecap="round"
            transform="rotate(-90 16 16)"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.8, textTransform: "uppercase", color: acc, marginBottom: 2 }}>
          {COPY.heading[locale] || COPY.heading.en}
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
          {bodyText}
        </div>
      </div>
    </div>
  );
}
