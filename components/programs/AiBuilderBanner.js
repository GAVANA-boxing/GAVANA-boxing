"use client";

import { goldAlpha } from "@/lib/tokens";
import s from "@/components/programs/programsStyles";

const LABELS = {
  title:  { en: "AI WORKOUT BUILDER",        mn: "AI ДАСГАЛЫН БАЙГУУЛАГЧ",       ko: "AI 워크아웃 빌더" },
  cta:    { en: "Build your perfect session", mn: "Өөрийн тохирох дасгал хий",    ko: "나만의 완벽한 세션 만들기" },
};

/**
 * Props:
 *   locale   "en" | "mn" | "ko"
 *   onClick  () => void
 */
export default function AiBuilderBanner({ locale, onClick }) {
  const loc = locale || "en";
  return (
    <button type="button" style={s.aiBuilderBanner} onClick={onClick}>
      <span style={{ fontSize: 28 }}>🤖</span>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>
          {LABELS.title[loc] ?? LABELS.title.en}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
          {LABELS.cta[loc] ?? LABELS.cta.en}
        </div>
      </div>
      <span style={{ marginLeft: "auto", fontSize: 16, color: `${goldAlpha(0.7)}` }}>›</span>
    </button>
  );
}
