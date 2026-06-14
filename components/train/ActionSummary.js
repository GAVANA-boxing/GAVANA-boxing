"use client";
import { GOLD, goldAlpha } from "@/lib/tokens";
import { generateTechniqueReview } from "@/lib/techniqueReview";

export default function ActionSummary({ poseMetrics, result, locale }) {
  const review = generateTechniqueReview({ poseMetrics, result, locale });
  if (review.lowData || (!review.strengths.length && !review.fixes.length && !review.drill)) return null;
  const good = review.strengths[0] || null;
  const fix  = review.fixes[0] || null;
  const next = review.drill || null;
  if (!good && !fix && !next) return null;
  const rows = [
    good && { icon: "✓", label: locale === "mn" ? "САЙН" : locale === "ko" ? "잘한 점" : "GOOD", text: good, color: GOLD },
    fix  && { icon: "✗", label: locale === "mn" ? "ЗАСАХ" : locale === "ko" ? "개선"   : "FIX",  text: fix,  color: "#F87171" },
    next && { icon: "→", label: locale === "mn" ? "ДАРААГИЙН" : locale === "ko" ? "다음"  : "NEXT", text: next, color: "rgba(255,255,255,0.75)" },
  ].filter(Boolean);
  return (
    <div style={{ margin: "0 20px 8px", padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: `3px solid ${goldAlpha(0.55)}`, display: "flex", flexDirection: "column", gap: 7 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: row.color, textTransform: "uppercase", flexShrink: 0, paddingTop: 2, minWidth: 36 }}>
            {row.icon} {row.label}
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.45, fontWeight: 600 }}>{row.text}</span>
        </div>
      ))}
    </div>
  );
}
