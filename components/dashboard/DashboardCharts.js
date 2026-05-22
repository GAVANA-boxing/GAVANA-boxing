"use client";

import { GOLD, RED, redAlpha, RADIUS, blackAlpha} from "@/lib/tokens";
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
        const valColor = val >= 7 ? GOLD : val >= 5 ? "rgba(255,255,255,0.45)" : RED;
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
          <div style={{ height: 4, borderRadius: RADIUS.full, background: "rgba(255,255,255,0.055)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: RADIUS.full,
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
