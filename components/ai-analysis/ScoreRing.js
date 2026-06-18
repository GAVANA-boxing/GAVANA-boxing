"use client";

const CYAN = "#22D3EE";
const cA = (a) => `rgba(34,211,238,${a})`;

const R = 38;
const circ = 2 * Math.PI * R;

/**
 * @param {{ score: number }} props
 */
export default function ScoreRing({ score }) {
  const pct = Math.min(Math.max((score - 5) / 5, 0), 1);
  const dash = pct * circ;

  return (
    <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
      <svg width={96} height={96} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={48} cy={48} r={R} fill="none" stroke={cA(0.12)} strokeWidth={5} />
        <circle
          cx={48} cy={48} r={R} fill="none"
          stroke={CYAN} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${cA(0.7)})` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: CYAN, letterSpacing: -0.5, lineHeight: 1 }}>{score.toFixed(1)}</span>
        <span style={{ fontSize: 8, fontWeight: 700, color: cA(0.6), letterSpacing: 1.2, marginTop: 2 }}>SCORE</span>
      </div>
    </div>
  );
}
