"use client";

import { RED, GOLD } from "@/lib/tokens";

const S = {
  systemBar: {
    position: "absolute",
    top: "calc(16px + env(safe-area-inset-top))",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  systemDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: RED,
    boxShadow: "0 0 8px rgba(255,59,48,0.9)",
    animation: "ambient-pulse 2s ease-in-out infinite",
  },
  systemText: {
    fontSize: 9,
    fontWeight: 900,
    color: "rgba(255,255,255,0.38)",
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  orb1: {
    position: "absolute",
    top: "-15%",
    left: "50%",
    transform: "translateX(-50%)",
    width: 520,
    height: 340,
    borderRadius: "50%",
    background: "radial-gradient(ellipse, rgba(255,59,48,0.26) 0%, transparent 70%)",
    filter: "blur(50px)",
    animation: "float-drift 14s ease-in-out infinite",
    pointerEvents: "none",
  },
  orb2: {
    position: "absolute",
    bottom: "5%",
    right: "-10%",
    width: 300,
    height: 220,
    borderRadius: "50%",
    background: "radial-gradient(ellipse, rgba(255,59,48,0.1) 0%, transparent 70%)",
    filter: "blur(60px)",
    animation: "float-drift 18s ease-in-out infinite reverse",
    pointerEvents: "none",
  },
};

/**
 * Decorative background elements: ambient orbs and the top HUD system bar.
 */
export default function LoginPageBackground() {
  return (
    <>
      {/* Ambient orbs */}
      <div style={S.orb1} />
      <div style={S.orb2} />

      {/* Top system label */}
      <div style={S.systemBar}>
        <span style={S.systemDot} />
        <span style={S.systemText}>GAVANA COMBAT SYSTEM v2.0</span>
        <span style={{ ...S.systemDot, background: GOLD }} />
      </div>
    </>
  );
}
