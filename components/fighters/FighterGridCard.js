"use client";

import FighterPortrait from "@/components/FighterPortrait";
import { GOLD } from "@/lib/tokens";

const cardStyles = {
  card: {
    background: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    overflow: "hidden",
    cursor: "pointer",
    textAlign: "left",
    padding: 0,
    boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
    transition: "transform 180ms ease, box-shadow 180ms ease",
    position: "relative",
  },
  cardBottom: {
    padding: "8px 11px 10px",
    background: "rgba(0,0,0,0.55)",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  cardWeapon: { margin: 0, fontSize: 10, color: "rgba(255,255,255,0.38)", lineHeight: 1.4 },
};

export default function FighterGridCard({ fighter, onClick, badge, studied, compareMode, selected, onToggle }) {
  const acc = fighter.accent;
  return (
    <button
      type="button"
      onClick={compareMode ? onToggle : onClick}
      style={{
        ...cardStyles.card,
        border: selected ? `2px solid ${GOLD}` : badge ? `1px solid ${acc}50` : studied ? `1px solid rgba(52,211,153,0.2)` : "1px solid rgba(255,255,255,0.08)",
        borderBottom: selected ? `2px solid ${GOLD}` : `3px solid ${acc}55`,
        boxShadow: selected
          ? `0 8px 28px rgba(0,0,0,0.5), 0 0 0 2px ${GOLD}44`
          : badge
          ? `0 8px 28px rgba(0,0,0,0.5), 0 0 0 1px ${acc}22`
          : `0 8px 28px rgba(0,0,0,0.5), inset 0 0 0 1px ${acc}12`,
        position: "relative",
      }}
    >
      <FighterPortrait fighterId={fighter.id} fighter={fighter} height={155} flagSize={46} showName showLabel />
      {selected && (
        <div style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 8px ${GOLD}` }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      )}
      {!selected && badge && (
        <div style={{ position: "absolute", top: 8, right: 8, padding: "2px 7px", borderRadius: 999, background: `${acc}22`, border: `1px solid ${acc}55`, fontSize: 8, fontWeight: 900, color: acc, letterSpacing: 1, textTransform: "uppercase" }}>
          {badge}
        </div>
      )}
      {!selected && studied && !badge && (
        <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: "rgba(52,211,153,0.18)", border: "1px solid rgba(52,211,153,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}
      <div style={cardStyles.cardBottom}>
        <p style={{ ...cardStyles.cardWeapon, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center" }}>
          <svg width="8" height="10" viewBox="0 0 13 16" fill={acc} style={{ marginRight: 5, flexShrink: 0 }}>
            <path d="M7 0L0 9h6l-1 7 7-9H6L7 0z"/>
          </svg>
          {fighter.keyWeapon}
        </p>
      </div>
    </button>
  );
}
