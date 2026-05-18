"use client";

import { redAlpha, goldAlpha } from "@/lib/tokens";

const TYPE_THEMES = {
  training: {
    bg: "linear-gradient(160deg, #3d0000 0%, #1a0000 45%, #080000 100%)",
    glow: `radial-gradient(ellipse at 50% 30%, ${redAlpha(0.22)} 0%, transparent 65%)`,
    icon: "🥊",
    accent: RED,
    label: "TRAINING",
  },
  educational: {
    bg: "linear-gradient(160deg, #2a1c00 0%, #100c00 45%, #060400 100%)",
    glow: `radial-gradient(ellipse at 50% 30%, ${goldAlpha(0.2)} 0%, transparent 65%)`,
    icon: "📚",
    accent: GOLD,
    label: "TECHNIQUE",
  },
  challenge: {
    bg: "linear-gradient(160deg, #001a0a 0%, #000d05 45%, #000302 100%)",
    glow: "radial-gradient(ellipse at 50% 30%, rgba(16,185,129,0.2) 0%, transparent 65%)",
    icon: "⚔️",
    accent: "#10B981",
    label: "CHALLENGE",
  },
  lifestyle: {
    bg: "linear-gradient(160deg, #00101a 0%, #00060d 45%, #000104 100%)",
    glow: "radial-gradient(ellipse at 50% 30%, rgba(96,165,250,0.18) 0%, transparent 65%)",
    icon: "🎬",
    accent: "#60A5FA",
    label: "LIFESTYLE",
  },
};

const FALLBACK = TYPE_THEMES.lifestyle;

export default function MediaCover({ contentType, category, caption, className, style: styleOverride }) {
  const typeKey = contentType || category || "lifestyle";
  const theme = TYPE_THEMES[typeKey] || FALLBACK;
  const short = caption ? (caption.length > 44 ? caption.slice(0, 44) + "…" : caption) : null;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        background: theme.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        ...styleOverride,
      }}
    >
      {/* Atmospheric glow */}
      <div style={{ position: "absolute", inset: 0, background: theme.glow, pointerEvents: "none" }} />

      {/* Diagonal shine */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(255,255,255,0.01) 100%)",
        pointerEvents: "none",
      }} />

      {/* Content icon */}
      <span style={{
        fontSize: 32,
        lineHeight: 1,
        marginBottom: 8,
        filter: `drop-shadow(0 4px 16px ${theme.accent}80)`,
        position: "relative",
        zIndex: 2,
      }}>
        {theme.icon}
      </span>

      {/* Caption */}
      {short && (
        <p style={{
          margin: 0,
          fontSize: 10,
          fontWeight: 800,
          color: "rgba(255,255,255,0.7)",
          textAlign: "center",
          lineHeight: 1.4,
          maxWidth: "82%",
          position: "relative",
          zIndex: 2,
          letterSpacing: 0.2,
        }}>
          {short}
        </p>
      )}

      {/* Type label — top left */}
      <div style={{
        position: "absolute",
        top: 7,
        left: 8,
        fontSize: 7,
        fontWeight: 900,
        letterSpacing: 1.2,
        color: theme.accent,
        textTransform: "uppercase",
        opacity: 0.85,
        zIndex: 3,
      }}>
        {theme.label}
      </div>

      {/* GAVANA watermark — bottom right */}
      <div style={{
        position: "absolute",
        bottom: 7,
        right: 8,
        fontSize: 7,
        fontWeight: 900,
        letterSpacing: 2,
        color: `${theme.accent}55`,
        textTransform: "uppercase",
        zIndex: 3,
      }}>
        GAVANA
      </div>
    </div>
  );
}
