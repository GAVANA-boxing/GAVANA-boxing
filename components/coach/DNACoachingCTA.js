"use client";

import { GOLD } from "@/lib/tokens";

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
    <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 14, background: `${acc}0c`, border: `1px solid ${acc}25` }}>
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 6 }}>
        🧬 {locale === "mn" ? "ТАНЫ ДНХ ДЭЭР ҮНДЭСЛЭН" : locale === "ko" ? "내 DNA 기반" : "BASED ON YOUR DNA"}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 10 }}>
        {locale === "mn" ? `${archLabel} гэж хэрхэн бэлтгэх вэ?` : locale === "ko" ? `${archLabel}로 훈련하는 방법은?` : `How to train as a ${archLabel}?`}
      </div>
      <button
        type="button"
        onClick={() => router.push(`/${locale}/coach/chat?q=${encodeURIComponent(dnaQ)}`)}
        style={{ padding: "8px 16px", borderRadius: 10, background: `${acc}18`, border: `1px solid ${acc}40`, color: acc, fontSize: 11, fontWeight: 900, cursor: "pointer" }}
      >
        {locale === "mn" ? "Асуух →" : locale === "ko" ? "질문하기 →" : "Ask Coach →"}
      </button>
    </div>
  );
}
