"use client";

import { GOLD, RED, whiteAlpha, goldAlpha } from "@/lib/tokens";

// Locale strings
const L = {
  notEnoughData: { mn: "Хангалтгүй өгөгдөл", ko: "데이터 부족", en: "Not Enough Data" },
  needPunches: (locale, min, count) =>
    locale === "mn"
      ? `AI шинжилгээнд хамгийн багадаа ${min} цохилт хэрэгтэй. Та ${count} цохилт хийсэн.`
      : `AI analysis needs at least ${min} punches. You threw ${count}.`,
};

export default function ResultHeader({
  analysisLabel,
  tooFewPunches,
  effectivePunchCount,
  minPunches,
  identity,
  displayScore,
  scoreConf,
  locale,
  t,
}) {
  return (
    <div style={{ padding: "20px 20px 14px", flexShrink: 0, borderBottom: `1px solid ${whiteAlpha(0.05)}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <p style={{ margin: 0, fontSize: 9, fontWeight: 900, letterSpacing: 3.5, color: goldAlpha(0.65), textTransform: "uppercase" }}>
          {analysisLabel}
        </p>

        {/* Confidence badge */}
        {!tooFewPunches && displayScore > 0 && (() => {
          const confMap = {
            high:   { label: t("scoreConfidenceHigh"),   color: "#34D399", bg: "rgba(52,211,153,0.1)" },
            medium: { label: t("scoreConfidenceMedium"), color: "#F5C451", bg: "rgba(245,196,81,0.1)" },
            low:    { label: t("scoreConfidenceLow"),    color: "#FB923C", bg: "rgba(251,146,60,0.1)" },
          };
          const cm = confMap[scoreConf];
          if (!cm) return null;
          return (
            <span style={{ fontSize: 8, fontWeight: 900, color: cm.color, background: cm.bg, padding: "3px 8px", borderRadius: 20, letterSpacing: 0.5 }}>
              {cm.label}
            </span>
          );
        })()}
      </div>

      {(tooFewPunches || displayScore <= 0) ? (
        <div style={{ margin: "16px 0 10px" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 1000, color: whiteAlpha(0.55), letterSpacing: "-0.01em" }}>
            {L.notEnoughData[locale] ?? L.notEnoughData.en}
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: whiteAlpha(0.35), lineHeight: 1.5 }}>
            {tooFewPunches
              ? L.needPunches(locale, minPunches, effectivePunchCount)
              : locale === "mn"
                ? "Хөдөлгөөний өгөгдөл хангалтгүй байна. Илүү урт комбо хийж үзнэ үү."
                : locale === "ko"
                ? "움직임 데이터가 부족합니다. 더 긴 콤보를 시도해보세요."
                : "Insufficient movement data. Try a longer combination."}
          </p>
        </div>
      ) : (
        <>
          <h2 style={{
            margin: "8px 0 2px", fontSize: 24, fontWeight: 1000,
            letterSpacing: "-0.02em", color: "#fff", lineHeight: 1.0,
            fontFamily: "var(--font-display, 'Anton', sans-serif)",
          }}>
            {identity.title}
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: 11, color: whiteAlpha(0.35), fontWeight: 700 }}>
            {identity.sub}
          </p>

          {/* Score telemetry bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 3, background: whiteAlpha(0.07), borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${(displayScore / 10) * 100}%`,
                background: `linear-gradient(90deg, ${RED}, ${GOLD})`,
                borderRadius: 2,
                transition: "width 0.04s linear",
              }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2, flexShrink: 0 }}>
              <span style={{
                fontSize: 32, fontWeight: 1000, lineHeight: 1,
                fontFamily: "var(--font-display, 'Anton', sans-serif)",
                letterSpacing: "-0.02em", color: "#fff",
              }}>
                {displayScore.toFixed(1)}
              </span>
              <span style={{ fontSize: 12, color: whiteAlpha(0.28), fontWeight: 800 }}>/10</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
