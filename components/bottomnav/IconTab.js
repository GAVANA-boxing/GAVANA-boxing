"use client";

import { redAlpha, MOTION } from "@/lib/tokens";
import { NavFlashLabel } from "./navFlash";

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
};

/**
 * Icon-only tab. The name is the accessible label and flashes above the icon
 * for ~1 s after a tap (`showLabel`, see navFlash.js).
 * @param {{ active: boolean, onClick: () => void, children: React.ReactNode, label: string, showLabel?: boolean }} props
 */
export default function IconTab({ active, onClick, children, label, showLabel = false }) {
  return (
    <button type="button" onClick={onClick} style={s.iconTab} aria-label={label} className="tap-bounce">
      <span style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
        {showLabel && <NavFlashLabel text={label} />}
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
        <span aria-hidden="true" style={{ width: 4, height: 4, borderRadius: 2, marginTop: 4, background: active ? "#FF3B30" : "transparent", transition: "background 160ms ease" }} />
      </span>
    </button>
  );
}
