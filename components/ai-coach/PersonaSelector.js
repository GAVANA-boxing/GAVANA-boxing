"use client";

import { loc } from "@/lib/loc";
import styles from "@/components/aiCoachStyles";

export default function PersonaSelector({ personas, persona, locale, onSelect }) {
  return (
    <>
      <p style={styles.personaSectionLabel}>
        {locale === "mn" ? "ДАСГАЛЖУУЛАГЧАА СОНГОНО УУ" : locale === "ko" ? "코치를 선택하세요" : "CHOOSE YOUR COACH"}
      </p>
      <div style={styles.personaGrid}>
        {personas.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            style={{
              ...styles.personaCard,
              ...(persona === p.id ? {
                ...styles.personaCardActive,
                borderColor: p.color,
                background: `linear-gradient(145deg, ${p.color}20, rgba(11,11,12,0.98))`,
                boxShadow: `0 0 0 1px ${p.color}44, 0 8px 24px ${p.color}18`,
              } : {}),
            }}
          >
            <span style={{ ...styles.personaAvatar, background: `${p.color}1A`, color: p.color }}>
              {p.emoji}
            </span>
            <div style={styles.personaCardContent}>
              <span style={styles.personaCardName}>{p.name}</span>
              <span style={styles.personaCardTagline}>{p.tagline}</span>
              <div style={styles.personaCardTags}>
                {p.tags.map((tag) => (
                  <span key={tag} style={{ ...styles.personaCardTag, color: p.color, borderColor: `${p.color}40` }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            {persona === p.id && (
              <span style={{ ...styles.personaCheckBadge, background: p.color }}>✓</span>
            )}
          </button>
        ))}
      </div>
    </>
  );
}
