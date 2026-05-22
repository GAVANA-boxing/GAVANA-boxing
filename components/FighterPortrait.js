"use client";

import { RED, redAlpha, goldAlpha , blackAlpha} from "@/lib/tokens";

// Cinematic visual identity per fighter — gradients, aura, label
export const FIGHTER_VISUALS = {
  "mike-tyson": {
    bg: "radial-gradient(ellipse at 50% 15%, #6e0004 0%, #2a0002 48%, #060101 100%)",
    spotLight: "radial-gradient(ellipse at 50% 110%, #FF3B3060 0%, transparent 65%)",
    glowColor: `${redAlpha(0.65)}`,
    label: "PRESSURE",
  },
  "muhammad-ali": {
    bg: "radial-gradient(ellipse at 50% 15%, #6b4d00 0%, #2d2000 48%, #060400 100%)",
    spotLight: "radial-gradient(ellipse at 50% 110%, #F5C45160 0%, transparent 65%)",
    glowColor: `${goldAlpha(0.6)}`,
    label: "FLOAT",
  },
  "naoya-inoue": {
    bg: "radial-gradient(ellipse at 50% 15%, #7d2800 0%, #310f00 48%, #060201 100%)",
    spotLight: "radial-gradient(ellipse at 50% 110%, #F9731660 0%, transparent 65%)",
    glowColor: "rgba(249,115,22,0.6)",
    label: "MONSTER",
  },
  "dmitry-bivol": {
    bg: "radial-gradient(ellipse at 50% 15%, #0d2a5e 0%, #051028 48%, #010206 100%)",
    spotLight: "radial-gradient(ellipse at 50% 110%, #3B82F660 0%, transparent 65%)",
    glowColor: "rgba(59,130,246,0.55)",
    label: "TECHNICAL",
  },
  "vasyl-lomachenko": {
    bg: "radial-gradient(ellipse at 50% 15%, #3b0a6e 0%, #180330 48%, #040106 100%)",
    spotLight: "radial-gradient(ellipse at 50% 110%, #A855F760 0%, transparent 65%)",
    glowColor: "rgba(168,85,247,0.55)",
    label: "HI-TECH",
  },
  "canelo-alvarez": {
    bg: "radial-gradient(ellipse at 50% 15%, #6b3800 0%, #2c1600 48%, #060200 100%)",
    spotLight: "radial-gradient(ellipse at 50% 110%, #F59E0B60 0%, transparent 65%)",
    glowColor: "rgba(245,158,11,0.55)",
    label: "COUNTER",
  },
  "gennady-golovkin": {
    bg: "radial-gradient(ellipse at 50% 15%, #003d2a 0%, #001612 48%, #000404 100%)",
    spotLight: "radial-gradient(ellipse at 50% 110%, #10B98160 0%, transparent 65%)",
    glowColor: "rgba(16,185,129,0.55)",
    label: "TRIPLE G",
  },
  "floyd-mayweather": {
    bg: "radial-gradient(ellipse at 50% 15%, #1e2c3a 0%, #0b1018 48%, #010203 100%)",
    spotLight: "radial-gradient(ellipse at 50% 110%, #94A3B860 0%, transparent 65%)",
    glowColor: "rgba(148,163,184,0.5)",
    label: "DEFENSE",
  },
  "manny-pacquiao": {
    bg: "radial-gradient(ellipse at 50% 15%, #6b5800 0%, #2c2400 48%, #060500 100%)",
    spotLight: "radial-gradient(ellipse at 50% 110%, #FCD34D60 0%, transparent 65%)",
    glowColor: "rgba(252,211,77,0.55)",
    label: "SPEED",
  },
  "roberto-duran": {
    bg: "radial-gradient(ellipse at 50% 15%, #5e0808 0%, #240303 48%, #050101 100%)",
    spotLight: "radial-gradient(ellipse at 50% 110%, #DC262660 0%, transparent 65%)",
    glowColor: "rgba(220,38,38,0.6)",
    label: "IRON",
  },
};

// Boxer silhouette — SVG in guard stance
function BoxerSilhouette({ color }) {
  return (
    <svg
      viewBox="0 0 90 180"
      fill="none"
      style={{
        position: "absolute",
        bottom: 0,
        right: "0%",
        width: "60%",
        height: "95%",
        opacity: 0.22,
        pointerEvents: "none",
        filter: `drop-shadow(0 0 18px ${color})`,
      }}
      aria-hidden="true"
    >
      {/* Head */}
      <ellipse cx="46" cy="22" rx="15" ry="18" fill={color} />
      {/* Neck */}
      <rect x="40" y="38" width="12" height="9" rx="4" fill={color} />
      {/* Torso */}
      <path d="M28 47 Q46 42 64 47 L60 96 Q46 102 32 96 Z" fill={color} />
      {/* Left arm guard up */}
      <path d="M28 54 L4 36 Q0 26 10 22 L34 46 Z" fill={color} />
      <ellipse cx="6" cy="28" rx="9" ry="7" fill={color} />
      {/* Right arm extended jab */}
      <path d="M64 58 L86 42 Q90 34 86 28 L62 48 Z" fill={color} />
      <ellipse cx="87" cy="33" rx="9" ry="7" fill={color} />
      {/* Left leg */}
      <path d="M34 96 L26 165 Q24 178 36 178 L42 96 Z" fill={color} />
      {/* Right leg */}
      <path d="M58 96 L68 163 Q70 176 58 176 L52 96 Z" fill={color} />
      {/* Glow under feet */}
      <ellipse cx="46" cy="175" rx="30" ry="5" fill={color} opacity="0.3" />
    </svg>
  );
}

export default function FighterPortrait({
  fighterId,
  fighter,
  height = 110,
  flagSize = 52,
  showName = false,
  showLabel = true,
}) {
  const visual = FIGHTER_VISUALS[fighterId] || {
    bg: "radial-gradient(ellipse at 50% 15%, #3d0000 0%, #150000 48%, #050000 100%)",
    spotLight: "radial-gradient(ellipse at 50% 110%, #FF3B3050 0%, transparent 65%)",
    glowColor: `${redAlpha(0.5)}`,
    label: "FIGHTER",
  };

  const acc = fighter?.accent || RED;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        background: visual.bg,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Atmospheric spot light from below */}
      <div style={{ position: "absolute", inset: 0, background: visual.spotLight, pointerEvents: "none" }} />

      {/* Subtle horizontal scan lines for depth */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(${acc}07 1px, transparent 1px)`,
        backgroundSize: "100% 18px",
        pointerEvents: "none",
      }} />

      {/* Boxer silhouette — right side atmosphere */}
      <BoxerSilhouette color={acc} />

      {/* Flag — small badge top-right corner */}
      <div style={{
        position: "absolute",
        top: "calc(10px + env(safe-area-inset-top))",
        right: 12,
        fontSize: Math.round(flagSize * 0.38),
        lineHeight: 1,
        zIndex: 4,
        pointerEvents: "none",
        background: blackAlpha(0.45),
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRadius: 8,
        padding: "4px 7px",
        border: `1px solid ${acc}30`,
      }}>
        {fighter?.country}
      </div>

      {/* Floor glow under flag */}
      <div style={{
        position: "absolute",
        bottom: showName ? 36 : 10,
        left: "50%",
        transform: "translateX(-50%)",
        width: "55%",
        height: 18,
        background: `radial-gradient(ellipse, ${acc}55, transparent 70%)`,
        filter: "blur(8px)",
        zIndex: 1,
        pointerEvents: "none",
      }} />

      {/* Label — top-left corner */}
      {showLabel && (
        <div style={{
          position: "absolute",
          top: 7,
          left: 9,
          fontSize: 7,
          fontWeight: 900,
          letterSpacing: 1.5,
          color: acc,
          textTransform: "uppercase",
          opacity: 0.75,
          zIndex: 3,
        }}>
          {visual.label}
        </div>
      )}

      {/* Name overlay at bottom */}
      {showName && fighter && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "22px 10px 9px",
          background: `linear-gradient(to top, ${blackAlpha(0.92)} 0%, ${blackAlpha(0.0)} 100%)`,
          zIndex: 3,
        }}>
          <p style={{
            margin: "0 0 1px",
            fontSize: 11,
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.1,
            fontFamily: "var(--font-display, 'Anton', sans-serif)",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}>
            {fighter.name}
          </p>
          <span style={{
            fontSize: 8,
            fontWeight: 800,
            color: acc,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            opacity: 0.9,
          }}>
            {visual.label}
          </span>
        </div>
      )}
    </div>
  );
}
