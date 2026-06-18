"use client";

/**
 * Compact panel showing what the coach "sees" about the fighter —
 * derived from the coach snapshot (weak areas, strong areas, stats).
 *
 * Props:
 *   coachSnapshot  {{ identity, weakAreas, strongAreas, totalSessions, avgScore }} | null
 */
export default function CoachMemoryPanel({ coachSnapshot }) {
  if (!coachSnapshot) return null;

  return (
    <div style={{
      margin: "0 14px 8px",
      padding: "9px 12px",
      borderRadius: 11,
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
    }}>
      <div style={{
        fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8,
        color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 7,
      }}>
        Coach sees
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {coachSnapshot.identity && (
          <span style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.06)", borderRadius: 999, padding: "3px 9px" }}>
            {coachSnapshot.identity.primary}
          </span>
        )}
        {coachSnapshot.weakAreas.slice(0, 2).map(([k, v]) => (
          <span key={k} style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,80,70,0.85)", background: "rgba(255,60,48,0.08)", borderRadius: 999, padding: "3px 8px" }}>
            ⚠ {k} {v.toFixed(1)}
          </span>
        ))}
        {coachSnapshot.strongAreas.slice(0, 1).map(([k, v]) => (
          <span key={k} style={{ fontSize: 10, fontWeight: 800, color: "rgba(245,196,81,0.85)", background: "rgba(245,196,81,0.07)", borderRadius: 999, padding: "3px 8px" }}>
            ⚡ {k} {v.toFixed(1)}
          </span>
        ))}
        <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.22)", fontWeight: 700 }}>
          {coachSnapshot.totalSessions} sessions · avg {coachSnapshot.avgScore.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
