"use client";

const LABELS = {
  heading: { mn: "Дасгалаа сонгоод үүсгэ", en: "Select an area and generate" },
  sub: { mn: "AI танд тохирсон 5 дасгал үүсгэнэ", en: "AI will create 5 personalized drills for you" },
};

/**
 * @param {{ locale: string }} props
 */
export default function DrillsEmptyState({ locale }) {
  const mn = locale === "mn";

  return (
    <div style={{ textAlign: "center", padding: "32px 0 16px" }}>
      <p style={{ margin: "0 0 8px", fontSize: 32 }}>🥊</p>
      <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.45)" }}>
        {mn ? LABELS.heading.mn : LABELS.heading.en}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.22)", lineHeight: 1.5 }}>
        {mn ? LABELS.sub.mn : LABELS.sub.en}
      </p>
    </div>
  );
}
