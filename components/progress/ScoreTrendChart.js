"use client";

import { BRAND } from "@/components/ui/brand";

/**
 * Session scores over time (oldest → newest) as a line with a soft fill, the
 * average as a dashed line, and the latest point highlighted. Plain SVG.
 * @param {{ scores: number[], label: string, avgLabel: string }} props
 */
export default function ScoreTrendChart({ scores, label, avgLabel }) {
  const W = 320, H = 120, P = 10;
  const n = scores.length;
  if (n < 2) return null;
  const lo = Math.max(0, Math.floor(Math.min(...scores) - 1));
  const hi = Math.min(10, Math.ceil(Math.max(...scores) + 1));
  const x = (i) => P + (i * (W - 2 * P)) / (n - 1);
  const y = (v) => H - P - ((v - lo) / Math.max(hi - lo, 1)) * (H - 2 * P);
  const pts = scores.map((v, i) => [x(i), y(v)]);
  const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z`;
  const avg = scores.reduce((a, b) => a + b, 0) / n;
  const [lx, ly] = pts[n - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={BRAND.red} stopOpacity="0.32" />
          <stop offset="100%" stopColor={BRAND.red} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="trendLine" x1="0" x2="1">
          <stop offset="0%" stopColor={BRAND.red} />
          <stop offset="100%" stopColor={BRAND.gold} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trendFill)" />
      <line x1={P} x2={W - P} y1={y(avg)} y2={y(avg)} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" strokeWidth="1" />
      <text x={P + 2} y={y(avg) - 6} textAnchor="start" fill="rgba(255,255,255,0.45)" fontSize="10" fontFamily="var(--stack-sans)">{avgLabel} {avg.toFixed(1)}</text>
      <path d={line} fill="none" stroke="url(#trendLine)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="5" fill={BRAND.gold} stroke="#0b0b0d" strokeWidth="2" />
    </svg>
  );
}
