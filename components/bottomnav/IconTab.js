"use client";

import { RED, redAlpha, MOTION } from "@/lib/tokens";

const s = {
  iconTab: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 68,
    WebkitTapHighlightColor: "transparent",
    padding: 0,
  },
  iconGlow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transition: `background ${MOTION.hover}`,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    lineHeight: 1,
    transition: "color 160ms ease",
    fontFamily: "var(--font-geist-sans, system-ui)",
  },
};

/**
 * @param {{ active: boolean, onClick: () => void, children: React.ReactNode, label: string }} props
 */
export default function IconTab({ active, onClick, children, label }) {
  return (
    <button type="button" onClick={onClick} style={s.iconTab} aria-label={label} className="tap-bounce">
      <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span
          key={active ? "a" : "i"}
          className={active ? "nav-active-pop" : undefined}
          style={{
            ...s.iconGlow,
            background: active ? redAlpha(0.11) : "transparent",
          }}
        >
          <span style={{ transform: active ? "scale(1.06)" : "scale(1)", transition: "transform 220ms cubic-bezier(0.34,1.56,0.64,1)", display: "flex" }}>
            {children}
          </span>
        </span>
        <span style={{ ...s.tabLabel, color: active ? RED : "rgba(255,255,255,0.32)" }}>{label}</span>
      </span>
    </button>
  );
}
