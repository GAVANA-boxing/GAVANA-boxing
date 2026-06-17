"use client";

// ─── "Train This Style" CTA button ───────────────────────────────────────────
// Props: fighter, locale, firstLessonSlug (string), onPress (function)
export default function FighterTrainCTA({ fighter, locale, firstLessonSlug, onPress }) {
  const acc = fighter.accent;
  const lastName = fighter.name.split(" ").slice(-1)[0];
  const label = locale === "mn"
    ? `${lastName}-ийн хэв маягаар дасгал хий`
    : `Train ${lastName}'s Style`;

  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: "100%", marginBottom: 16,
        padding: "14px 20px",
        borderRadius: 14,
        background: `linear-gradient(135deg, ${acc} 0%, ${acc}cc 100%)`,
        border: "none",
        color: "#fff",
        fontSize: 13, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        boxShadow: `0 8px 32px ${acc}40`,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      {label}
    </button>
  );
}
