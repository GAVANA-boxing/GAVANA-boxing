"use client";

import { useState } from "react";
import { GOLD, RED, redAlpha } from "@/lib/tokens";
import { RADAR_KEYS, RADAR_ANGLES, radPolar } from "@/lib/dashboardHelpers";
import { MetricSheet } from "./MetricSheet";

/**
 * @param {{ stats: object, prevStats?: object, locale?: string, sessions?: any[] }} props
 */
export function RadarChart({ stats, prevStats, locale = "en", sessions = [] }) {
  const [selected, setSelected] = useState(null);
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

  const prevPoints = prevStats ? RADAR_KEYS.map((key, i) => {
    const val = Math.max(0, Math.min(10, prevStats[key] || 0));
    return radPolar(RADAR_ANGLES[i], (val / 10) * maxR, cx, cy);
  }) : null;
  const prevPoly = prevPoints?.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Extra padding to prevent label clip on left/right edges (e.g. "ACCURACY" at 210°)
  const PAD_X = 22, PAD_Y = 8;
  return (
    <>
      {selected && (
        <MetricSheet
          metricKey={selected}
          stats={stats}
          sessions={sessions}
          locale={locale}
          onClose={() => setSelected(null)}
        />
      )}
      <svg viewBox={`${-PAD_X} ${-PAD_Y} ${SIZE + PAD_X * 2} ${SIZE + PAD_Y * 2}`} width="100%" style={{ display: "block", overflow: "visible" }}>
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

        {/* Ghost polygon: previous period stats */}
        {prevPoly && (
          <polygon points={prevPoly}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.1"
            strokeDasharray="3,3"
            strokeLinejoin="round"
          />
        )}

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
          const prev = prevStats?.[key];
          const delta = prev != null ? val - prev : null;
          const hasDelta = delta != null && Math.abs(delta) >= 0.2;
          // hitbox: 44×28 rect centred on the label cluster
          const HW = 44, HH = hasDelta ? 32 : 24;
          const hx = ta === "end" ? p.x - HW : ta === "start" ? p.x : p.x - HW / 2;
          const hy = p.y - 8;
          return (
            <g key={key} style={{ cursor: "pointer" }} onClick={() => setSelected(key)}>
              {/* invisible hitbox */}
              <rect x={hx.toFixed(1)} y={hy.toFixed(1)} width={HW} height={HH} fill="transparent" />
              <text x={p.x.toFixed(1)} y={(p.y - 4).toFixed(1)}
                textAnchor={ta} dominantBaseline="auto"
                fontSize="8" fontWeight="900" fill="rgba(255,255,255,0.6)" letterSpacing="0.7"
                style={{ textDecoration: "underline", textDecorationColor: "rgba(255,255,255,0.2)" }}>
                {key.toUpperCase()}
              </text>
              <text x={p.x.toFixed(1)} y={(p.y + 7).toFixed(1)}
                textAnchor={ta} dominantBaseline="auto"
                fontSize="7" fontWeight="700" fill={valColor}>
                {val.toFixed(1)}
              </text>
              {hasDelta && (
                <text x={p.x.toFixed(1)} y={(p.y + 17).toFixed(1)}
                  textAnchor={ta} dominantBaseline="auto"
                  fontSize="6.5" fontWeight="800" fill={delta > 0 ? "#4ade80" : "#f87171"}>
                  {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </>
  );
}
