"use client";

import { GOLD, RED, RADIUS, redAlpha, blackAlpha } from "@/lib/tokens";
import { INSIGHT_COLOR } from "@/lib/dashboardHelpers";

/**
 * @param {{
 *   displayScore: number,
 *   xp: number,
 *   rank: { key: string, icon: string, color: string, gradient?: string },
 *   nextRank?: { key: string, minXP: number } | null,
 *   xpProgress: number,
 *   insight: { type: string, text: string },
 *   t: (key: string) => string,
 * }} props
 */
export function FighterHero({ displayScore, xp, rank, nextRank, xpProgress, insight, t }) {
  const ic = INSIGHT_COLOR[insight.type];
  const rankIcon = rank.icon === "crown" ? "👑" : rank.icon === "diamond" ? "💎" : rank.icon === "star5" ? "⭐" : "🥊";

  // Circular progress ring
  const R = 54, CX = 70, CY = 70;
  const CIRC = 2 * Math.PI * R;
  const pct = Math.min(100, Math.max(0, displayScore)) / 100;
  const dashoffset = CIRC * (1 - pct);

  return (
    <div style={{
      position: "relative",
      borderRadius: 22,
      overflow: "hidden",
      background: "linear-gradient(160deg, #141416 0%, #0B0B0C 45%, #0B0B0C 100%)",
      border: `1px solid ${redAlpha(0.18)}`,
      boxShadow: `0 0 0 1px ${redAlpha(0.07)}, 0 28px 64px ${blackAlpha(0.65)}, inset 0 1px 0 rgba(255,255,255,0.035)`,
      marginBottom: 20,
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 50% 30%, ${redAlpha(0.22)} 0%, transparent 60%)`,
      }} />
      <div style={{ position: "relative", padding: "22px 22px 20px" }}>
        <p style={{ margin: "0 0 16px", fontSize: 9, fontWeight: 900, color: `${redAlpha(0.75)}`, letterSpacing: 3.5, textTransform: "uppercase", textAlign: "center" }}>
          GAVANA · FIGHTER SCORE
        </p>

        {/* Circular progress ring */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 14 }}>
          <div style={{ position: "relative", width: 140, height: 140 }}>
            <svg viewBox="0 0 140 140" width="140" height="140" style={{ display: "block" }}>
              <defs>
                <linearGradient id="scoreRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={rank.color} />
                  <stop offset="100%" stopColor={RED} />
                </linearGradient>
              </defs>
              {/* Track */}
              <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="8"
              />
              {/* Progress */}
              <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke="url(#scoreRingGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRC.toFixed(2)}
                strokeDashoffset={dashoffset.toFixed(2)}
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)" }}
              />
            </svg>
            {/* Score text centered inside ring */}
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 52, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "var(--font-display,'Anton',sans-serif)", textShadow: `0 0 40px ${redAlpha(0.4)}` }}>
                {displayScore}
              </span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", fontWeight: 700, marginTop: -2 }}>/100</span>
              <span style={{ fontSize: 18, marginTop: 2 }}>{rankIcon}</span>
            </div>
          </div>
          {/* Rank + XP below ring */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: rank.color, letterSpacing: 0.2 }}>{t(rank.key)}</span>
            <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 12 }}>·</span>
            <span style={{ fontSize: 12, color: GOLD, fontWeight: 800 }}>{xp.toLocaleString()} XP</span>
          </div>
        </div>

        {nextRank && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.22)", letterSpacing: 0.5 }}>
                {t(rank.key).toUpperCase()}
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)" }}>
                {(nextRank.minXP - xp).toLocaleString()} {t("dashboardToGo")} → {t(nextRank.key)}
              </span>
            </div>
            <div style={{ height: 5, borderRadius: RADIUS.full, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: RADIUS.full,
                background: rank.gradient || rank.color,
                width: `${xpProgress}%`,
                boxShadow: `0 0 14px ${rank.color}55`,
                animation: "rankFill 1100ms cubic-bezier(0.16,1,0.3,1) both",
              }} />
            </div>
          </div>
        )}

        <p style={{
          margin: 0, fontSize: 12, color: ic,
          fontStyle: "italic", lineHeight: 1.55, opacity: 0.88,
          borderLeft: `2px solid ${ic}55`, paddingLeft: 10,
        }}>
          {insight.text}
        </p>
      </div>
    </div>
  );
}
