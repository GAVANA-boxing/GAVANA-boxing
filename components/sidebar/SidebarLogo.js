"use client";

import { RED, RED_DARK, redAlpha } from "@/lib/tokens";

const BRAND_NAME = "GAVANA";
const BRAND_SUB  = "BOXING · OS";
const STATUS_LABEL = "COMBAT SYSTEM ONLINE";

const s = {
  logoBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    padding: "4px 6px",
    background: "none",
    border: "none",
    cursor: "pointer",
    alignSelf: "flex-start",
    borderRadius: 10,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
    boxShadow: `0 4px 16px ${redAlpha(0.45)}, inset 0 1px 0 rgba(255,255,255,0.15)`,
  },
  logoG: {
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    fontSize: 20,
    color: "#fff",
    lineHeight: 1,
    position: "relative",
    zIndex: 1,
    fontWeight: 400,
  },
  logoGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: 10,
    background: "radial-gradient(circle at 40% 30%, rgba(255,255,255,0.18) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  logoText: { display: "flex", flexDirection: "column", gap: 1 },
  logoGavana: {
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    fontSize: 15,
    fontWeight: 400,
    letterSpacing: "0.1em",
    color: "#fff",
    lineHeight: 1,
  },
  logoSub: {
    fontSize: 8,
    fontWeight: 700,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    lineHeight: 1.4,
  },
  statusChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 8px",
    marginBottom: 20,
    borderRadius: 6,
    background: "rgba(34,211,238,0.04)",
    border: "1px solid rgba(34,211,238,0.1)",
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "#22D3EE",
    boxShadow: "0 0 6px rgba(34,211,238,0.9)",
    flexShrink: 0,
  },
  statusLabel: {
    fontSize: 8,
    fontWeight: 800,
    color: "rgba(34,211,238,0.6)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
};

export default function SidebarLogo({ onLogoClick }) {
  return (
    <>
      <button style={s.logoBtn} onClick={onLogoClick}>
        <div style={s.logoMark}>
          <span style={s.logoG}>G</span>
          <div style={s.logoGlow} />
        </div>
        <div style={s.logoText}>
          <span style={s.logoGavana}>{BRAND_NAME}</span>
          <span style={s.logoSub}>{BRAND_SUB}</span>
        </div>
      </button>

      <div style={s.statusChip}>
        <span style={s.statusDot} className="live-pulse" />
        <span style={s.statusLabel}>{STATUS_LABEL}</span>
      </div>
    </>
  );
}
