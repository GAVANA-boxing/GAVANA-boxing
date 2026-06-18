"use client";

import { GOLD, RED, redAlpha } from "@/lib/tokens";
import { METRIC_INFO } from "./METRIC_INFO";

/**
 * @param {{ metricKey: string, stats: object, sessions: any[], locale: string, onClose: () => void }} props
 */
export function MetricSheet({ metricKey, stats, sessions, locale, onClose }) {
  const info = METRIC_INFO[metricKey];
  if (!info) return null;
  const L = info[locale] || info.en;
  const val = Math.max(0, Math.min(10, stats[metricKey] || 0));
  const valColor = val >= 7 ? GOLD : val >= 5 ? "rgba(255,255,255,0.7)" : RED;
  const impactText = L.impact(sessions || []);
  const labelMap = { en: ["Formula", "Recent Drills Impact", "Improvement Tips"], mn: ["Томьёо", "Сүүлийн дасгалын нөлөө", "Сайжруулах зөвлөмж"], ko: ["공식", "최근 드릴 영향", "향상 팁"] };
  const [fLabel, iLabel, tLabel] = labelMap[locale] || labelMap.en;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 540,
          background: "linear-gradient(160deg, #18181B 0%, #0F0F11 100%)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderBottom: "none",
          borderRadius: "20px 20px 0 0",
          padding: "0 0 calc(32px + env(safe-area-inset-bottom))",
          animation: "sheetUp 280ms cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <style>{`@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "12px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 26 }}>{info.icon}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: 0.2 }}>{metricKey.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: valColor, lineHeight: 1 }}>{val.toFixed(1)}<span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginLeft: 3 }}>/10</span></div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Formula */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>{fLabel}</div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: GOLD, fontWeight: 700, lineHeight: 1.6 }}>{L.formula}</div>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{L.fallback}</div>
            </div>
          </div>

          {/* Recent drills impact */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>{iLabel}</div>
            <div style={{ background: `${redAlpha(0.08)}`, border: `1px solid ${redAlpha(0.18)}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>{impactText}</div>
            </div>
          </div>

          {/* Improvement tips */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>{tLabel}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {L.tips.map((tip, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                  <span style={{ fontSize: 11, color: GOLD, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>›</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600, lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
