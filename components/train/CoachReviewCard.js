"use client";
import { GOLD, goldAlpha } from "@/lib/tokens";
import { generateTechniqueReview } from "@/lib/techniqueReview";
import { loc } from "@/lib/loc";

const REVIEW_LABELS = {
  en: { wellDone: "What went well", mainFix: "Main fix", drill: "Drill", nextGoal: "Next session goal", notEnough: "Not enough data", positionTip: "Tracking tip" },
  mn: { wellDone: "Юу сайн байсан", mainFix: "Гол засах зүйл", drill: "Дасгал", nextGoal: "Дараагийн session-ийн зорилго", notEnough: "Хангалтгүй өгөгдөл", positionTip: "Tracking зөвлөгөө" },
  ko: { wellDone: "잘한 점", mainFix: "주요 개선점", drill: "드릴", nextGoal: "다음 세션 목표", notEnough: "데이터 부족", positionTip: "트래킹 팁" },
};

export default function CoachReviewCard({ poseMetrics, result, locale }) {
  const review = generateTechniqueReview({ poseMetrics, result, locale });
  const RL = REVIEW_LABELS[locale] || REVIEW_LABELS.en;

  if (review.lowData) {
    return (
      <div style={{ margin: "0 20px 8px", padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 6 }}>
          {RL.notEnough}
        </div>
        <p style={{ margin: "0 0 6px", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
          {review.lowDataReason}
        </p>
        {review.positionAdvice && (
          <div style={{ marginTop: 8, padding: "7px 10px", borderRadius: 8, background: "rgba(245,196,81,0.06)", border: "1px solid rgba(245,196,81,0.16)" }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, color: "rgba(245,196,81,0.65)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 }}>
              📷 {RL.positionTip}
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
              {review.positionAdvice}
            </p>
          </div>
        )}
      </div>
    );
  }

  const toneAccent = review.coachTone === "positive" ? "#34D399" : review.coachTone === "critical" ? "#F87171" : "#F5C451";

  return (
    <div style={{ margin: "0 20px 8px", padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: `3px solid ${toneAccent}55` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, color: `${toneAccent}bb`, textTransform: "uppercase" }}>
          {loc(locale, "ТРЕНЕРИЙН ДҮГНЭЛТ", "코치 리뷰", "COACH REVIEW")}
        </div>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
        <div style={{ fontSize: 8.5, fontWeight: 900, color: "rgba(255,255,255,0.28)", letterSpacing: 1 }}>{review.title}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {review.strengths.length > 0 && (
          <div style={{ padding: "8px 10px", borderRadius: 9, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.14)" }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, color: "#6EE7B7", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>✅ {RL.wellDone}</div>
            {review.strengths.map((s, i) => (
              <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.45, paddingBottom: i < review.strengths.length - 1 ? 3 : 0 }}>· {s}</div>
            ))}
          </div>
        )}
        {review.fixes.length > 0 && (
          <div style={{ padding: "8px 10px", borderRadius: 9, background: "rgba(255,80,70,0.06)", border: "1px solid rgba(255,80,70,0.16)" }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, color: "#FCA5A5", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>⚠️ {RL.mainFix}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.45 }}>{review.fixes[0]}</div>
          </div>
        )}
        {review.drill && (
          <div style={{ padding: "8px 10px", borderRadius: 9, background: "rgba(245,196,81,0.06)", border: "1px solid rgba(245,196,81,0.16)" }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, color: "#FDE68A", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>🎯 {RL.drill}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.45 }}>{review.drill}</div>
          </div>
        )}
        {review.nextSessionGoal && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 10px", borderRadius: 9, background: goldAlpha(0.06), border: `1px solid ${goldAlpha(0.16)}` }}>
            <span style={{ fontSize: 8.5, fontWeight: 900, color: GOLD, letterSpacing: 1.2, textTransform: "uppercase", flexShrink: 0, paddingTop: 1 }}>🏆 {RL.nextGoal}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.45, fontWeight: 700 }}>{review.nextSessionGoal}</span>
          </div>
        )}
      </div>
    </div>
  );
}
