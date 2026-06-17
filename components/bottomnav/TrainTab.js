"use client";

import { RED, RED_DARK, redAlpha, MOTION } from "@/lib/tokens";
import { loc } from "@/lib/loc";
import { TrainIcon } from "./NavIcons";

const s = {
  trainTab: {
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
  trainCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: `box-shadow ${MOTION.hover}, transform ${MOTION.press}`,
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
 * @param {{ onClick: () => void, active: boolean, locale: string }} props
 */
export default function TrainTab({ onClick, active, locale }) {
  const label = loc(locale, "Дасгал", "훈련", "Train");
  return (
    <button type="button" onClick={onClick} style={s.trainTab} aria-label={label} className="tap-bounce btn-press">
      <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span
          style={{
            ...s.trainCircle,
            boxShadow: active
              ? `0 4px 24px ${redAlpha(0.6)}, inset 0 1px 0 rgba(255,255,255,0.18)`
              : `0 4px 16px ${redAlpha(0.32)}, inset 0 1px 0 rgba(255,255,255,0.12)`,
          }}
          className="plus-ambient"
        >
          <TrainIcon />
        </span>
        <span style={{ ...s.tabLabel, color: active ? "#fff" : "rgba(255,255,255,0.5)" }}>{label}</span>
      </span>
    </button>
  );
}
