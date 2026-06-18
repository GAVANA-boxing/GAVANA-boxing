"use client";

import FighterPortrait from "@/components/FighterPortrait";
import { GOLD } from "@/lib/tokens";

export default function RecommendedCard({ fighter, connection, onClick, archetypeBased, dnaMatch, studyFocus, locale }) {
  const acc = fighter.accent;
  const eyebrow = dnaMatch
    ? (locale === "mn" ? "ДНХ тохирол" : locale === "ko" ? "DNA 매칭" : "DNA Match")
    : archetypeBased
      ? (locale === "mn" ? `${fighter.name} шиг дасга` : locale === "ko" ? `${fighter.name}처럼 훈련` : `Train Like ${fighter.name}`)
      : `${connection?.primaryFocus} ${connection?.primaryValue?.toFixed(1)} →`;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 0,
        width: "100%", textAlign: "left", cursor: "pointer", padding: 0,
        background: `linear-gradient(90deg, ${acc}10 0%, rgba(0,0,0,0) 100%)`,
        border: `1px solid ${acc}35`,
        borderLeft: `3px solid ${acc}`,
        borderRadius: 14, overflow: "hidden",
      }}
    >
      <div style={{ width: 70, height: 80, flexShrink: 0, overflow: "hidden" }}>
        <FighterPortrait fighterId={fighter.id} fighter={fighter} height={80} flagSize={0} showName={false} showLabel={false} />
      </div>
      <div style={{ flex: 1, padding: "10px 12px" }}>
        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: dnaMatch ? GOLD : acc, textTransform: "uppercase", marginBottom: 3 }}>
          {eyebrow}
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 4 }}>
          {fighter.name}
        </div>
        {dnaMatch && studyFocus ? (
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.48)", lineHeight: 1.4 }}>
            📖 {studyFocus}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.4 }}>
            {fighter.style}
          </div>
        )}
      </div>
      <div style={{ padding: "0 14px 0 0", color: "rgba(255,255,255,0.2)", fontSize: 18 }}>›</div>
    </button>
  );
}
