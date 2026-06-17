"use client";

import { GOLD, whiteAlpha } from "@/lib/tokens";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";

const DNA_NEXT_STEPS = {
  pressure: {
    en: ["Study Mike Tyson's inside range entry drill", "Challenge an outboxer archetype fighter", "Train 5 sessions focusing on forward pressure"],
    mn: ["Майк Тайсоны дотоод муж оролтын дасгал үз", "Аутбоксер архетипийн тулаанчид тулаан дуудах", "Урагшлах даралтад анхаарлаа төвлөрүүлж 5 дасгал хий"],
    ko: ["마이크 타이슨의 인사이드 레인지 진입 드릴 학습", "아웃복서 아키타입 파이터에게 도전", "앞으로 밀어붙이는 압박에 집중하여 5세션 훈련"],
  },
  outboxer: {
    en: ["Study Bivol's range discipline drill", "Challenge a pressure archetype fighter", "Train 5 sessions maintaining optimal distance"],
    mn: ["Биволын зайны дасгал үз", "Даралтын архетипийн тулаанчид тулаан дуудах", "Оновчтой зайг хадгалах 5 дасгал хий"],
    ko: ["비볼의 거리 훈련 드릴 학습", "프레셔 아키타입 파이터에게 도전", "최적 거리 유지에 집중하여 5세션 훈련"],
  },
  counter: {
    en: ["Study Mayweather's Philly Shell defense", "Challenge an explosive archetype fighter", "Train 5 sessions focusing on timing reads"],
    mn: ["Мэйвэзерийн Фили Шелл хамгаалалт үз", "Тэсрэлтийн архетипийн тулаанчид тулаан дуудах", "Цагийн уншилтад анхаарлаа төвлөрүүлж 5 дасгал хий"],
    ko: ["메이웨더의 필리 쉘 방어 학습", "익스플로시브 아키타입 파이터에게 도전", "타이밍 읽기에 집중하여 5세션 훈련"],
  },
  explosive: {
    en: ["Study Inoue's body-head switching drill", "Challenge a technician archetype fighter", "Train 5 sessions on combination explosiveness"],
    mn: ["Иноуэгийн бие-толгойн солих дасгал үз", "Техникч архетипийн тулаанчид тулаан дуудах", "Комбинациудын тэсрэлтэнд анхаарлаа төвлөрүүлж 5 дасгал хий"],
    ko: ["이노우에의 바디-헤드 스위칭 드릴 학습", "테크니션 아키타입 파이터에게 도전", "콤비네이션 폭발력에 집중하여 5세션 훈련"],
  },
  technician: {
    en: ["Study Lomachenko's outside foot placement drill", "Challenge a counter archetype fighter", "Train 5 sessions focusing on precision mechanics"],
    mn: ["Ломаченкогийн гадна хөлийн байршлын дасгал үз", "Контр архетипийн тулаанчид тулаан дуудах", "Нарийвчлалын механикт анхаарлаа төвлөрүүлж 5 дасгал хий"],
    ko: ["로마첸코의 외발 포지셔닝 드릴 학습", "카운터 아키타입 파이터에게 도전", "정밀 메카닉에 집중하여 5세션 훈련"],
  },
};

const NEXT_STEPS_L = {
  en: { header: "What to do next" },
  mn: { header: "Дараагийн алхам" },
  ko: { header: "다음 단계" },
};

export default function DNANextStepsCard({ dna, locale }) {
  if (dna.building || !dna.archetypeKey) return null;
  const archKey = dna.archetypeKey;
  const steps = DNA_NEXT_STEPS[archKey];
  if (!steps) return null;
  const stepList = steps[locale] || steps.en;
  const acc = ARCH_TRAINING_COLORS[archKey] || GOLD;
  const L = NEXT_STEPS_L[locale] || NEXT_STEPS_L.en;

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: `1px solid ${acc}30`,
      background: `linear-gradient(135deg, ${acc}08 0%, rgba(0,0,0,0) 60%)`,
      marginBottom: 8,
    }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${acc}, ${acc}44, transparent)` }} />
      <div style={{ padding: "13px 16px 14px" }}>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 10 }}>
          {L.header}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {stepList.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: `${acc}18`, border: `1px solid ${acc}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 900, color: acc,
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.72)", lineHeight: 1.45, paddingTop: 3 }}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
