"use client";

import { RED, RED_DARK, redAlpha, MOTION } from "@/lib/tokens";
import { loc } from "@/lib/loc";
import { TrainIcon } from "./NavIcons";
import { NavFlashLabel } from "./navFlash";

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
};

/**
 * @param {{ onClick: () => void, active: boolean, locale: string, showLabel?: boolean }} props
 */
export default function TrainTab({ onClick, active, locale, showLabel = false }) {
  const label = loc(locale, "Бэлтгэл", "훈련", "Train");
  return (
    <button type="button" onClick={onClick} style={s.trainTab} aria-label={label} className="tap-bounce btn-press">
      <span style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
        {showLabel && <NavFlashLabel text={label} />}
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
      </span>
    </button>
  );
}
