"use client";

const CYAN = "#22D3EE";
const cA = (a) => `rgba(34,211,238,${a})`;

/**
 * @param {{ label: string, value: number }} props
 */
export default function MetricBar({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: 0.6 }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: CYAN }}>{Math.round(value * 10) / 10}</span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: cA(0.1), overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${(value / 10) * 100}%`,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${cA(0.7)}, ${CYAN})`,
          boxShadow: `0 0 8px ${cA(0.5)}`,
          transition: "width 600ms cubic-bezier(0.16,1,0.3,1)",
        }} />
      </div>
    </div>
  );
}
