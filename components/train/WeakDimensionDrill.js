"use client";

import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";

const WEAK_DIMS = {
  pressure:   { dim: "outboxer",   en: "Footwork & Distance Control",      mn: "Хөлийн ажил & Зай хянах",                ko: "풋워크 & 거리 조절" },
  outboxer:   { dim: "pressure",   en: "Close-Range Power Shots",          mn: "Ойрын зайн хүчтэй цохилт",               ko: "근거리 파워 샷" },
  counter:    { dim: "explosive",  en: "Explosive First-Strike Speed",     mn: "Тэсрэлтийн анхны цохилтын хурд",         ko: "폭발적인 선제 속도" },
  explosive:  { dim: "technician", en: "Technical Precision & Economy",    mn: "Техникийн нарийвчлал",                   ko: "기술적 정밀도" },
  technician: { dim: "counter",    en: "Counter-Punching Timing",          mn: "Контр цохилтын цаг",                     ko: "카운터 타이밍" },
};

const DRILL_HINT = {
  pressure:   { en: "Work the jab-cross at long range. Reset after each combo.",            mn: "Урт зайнаас жааб-кросс хий. Комбо болгоны дараа буц.",          ko: "장거리에서 잽-크로스. 콤보 후 리셋." },
  outboxer:   { en: "Step in with a 3-punch burst. Stay tight, elbows in.",                mn: "3 цохилтоор ор. Тогтуу бай, тохойгоо дотогш.",                 ko: "3펀치 버스트로 진입. 팔꿈치 안으로." },
  counter:    { en: "Explode first — don't wait for the bait. Fire in 0.5 sec.",           mn: "Эхлээд тэсрэ — хүлээхгүй. 0.5 секундад цох.",                  ko: "먼저 터뜨려라 — 기다리지 마라. 0.5초 안에." },
  explosive:  { en: "Slow your combinations. Every punch has a purpose.",                  mn: "Комбиноо удаашруул. Цохилт бүр зорилготой.",                   ko: "콤비를 천천히. 모든 펀치에 목적이." },
  technician: { en: "Read the pattern, then fire back immediately. No hesitation.",        mn: "Хэв маягийг уншиж, тэр даруй буцаж цох. Эргэлзэхгүй.",         ko: "패턴을 읽고 즉시 반격. 망설임 없이." },
};

const COPY = {
  heading: { mn: "СУЛ ТАЛ ДАСГАЛ", ko: "약점 드릴", en: "WEAK DIMENSION DRILL" },
  cta:     { mn: "Одоо дасгал хий →", ko: "지금 훈련하기 →", en: "Train This Now →" },
};

export default function WeakDimensionDrill({ locale, userArchetype, wrappedHandleStart }) {
  const weak = WEAK_DIMS[userArchetype];
  if (!weak) return null;

  const weakColor = ARCH_TRAINING_COLORS[weak.dim] || "#60A5FA";
  const dimLabel  = weak[locale] || weak.en;
  const drillHint = DRILL_HINT[userArchetype]?.[locale] || DRILL_HINT[userArchetype]?.en || "";

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${weakColor}28`, background: `${weakColor}07`, padding: "12px 14px" }}>
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: weakColor, marginBottom: 6 }}>
        🎯 {COPY.heading[locale] || COPY.heading.en}
      </div>
      <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{dimLabel}</div>
      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, fontWeight: 600, marginBottom: 10 }}>{drillHint}</div>
      <button
        type="button"
        onClick={wrappedHandleStart}
        style={{ width: "100%", padding: "9px 0", borderRadius: 10, background: `${weakColor}18`, border: `1px solid ${weakColor}40`, color: weakColor, fontSize: 11, fontWeight: 900, cursor: "pointer" }}
      >
        {COPY.cta[locale] || COPY.cta.en}
      </button>
    </div>
  );
}
