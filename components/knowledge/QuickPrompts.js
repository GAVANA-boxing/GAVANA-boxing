"use client";

import { GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import { translate } from "@/lib/i18n";

export default function QuickPrompts({ locale, onAsk, prompts }) {
  const t = (key) => translate(locale, key);

  return (
    <div style={{
      background: `linear-gradient(135deg, ${redAlpha(0.08)} 0%, ${goldAlpha(0.05)} 100%)`,
      border: `1px solid ${goldAlpha(0.12)}`,
      borderRadius: 14,
      padding: "14px 14px 12px",
    }}>
      <p style={{ margin: "0 0 10px", fontSize: 9, fontWeight: 900, letterSpacing: 2, color: GOLD, textTransform: "uppercase" }}>
        {locale === "mn" ? "Хурдан асуулт" : "Quick questions"}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {prompts.map((p) => (
          <button
            key={p.key}
            onClick={() => onAsk(t(p.key))}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 12px", borderRadius: 20,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            <span>{p.emoji}</span>
            {t(p.key)}
          </button>
        ))}
      </div>
    </div>
  );
}
