"use client";
import { computePunchPattern } from "@/lib/movementInsight";

export default function PunchPatternCard({ poseMetrics, t }) {
  const pattern = computePunchPattern(poseMetrics?.punchBreakdown);
  if (!pattern) return null;
  const bars = [
    { key: "punchTypeJab",   pct: pattern.jabPct,   count: pattern.jab,   color: "#3B82F6" },
    { key: "punchTypeCross", pct: pattern.crossPct, count: pattern.cross, color: "#EF4444" },
    { key: "punchTypeHook",  pct: pattern.hookPct,  count: pattern.hook,  color: "#8B5CF6" },
  ];
  return (
    <div style={{ margin: "12px 20px 0", padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 10 }}>
        🥊 {t("punchPatternTitle")}
      </div>
      {bars.map((bar) => (
        <div key={bar.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 38, fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            {t(bar.key)}
          </div>
          <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${bar.pct}%`, background: bar.color, borderRadius: 3, transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
          </div>
          <div style={{ width: 30, fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.45)", textAlign: "right" }}>
            {bar.pct}%
          </div>
        </div>
      ))}
      <div style={{ marginTop: 10, fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", textAlign: "center", letterSpacing: 0.3 }}>
        {t(pattern.patternKey)}
      </div>
    </div>
  );
}
