"use client";

import { GOLD } from "@/lib/tokens";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";

const COPY = {
  heading: { mn: "ӨНӨӨДРИЙН DNA ФОКУС", ko: "오늘의 DNA 포커스", en: "TODAY'S DNA FOCUS" },
  cta:     { mn: "Одоо дасгал хий →",   ko: "지금 훈련하기 →",  en: "Train Now →" },
};

export default function DNADailyFocus({ locale, mission, userArchetype, wrappedHandleStart }) {
  const archColor = ARCH_TRAINING_COLORS[userArchetype] || GOLD;

  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${archColor}30`, background: `${archColor}08` }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${archColor}88, transparent)` }} />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, textTransform: "uppercase", color: archColor, marginBottom: 3 }}>
              {COPY.heading[locale] || COPY.heading.en}
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
              {mission[locale] || mission.en}
            </div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: `${archColor}18`, border: `1px solid ${archColor}35`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>
            🎯
          </div>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, fontWeight: 600, marginBottom: 10 }}>
          {mission.hint[locale] || mission.hint.en}
        </div>
        <button
          type="button"
          onClick={wrappedHandleStart}
          style={{ width: "100%", padding: "9px 0", borderRadius: 10, background: `${archColor}20`, border: `1px solid ${archColor}45`, color: archColor, fontSize: 12, fontWeight: 900, cursor: "pointer" }}
        >
          {COPY.cta[locale] || COPY.cta.en}
        </button>
      </div>
    </div>
  );
}
