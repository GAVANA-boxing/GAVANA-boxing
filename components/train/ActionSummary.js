"use client";
import { generateTechniqueReview } from "@/lib/techniqueReview";
import { loc } from "@/lib/loc";
import { BRAND, card, sectionLabel } from "@/components/ui/brand";

// The ONE thing to fix next round (big), what went well and the drill (small).
// Same "one tip" rule as Ghost Round: a fighter can only work on one thing at a time.
export default function ActionSummary({ poseMetrics, result, locale }) {
  const review = generateTechniqueReview({ poseMetrics, result, locale });
  if (review.lowData) return null;
  const good = review.strengths[0] || null;
  const fix  = review.fixes[0] || review.priorityWeakness || null;
  const next = review.drill || null;
  if (!good && !fix && !next) return null;

  return (
    <div style={{ ...card, margin: "16px 20px 0", padding: "18px 18px 16px", textAlign: "left", borderColor: fix ? "rgba(255,59,48,0.3)" : BRAND.line, background: fix ? "linear-gradient(145deg, rgba(255,59,48,0.09), rgba(255,255,255,0.02))" : card.background }}>
      {fix && (
        <>
          <p style={{ ...sectionLabel, color: "#ff7a72" }}>{loc(locale, "Дараагийн раундад засах", "다음 라운드에 고칠 점", "Fix this next round")}</p>
          <p style={{ margin: "8px 0 0", fontSize: 18, fontWeight: 700, lineHeight: 1.4, color: BRAND.text }}>{fix}</p>
        </>
      )}
      {(good || next) && (
        <div style={{ display: "grid", gap: 10, marginTop: fix ? 16 : 0, paddingTop: fix ? 14 : 0, borderTop: fix ? `1px solid ${BRAND.line}` : "none" }}>
          {good && <Row icon="✓" color={BRAND.green} label={loc(locale, "Сайн байсан", "잘한 점", "Went well")} text={good} />}
          {next && <Row icon="→" color={BRAND.gold} label={loc(locale, "Дасгал", "드릴", "Drill")} text={next} />}
        </div>
      )}
    </div>
  );
}

function Row({ icon, color, label, text }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span aria-hidden="true" style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 7, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, color, background: `${color}1f` }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.faint }}>{label}</div>
        <div style={{ fontSize: 14, color: BRAND.muted, lineHeight: 1.5, marginTop: 1 }}>{text}</div>
      </div>
    </div>
  );
}
