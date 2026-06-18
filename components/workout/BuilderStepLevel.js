"use client";

import { RED, redAlpha } from "@/lib/tokens";
import { LEVELS, DAYS_OPTIONS, label } from "./builderConstants";

const s = {
  stepWrap: { display: "flex", flexDirection: "column", gap: 0 },
  stepLabel: { margin: "0 0 18px", fontSize: 17, fontWeight: 900, color: "#fff" },
  fieldLabel: {
    margin: "0 0 10px",
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  chip: {
    padding: "9px 18px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  chipActive: {
    border: `1px solid ${redAlpha(0.6)}`,
    background: `${redAlpha(0.14)}`,
    color: "#fff",
    fontWeight: 900,
  },
  nextBtn: {
    marginTop: 8,
    width: "100%",
    padding: 15,
    borderRadius: 14,
    border: "none",
    background: `linear-gradient(145deg, ${RED}, #cc2820)`,
    color: "#fff",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: `0 8px 24px ${redAlpha(0.32)}, inset 0 1px 0 rgba(255,255,255,0.1)`,
  },
  nextBtnDisabled: {
    marginTop: 8,
    width: "100%",
    padding: 15,
    borderRadius: 14,
    border: "none",
    background: `${redAlpha(0.25)}`,
    color: "rgba(255,255,255,0.4)",
    fontSize: 15,
    fontWeight: 900,
    cursor: "not-allowed",
  },
};

/**
 * @param {{
 *   locale: string,
 *   level: string|null,
 *   onLevelChange: (key: string) => void,
 *   days: number,
 *   onDaysChange: (d: number) => void,
 *   onNext: () => void,
 *   stepLabel: string,
 *   levelLabel: string,
 *   daysLabel: string,
 *   nextLabel: string,
 * }} props
 */
export default function BuilderStepLevel({
  locale,
  level,
  onLevelChange,
  days,
  onDaysChange,
  onNext,
  stepLabel,
  levelLabel,
  daysLabel,
  nextLabel,
}) {
  return (
    <div style={s.stepWrap}>
      <p style={s.stepLabel}>{stepLabel}</p>

      <p style={s.fieldLabel}>{levelLabel}</p>
      <div style={s.chipRow}>
        {LEVELS.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => onLevelChange(l.key)}
            style={{ ...s.chip, ...(level === l.key ? s.chipActive : {}) }}
          >
            {label(l, locale)}
          </button>
        ))}
      </div>

      <p style={{ ...s.fieldLabel, marginTop: 20 }}>{daysLabel}</p>
      <div style={s.chipRow}>
        {DAYS_OPTIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onDaysChange(d)}
            style={{ ...s.chip, ...(days === d ? s.chipActive : {}) }}
          >
            {d}x
          </button>
        ))}
      </div>

      <button
        type="button"
        style={level ? s.nextBtn : s.nextBtnDisabled}
        disabled={!level}
        onClick={onNext}
      >
        {nextLabel}
      </button>
    </div>
  );
}
