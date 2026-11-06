"use client";

import { BRAND, glassCard } from "@/components/ui/brand";

const SP_LABELS = {
  en: { kicker: "AI SPARRING", title: "Spar Your Opposite", sub: "Train against your counter-style", btn: "Get Counter-Combos →" },
  mn: { kicker: "AI СПАРРИНГ", title: "Эсрэг архетиптэй спарринг", sub: "Эсрэг хэв маяг дээр бэлтгэл хий", btn: "Эсрэг комбо авах →" },
  ko: { kicker: "AI 스파링", title: "반대 스타일과 스파링", sub: "카운터 스타일로 훈련하기", btn: "카운터 콤보 받기 →" },
};

const OPPONENT_CYCLE = ["pressure", "outboxer", "counter", "explosive", "technician"];

const OPPONENT_COLORS = {
  pressure: "#EF4444",
  outboxer: "#3B82F6",
  counter: "#8B5CF6",
  explosive: "#F59E0B",
  technician: "#10B981",
};

const OPPONENT_LABELS = {
  pressure:   { en: "Pressure Fighter", mn: "Дарамтын тулаанч", ko: "프레셔 파이터" },
  outboxer:   { en: "Outboxer", mn: "Аутбоксер", ko: "아웃복서" },
  counter:    { en: "Counter Fighter", mn: "Контр тулаанч", ko: "카운터 파이터" },
  explosive:  { en: "Explosive Fighter", mn: "Тэсрэлтийн тулаанч", ko: "폭발적 파이터" },
  technician: { en: "Technician", mn: "Техникч", ko: "테크니션" },
};

export default function AISparringPartner({ userArchetype, locale, router }) {
  const opponent = OPPONENT_CYCLE[new Date().getDay() % 5];
  const oppColor = OPPONENT_COLORS[opponent];
  const oppLabel = OPPONENT_LABELS[opponent]?.[locale] || opponent;
  const SL = SP_LABELS[locale] || SP_LABELS.en;

  const sparQ = locale === "mn"
    ? `Намайг ${userArchetype ? (OPPONENT_LABELS[userArchetype]?.[locale] || userArchetype) : "тулаанч"} гэж үз. Би ${oppLabel}-тай тулаад байна. Ямар комбо болон контр хөдөлгөөн ашиглах вэ?`
    : locale === "ko"
    ? `저는 ${userArchetype ? (OPPONENT_LABELS[userArchetype]?.[locale] || userArchetype) : "파이터"}입니다. ${oppLabel}와 스파링 중입니다. 어떤 콤보와 카운터 동작을 사용해야 할까요?`
    : `I'm a ${userArchetype ? (OPPONENT_LABELS[userArchetype]?.en || userArchetype) : "fighter"}. I'm sparring against a ${oppLabel}. What combos and counter moves should I use?`;

  return (
    <button
      type="button"
      onClick={() => router.push(`/${locale}/coach/chat?q=${encodeURIComponent(sparQ)}`)}
      style={{ ...glassCard, display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "16px 18px", textAlign: "left", cursor: "pointer", fontFamily: "inherit", position: "relative", overflow: "hidden" }}
    >
      <span aria-hidden="true" style={{ position: "absolute", width: 140, height: 140, right: -40, top: -70, borderRadius: "50%", background: oppColor, opacity: 0.22, filter: "blur(40px)" }} />
      <span style={{ width: 44, height: 44, borderRadius: 15, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 20, background: `${oppColor}22`, position: "relative" }} aria-hidden="true">⚔️</span>
      <span style={{ flex: 1, minWidth: 0, position: "relative" }}>
        <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: oppColor }}>{SL.kicker}</span>
        <span style={{ display: "block", marginTop: 4, fontSize: 16, fontWeight: 700, color: "#fff" }}>{SL.title}</span>
        <span style={{ display: "block", marginTop: 3, fontSize: 13, color: BRAND.muted }}>VS <b style={{ color: oppColor, fontWeight: 600 }}>{oppLabel}</b> · {SL.sub}</span>
      </span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND.faint} strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ position: "relative", flexShrink: 0 }}><path d="M9 6l6 6-6 6" /></svg>
    </button>
  );
}
