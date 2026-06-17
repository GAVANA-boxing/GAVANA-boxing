"use client";

export default function FighterMasteryBar({ studiedFighters, totalFighters, locale }) {
  if (!studiedFighters?.length) return null;

  const pct = Math.round((studiedFighters.length / totalFighters) * 100);

  return (
    <div style={{ marginBottom: 20, padding: "11px 14px", borderRadius: 13, background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.14)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.8, color: "#34D399", textTransform: "uppercase" }}>
          ⚔️ Fighter Mastery
        </span>
        <span style={{ fontSize: 12, fontWeight: 900, color: "#34D399" }}>
          {studiedFighters.length}/{totalFighters} · {pct}%
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #34D399, #10B981)", animation: "rankFill 850ms cubic-bezier(0.16,1,0.3,1) both" }} />
      </div>
      {pct === 100 && (
        <div style={{ marginTop: 8, fontSize: 10.5, fontWeight: 800, color: "#34D399", textAlign: "center" }}>
          🏆 {locale === "mn" ? "Бүх тулаанчдыг судалсан!" : "All fighters studied!"}
        </div>
      )}
    </div>
  );
}
