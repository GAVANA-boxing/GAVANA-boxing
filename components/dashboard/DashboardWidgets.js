"use client";

import { RED, GOLD, PURPLE, goldAlpha } from "@/lib/tokens";
import { formatWidgetDate, formatWidgetScore } from "@/lib/dashboardHelpers";

export { RadarChart, StyleDNA, FighterHero } from "./DashboardCharts";

export const labelStyle = {
  fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)",
  textTransform: "uppercase", letterSpacing: "0.06em",
  display: "block", marginBottom: 4,
};

export const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 8,
  padding: "8px 10px",
  color: "#fff",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

export const primaryBtnStyle = {
  flex: 1, padding: "10px 0", borderRadius: 9,
  background: "linear-gradient(135deg, #FF3B30, #cc2820)",
  border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
};

export const ghostBtnStyle = {
  flex: 1, padding: "10px 0", borderRadius: 9,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
  color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 700, cursor: "pointer",
};

export function StatPill({ label, value, sub, color }) {
  return (
    <div style={{
      background: "linear-gradient(160deg, #111012 0%, #0a0a0a 100%)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderTop: `2px solid ${color || "rgba(255,255,255,0.18)"}`,
      borderRadius: 13,
      padding: "12px 11px 10px",
      boxShadow: `0 0 14px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)`,
    }}>
      <div style={{
        fontSize: 20, fontWeight: 900, color: color || "#fff",
        letterSpacing: "-0.025em", lineHeight: 1,
        fontFamily: "var(--font-display,'Anton',sans-serif)",
        textShadow: `0 0 18px ${color || "rgba(255,255,255,0.2)"}44`,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 5 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 8, color: "rgba(255,255,255,0.18)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function ScoreChart({ scores, t }) {
  if (!scores || scores.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: "28px 0", color: "#333", fontSize: 12 }}>
        {scores?.length === 1 ? "1 session — need 2+ to show trend" : t("dashboardNoSessions")}
      </div>
    );
  }

  const W = 320, H = 100;
  const PAD = { top: 16, bottom: 24, left: 26, right: 36 };
  const pw = W - PAD.left - PAD.right;
  const ph = H - PAD.top - PAD.bottom;
  const toX = (i) => PAD.left + (i / (scores.length - 1)) * pw;
  const toY = (v) => PAD.top + ph - (Math.max(0, Math.min(10, v)) / 10) * ph;
  const pts = scores.map((s, i) => `${toX(i).toFixed(1)},${toY(s).toFixed(1)}`).join(" ");
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const best = Math.max(...scores);
  const avgY = toY(avg).toFixed(1);
  const bestY = toY(best).toFixed(1);
  const bestIdx = scores.indexOf(best);

  const recent3 = scores.slice(-3);
  const older3 = scores.slice(0, 3);
  const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
  const olderAvg = older3.reduce((a, b) => a + b, 0) / older3.length;
  const improvement = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg * 100) : 0;

  return (
    <div style={{ width: "100%" }}>
      {Math.abs(improvement) > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: improvement > 0 ? "#4ade80" : "#f87171" }}>
            {improvement > 0 ? "↑" : "↓"} {Math.abs(improvement).toFixed(0)}%
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{t("dashboardVsEarlier")}</span>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x={PAD.left - 4} y={toY(v) + 3.5} textAnchor="end"
              fontSize="7" fill="rgba(255,255,255,0.18)">{v}</text>
          </g>
        ))}
        <line x1={PAD.left} y1={bestY} x2={W - PAD.right} y2={bestY}
          stroke={GOLD} strokeWidth="0.8" strokeDasharray="4,3" opacity="0.5" />
        <text x={W - PAD.right + 3} y={Number(bestY) + 3.5} fontSize="7" fill={GOLD} opacity="0.65">
          {t("dashboardBest")}
        </text>
        <line x1={PAD.left} y1={avgY} x2={W - PAD.right} y2={avgY}
          stroke="rgba(255,255,255,0.13)" strokeWidth="0.6" strokeDasharray="2,3" />
        <polygon
          points={`${pts} ${toX(scores.length - 1).toFixed(1)},${PAD.top + ph} ${PAD.left},${PAD.top + ph}`}
          fill="rgba(255,59,48,0.07)"
        />
        <polyline points={pts} fill="none" stroke={RED} strokeWidth="1.8"
          strokeLinejoin="round" strokeLinecap="round" className="graph-line" />
        {scores.map((s, i) => (
          <circle key={i} cx={toX(i).toFixed(1)} cy={toY(s).toFixed(1)}
            r={i === bestIdx ? 3.5 : 2.5}
            fill={i === bestIdx ? GOLD : RED}
            stroke="rgba(0,0,0,0.6)" strokeWidth="0.5"
          />
        ))}
        <text x={toX(0).toFixed(1)} y={H - 4} textAnchor="middle"
          fontSize="7" fill="rgba(255,255,255,0.18)">{t("dashboardOlderSess")}</text>
        <text x={toX(scores.length - 1).toFixed(1)} y={H - 4} textAnchor="middle"
          fontSize="7" fill="rgba(255,255,255,0.18)">{t("dashboardRecentSess")}</text>
      </svg>
      <div style={{ display: "flex", gap: 14, marginTop: 7, paddingLeft: 26 }}>
        {[
          { color: RED, solid: true, label: t("dashboardScore") },
          { color: GOLD, dashed: true, label: `${t("dashboardBest")} ${formatWidgetScore(best)}` },
          { color: "rgba(255,255,255,0.22)", dashed: true, label: `${t("dashboardAvg")} ${formatWidgetScore(avg)}` },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 16, height: 2,
              background: item.solid ? item.color : "transparent",
              borderTop: item.dashed ? `1.5px dashed ${item.color}` : "none",
            }} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SessionRow({ session, t }) {
  const score = Number(session.score);
  const scoreColor = score >= 7 ? "#4ade80" : score >= 5 ? GOLD : score >= 3 ? "#fb923c" : "#f87171";
  const label = session.reelId
    ? `Reel ${String(session.reelId).slice(0, 6)}…`
    : t("dashboardFreeTraining");

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.035)",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: `${scoreColor}0e`,
        border: `1px solid ${scoreColor}22`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: scoreColor }}>
          {Number.isFinite(score) ? formatWidgetScore(score) : "—"}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#ccc", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </div>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{formatWidgetDate(session.createdAt)}</span>
      </div>
      {session.xpGained != null && (
        <div style={{ fontSize: 10, fontWeight: 800, color: "#F5C45188", flexShrink: 0 }}>
          +{session.xpGained}
        </div>
      )}
    </div>
  );
}

export function BodyStat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#ddd" }}>{value}</div>
    </div>
  );
}

export function InputField({ label, value, onChange, type = "text", required }) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && " *"}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={inputStyle} inputMode={type === "number" ? "decimal" : "text"} />
    </div>
  );
}

export function PanelCard({ label, accent = RED, tag, children, style: styleProp = {} }) {
  return (
    <div style={{
      position: "relative",
      background: "rgba(255,255,255,0.025)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: `2.5px solid ${accent}`,
      borderRadius: "3px 16px 16px 3px",
      boxShadow: "0 0 0 0.5px rgba(0,0,0,0.5) inset, 0 12px 40px rgba(0,0,0,0.2)",
      overflow: "hidden",
      marginBottom: 28,
      ...styleProp,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px 8px",
        borderBottom: "1px solid rgba(255,255,255,0.045)",
        background: "rgba(0,0,0,0.18)",
      }}>
        <div style={{
          width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
          background: accent,
          boxShadow: `0 0 7px ${accent}, 0 0 14px ${accent}55`,
        }} />
        <span style={{
          fontSize: 10, fontWeight: 900, flex: 1,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.18em", textTransform: "uppercase",
          fontFamily: "var(--font-condensed)",
        }}>
          {label}
        </span>
        {tag && (
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "var(--font-condensed)" }}>
            {tag}
          </span>
        )}
      </div>
      <div style={{ padding: "14px 14px 16px" }}>
        {children}
      </div>
    </div>
  );
}

export function Section({ title, accent, children }) {
  return (
    <section style={{ marginBottom: 32 }}>
      {title && (
        <h2 style={{
          margin: "0 0 14px",
          fontSize: 9, fontWeight: 900,
          color: accent || `${goldAlpha(0.38)}`,
          textTransform: "uppercase", letterSpacing: "0.15em",
        }}>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
