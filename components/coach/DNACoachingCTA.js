"use client";

import { GOLD } from "@/lib/tokens";
import { BRAND, glassCard } from "@/components/ui/brand";

const ARCH_COLORS = {
  pressure: "#EF4444",
  outboxer: "#3B82F6",
  counter: "#8B5CF6",
  explosive: "#F59E0B",
  technician: "#10B981",
};

const ARCH_LABELS = {
  pressure:   { en: "Pressure Fighter", mn: "Дарамтын тулаанч", ko: "프레셔 파이터" },
  outboxer:   { en: "Outboxer", mn: "Аутбоксер", ko: "아웃복서" },
  counter:    { en: "Counter Fighter", mn: "Контр тулаанч", ko: "카운터 파이터" },
  explosive:  { en: "Explosive Fighter", mn: "Тэсрэлтийн тулаанч", ko: "폭발적 파이터" },
  technician: { en: "Technician", mn: "Техникч", ko: "테크니션" },
};

export default function DNACoachingCTA({ userArchetype, locale, router }) {
  if (!userArchetype) return null;

  const acc = ARCH_COLORS[userArchetype] || GOLD;
  const archLabel = ARCH_LABELS[userArchetype]?.[locale] || userArchetype;
  const dnaQ = locale === "mn"
    ? `Би ${archLabel} архетиптэй. Энэ хэв маягаа хөгжүүлэхийн тулд өнөөдөр юу хийх вэ?`
    : locale === "ko"
    ? `저는 ${archLabel} 아키타입입니다. 이 스타일을 발전시키기 위해 오늘 무엇을 해야 할까요?`
    : `I'm a ${archLabel}. What should I focus on today to develop this style?`;

  return (
    <button
      type="button"
      onClick={() => router.push(`/${locale}/coach/chat?q=${encodeURIComponent(dnaQ)}`)}
      style={{ ...glassCard, display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "16px 18px", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}
    >
      <span style={{ width: 44, height: 44, borderRadius: 15, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 20, background: `${acc}22` }} aria-hidden="true">🧬</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: acc }}>
          {locale === "mn" ? "Таны DNA дээр" : locale === "ko" ? "내 DNA 기반" : "Based on your DNA"}
        </span>
        <span style={{ display: "block", marginTop: 4, fontSize: 16, fontWeight: 700, color: "#fff" }}>
          {locale === "mn" ? `${archLabel} гэж хэрхэн бэлтгэх вэ?` : locale === "ko" ? `${archLabel}로 훈련하는 방법은?` : `How to train as a ${archLabel}?`}
        </span>
      </span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND.faint} strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M9 6l6 6-6 6" /></svg>
    </button>
  );
}
