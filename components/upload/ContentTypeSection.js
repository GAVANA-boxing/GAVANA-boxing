"use client";

import { GOLD, RED, redAlpha, goldAlpha } from "@/lib/tokens";
import S from "@/components/upload/uploadStyles";

const CONTENT_TYPES = [
  { id: "training",    emoji: "🥊", labelKey: "ctFilterTraining",    color: "#F87171", border: redAlpha(0.5) },
  { id: "lifestyle",   emoji: "🎬", labelKey: "ctFilterLifestyle",   color: "#60A5FA", border: "rgba(96,165,250,0.45)" },
  { id: "educational", emoji: "📚", labelKey: "ctFilterEducational", color: GOLD,      border: goldAlpha(0.5) },
];

/**
 * Section header + type-tab row for choosing content type.
 *
 * Props
 * ─────
 * locale      string  — "mn" | "ko" | "en"
 * t           fn      — translate(key) → string
 * contentType string  — currently selected id
 * setContentType fn
 */
export default function ContentTypeSection({ locale, t, contentType, setContentType }) {
  return (
    <div className="stagger-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={S.sectionBlock}>
        <p style={S.sectionKicker}>
          {locale === "mn" ? "Контентын төрөл" : locale === "ko" ? "콘텐츠 유형" : "Content Type"}
        </p>
        <h2 style={S.sectionTitle}>
          {locale === "mn" ? "Юу нийтлэх вэ?" : locale === "ko" ? "무엇을 올리나요?" : "What are you posting?"}
        </h2>
      </div>

      <div style={S.typeTabs}>
        {CONTENT_TYPES.map(({ id, emoji, labelKey, color, border }) => {
          const label = t(labelKey);
          const active = contentType === id;
          return (
            <button
              key={id}
              onClick={() => setContentType(id)}
              style={{
                ...S.typeTab,
                ...(active
                  ? {
                      color,
                      border: `1px solid ${border}`,
                      background: `${color}18`,
                      boxShadow: `0 0 16px ${color}22`,
                    }
                  : {}),
              }}
            >
              <span style={S.typeTabEmoji}>{emoji}</span>
              <span style={S.typeTabLabel}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
