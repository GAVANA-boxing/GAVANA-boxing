"use client";

import { GOLD, whiteAlpha, goldAlpha } from "@/lib/tokens";

export default function ReturnSummary({
  result,
  sessionHistory,
  ghostBestScore,
  effectivePunchCount,
  bestPunch,
  nextFocus,
  effectiveStreak,
  t,
}) {
  const lastScore = Array.isArray(sessionHistory) && sessionHistory.length > 0 ? sessionHistory[0] : null;
  const delta = lastScore != null ? result.score - lastScore : null;

  return (
    <div style={{ padding: "12px 20px 0", display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
      {/* Score row */}
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}` }}>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 3 }}>
            {t("trainLabelToday")}
          </div>
          <div style={{ fontSize: 18, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>
            {result.score.toFixed(1)}
          </div>
        </div>

        {delta != null && (
          <div style={{
            flex: 1, padding: "8px 10px", borderRadius: 10,
            background: delta >= 0 ? "rgba(52,211,153,0.04)" : "rgba(248,113,113,0.04)",
            border: `1px solid ${delta >= 0 ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)"}`,
          }}>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 3 }}>
              {t("trainLabelVsLast")}
            </div>
            <div style={{ fontSize: 18, fontWeight: 1000, color: delta >= 0 ? "#34D399" : "#F87171", fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>
              {delta >= 0 ? "+" : ""}{delta.toFixed(1)}
            </div>
          </div>
        )}

        {ghostBestScore != null && (
          <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}` }}>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 3 }}>
              {t("trainLabelBest")}
            </div>
            <div style={{ fontSize: 18, fontWeight: 1000, color: GOLD, fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>
              {Math.max(ghostBestScore, result.score).toFixed(1)}
            </div>
          </div>
        )}
      </div>

      {/* Punch info + next focus */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <div style={{ padding: "6px 11px", borderRadius: 8, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.06)}`, display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: whiteAlpha(0.28), textTransform: "uppercase", letterSpacing: 1 }}>{t("trainLabelPunches")}</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{effectivePunchCount}</span>
        </div>

        {bestPunch && (
          <div style={{ padding: "6px 11px", borderRadius: 8, background: "rgba(245,196,81,0.05)", border: "1px solid rgba(245,196,81,0.14)", display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: goldAlpha(0.55), textTransform: "uppercase", letterSpacing: 1 }}>{t("trainLabelBestWeapon")}</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: GOLD }}>{bestPunch}</span>
          </div>
        )}

        {effectiveStreak > 0 && (
          <div style={{ padding: "6px 11px", borderRadius: 8, background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.16)", display: "flex", gap: 5, alignItems: "center" }}>
            <span style={{ fontSize: 14 }}>🔥</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: "#FB923C" }}>{effectiveStreak}d</span>
          </div>
        )}
      </div>

      {nextFocus && (
        <div style={{ padding: "7px 12px", borderRadius: 9, background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.13)", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: "rgba(168,85,247,0.65)", textTransform: "uppercase", letterSpacing: 1, flexShrink: 0, paddingTop: 1 }}>
            {t("trainLabelNextFocus")}
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, color: whiteAlpha(0.65), lineHeight: 1.4 }}>{nextFocus}</span>
        </div>
      )}
    </div>
  );
}
