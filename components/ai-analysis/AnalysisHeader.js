"use client";

const CYAN = "#22D3EE";
const cA = (a) => `rgba(34,211,238,${a})`;

/**
 * @param {{ onBack: () => void }} props
 */
export default function AnalysisHeader({ onBack }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      display: "flex", alignItems: "center", gap: 12,
      padding: "calc(12px + env(safe-area-inset-top)) 16px 12px",
      background: "rgba(11,11,12,0.92)",
      borderBottom: `1px solid ${cA(0.12)}`,
      backdropFilter: "blur(20px)",
    }}>
      <button
        onClick={onBack}
        style={{
          width: 36, height: 36, borderRadius: 12,
          border: `1px solid ${cA(0.2)}`, background: cA(0.06),
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0,
        }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: cA(0.7) }}>GAVANA · AI</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: 0.5 }}>COMBAT ANALYSIS</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: cA(0.08), border: `1px solid ${cA(0.2)}` }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: CYAN, boxShadow: `0 0 6px ${cA(0.9)}`, animation: "pulse 2s infinite" }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: cA(0.85), letterSpacing: 1 }}>LIVE</span>
      </div>
    </div>
  );
}
