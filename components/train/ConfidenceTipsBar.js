"use client";

import { CONFIDENCE_TIPS } from "@/lib/scoreConfidence";

export default function ConfidenceTipsBar({ t }) {
  return (
    <div style={{
      margin: "0 20px 0",
      padding: "12px 14px",
      borderRadius: 12,
      background: "rgba(251,146,60,0.06)",
      border: "1px solid rgba(251,146,60,0.2)",
    }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: "#FB923C", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
        ⚠ {t("confidenceLowNote")}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {CONFIDENCE_TIPS.map((tip) => (
          <div
            key={tip.key}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 9px", borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <span style={{ fontSize: 12 }}>{tip.icon}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>{t(tip.key)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
