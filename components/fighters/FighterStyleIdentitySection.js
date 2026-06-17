"use client";

import { PILL_SVGS } from "@/components/fighters/FighterIcons";
import s from "@/components/fighters/fighterStyles";

// ─── Style identity pills grid ────────────────────────────────────────────────
// Props: styleIdentity (string[]), accent (color string)
export default function FighterStyleIdentitySection({ styleIdentity, accent }) {
  return (
    <div style={s.pillGrid}>
      {styleIdentity.map((item, i) => (
        <span
          key={i}
          className="fighter-style-pill"
          style={{
            ...s.stylePill,
            borderColor: accent + "35",
            boxShadow: `0 0 0 1px ${accent}10 inset`,
          }}
        >
          <span style={{ color: accent, display: "flex", alignItems: "center", lineHeight: 1 }}>
            {PILL_SVGS[i % PILL_SVGS.length]}
          </span>
          <span style={{ fontSize: 12, color: "#ddd", lineHeight: 1.4 }}>{item}</span>
        </span>
      ))}
    </div>
  );
}
