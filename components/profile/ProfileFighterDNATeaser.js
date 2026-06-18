"use client";

import { GOLD } from "@/lib/tokens";

const DNA_STRINGS = {
  mn: {
    label: "Тулаанчийн ДНХ",
    hint: "Бэлтгэл хийж, мөн чанараа нээ →",
  },
  ko: {
    label: "파이터 DNA",
    hint: "훈련하여 정체성을 발견하세요 →",
  },
  en: {
    label: "Fighter DNA",
    hint: "Train to discover your fighter identity →",
  },
};

/**
 * @param {{
 *   locale: string,
 *   fighterDNA: object | null | undefined,
 *   onClick: () => void,
 * }} props
 */
export default function ProfileFighterDNATeaser({ locale, fighterDNA, onClick }) {
  const strings = DNA_STRINGS[locale] ?? DNA_STRINGS.en;
  const dnaHint = fighterDNA?.archetype ? fighterDNA.archetype : strings.hint;
  const dnaColor = fighterDNA?.archetype ? GOLD : "rgba(255,255,255,0.28)";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        margin: "0 0 4px",
        padding: "14px 16px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderLeft: fighterDNA?.archetype ? `3px solid ${GOLD}` : "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        cursor: "pointer",
        textAlign: "left",
        boxSizing: "border-box",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 8,
            fontWeight: 900,
            letterSpacing: 2,
            color: "rgba(255,255,255,0.25)",
            textTransform: "uppercase",
            marginBottom: 3,
          }}
        >
          {strings.label}
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: dnaColor, lineHeight: 1.3 }}>
          {dnaHint}
        </div>
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0 }}
      >
        <path
          d="M9 18l6-6-6-6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
