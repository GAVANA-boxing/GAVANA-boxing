"use client";

import { GOLD, redAlpha } from "@/lib/tokens";
import {
  RADAR_KEYS, RADAR_ANGLES, INSIGHT_COLOR, DNA_ATTRS, radPolar,
} from "@/lib/dashboardHelpers";

export function RadarChart({ stats }) {
  const SIZE = 230;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const maxR = 76;

  const gridPoly = (scale) =>
    RADAR_ANGLES.map((a) => {
      const p = radPolar(a, maxR * scale, cx, cy);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ");

  const dataPoints = RADAR_KEYS.map((key, i) => {
    const val = Math.max(0, Math.min(10, stats[key] || 0));
    return radPolar(RADAR_ANGLES[i], (val / 10) * maxR, cx, cy);
  });
  const dataPoly = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <radialGradient id="rdg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={redAlpha(0.52)} />
          <stop offset="100%" stopColor={redAlpha(0.05)} />
        </radialGradient>
        <filter id="rdGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {[0.25, 0.5, 0.75, 1.0].map((scale) => (
        <polygon key={scale} points={gridPoly(scale)}
          fill="none"
          stroke={scale === 1.0 ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.05)"}
          strokeWidth={scale === 1.0 ? 1 : 0.7}
        />
      ))}

      {RADAR_ANGLES.map((a, i) => {
        const outer = radPolar(a, maxR, cx, cy);
        return (
          <line key={i}
            x1={cx.toFixed(1)} y1={cy.toFixed(1)}
            x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
            stroke="rgba(255,255,255,0.055)" strokeWidth="1" />
        );
      })}

      <polygon points={dataPoly}
        fill="url(#rdg)"
        stroke={GOLD}
        strokeWidth="1.8"
        strokeLinejoin="round"
        filter="url(#rdGlow)"
        className="radar-polygon"
      />

      {dataPoints.map((p, i) => (
        <circle key={i}
          cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
          r="3" fill={GOLD} stroke="rgba(0,0,0,0.55)" strokeWidth="0.5" opacity="0.92"
        />
      ))}

      {RADAR_KEYS.map((key, i) => {
        const p = radPolar(RADAR_ANGLES[i], maxR + 17, cx, cy);
        const ta = p.x < cx - 8 ? "end" : p.x > cx + 8 ? "start" : "middle";
        const val = Math.max(0, Math.min(10, stats[key] || 0));
        const valColor = val >= 7 ? GOLD : val >= 5 ? "rgba(255,255,255,0.45)" : "#C1121F";
        return (
          <g key={key}>
            <text x={p.x.toFixed(1)} y={(p.y - 4).toFixed(1)}
              textAnchor={ta} dominantBaseline="auto"
              fontSize="8" fontWeight="900" fill="rgba(255,255,255,0.6)" letterSpacing="0.7">
              {key.toUpperCase()}
            </text>
            <text x={p.x.toFixed(1)} y={(p.y + 7).toFixed(1)}
              textAnchor={ta} dominantBaseline="auto"
              fontSize="7" fontWeight="700" fill={valColor}>
              {val.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function StyleDNA({ radarStats }) {
  const items = DNA_ATTRS.map((a) => ({
    key: a.key,
    color: a.color,
    pct: Math.round(Math.max(1, Math.min(10, a.fn(radarStats))) * 10),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {items.map((item) => (
        <div key={item.key}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.42)", letterSpacing: 0.9 }}>
              {item.key.toUpperCase()}
            </span>
            <span style={{ fontSize: 10, fontWeight: 900, color: item.color }}>{item.pct}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.055)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 999,
              width: `${item.pct}%`,
              background: `linear-gradient(90deg, ${item.color}88, ${item.color})`,
              boxShadow: `0 0 8px ${item.color}44`,
              animation: "rankFill 850ms cubic-bezier(0.16,1,0.3,1) both",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FighterHero({ displayScore, xp, rank, nextRank, xpProgress, insight, t }) {
  const ic = INSIGHT_COLOR[insight.type];
  const rankIcon = rank.icon === "crown" ? "👑" : rank.icon === "diamond" ? "💎" : rank.icon === "star5" ? "⭐" : "🥊";

  return (
    <div style={{
      position: "relative",
      borderRadius: 22,
      overflow: "hidden",
      background: "linear-gradient(160deg, #1c0202 0%, #0e0000 45%, #080808 100%)",
      border: `1px solid ${redAlpha(0.18)}`,
      boxShadow: `0 0 0 1px ${redAlpha(0.07)}, 0 28px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.035)`,
      marginBottom: 20,
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 18% 25%, ${redAlpha(0.24)} 0%, transparent 58%)`,
      }} />
      <div style={{ position: "relative", padding: "22px 22px 20px" }}>
        <p style={{ margin: "0 0 18px", fontSize: 9, fontWeight: 900, color: `${redAlpha(0.75)}`, letterSpacing: 3.5, textTransform: "uppercase" }}>
          GAVANA · FIGHTER SCORE
        </p>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, lineHeight: 1 }}>
              <span style={{
                fontSize: 72, fontWeight: 900, color: "#fff",
                letterSpacing: "-0.045em", lineHeight: 0.92,
                fontFamily: "var(--font-display, 'Anton', sans-serif)",
                textShadow: `0 0 60px ${redAlpha(0.35)}, 0 4px 24px rgba(0,0,0,0.8)`,
              }}>
                {displayScore}
              </span>
              <span style={{ fontSize: 19, color: "rgba(255,255,255,0.22)", fontWeight: 700, paddingBottom: 8 }}>/100</span>
            </div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: rank.color, letterSpacing: 0.2 }}>{t(rank.key)}</span>
              <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 12 }}>·</span>
              <span style={{ fontSize: 12, color: GOLD, fontWeight: 800 }}>{xp.toLocaleString()} XP</span>
            </div>
          </div>

          <div style={{
            width: 62, height: 62, borderRadius: "50%", flexShrink: 0,
            background: `radial-gradient(ellipse at 40% 30%, ${rank.color}1e, rgba(0,0,0,0.55))`,
            border: `1.5px solid ${rank.color}3a`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 28px ${rank.color}28`,
          }}>
            <span style={{ fontSize: 28 }}>{rankIcon}</span>
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
            <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 999,
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
