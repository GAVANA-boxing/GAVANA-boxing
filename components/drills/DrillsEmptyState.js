"use client";

const LABELS = {
  heading: { mn: "Чиглэлээ сонгоод үүсгэ", ko: "영역을 고르고 생성하세요", en: "Pick an area and generate" },
  sub: { mn: "AI танд тохирсон 5 дасгал үүсгэнэ", ko: "AI가 맞춤 드릴 5개를 만들어요", en: "AI will create 5 personalized drills for you" },
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
        {LABELS.heading[locale] || LABELS.heading.en}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.22)", lineHeight: 1.5 }}>
        {LABELS.sub[locale] || LABELS.sub.en}
      </p>
    </div>
  );
}
