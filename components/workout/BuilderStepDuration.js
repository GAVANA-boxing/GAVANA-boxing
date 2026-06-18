"use client";

import { RED, redAlpha } from "@/lib/tokens";
import { DURATION_OPTIONS } from "./builderConstants";

const s = {
  stepWrap: { display: "flex", flexDirection: "column", gap: 0 },
  stepLabel: { margin: "0 0 18px", fontSize: 17, fontWeight: 900, color: "#fff" },
  durationGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 24,
  },
  durationCard: {
    padding: "18px 12px",
    borderRadius: 14,
    border: "1.5px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  durationCardActive: {
    border: `1.5px solid ${redAlpha(0.7)}`,
    background: `${redAlpha(0.1)}`,
    boxShadow: `0 0 0 1px ${redAlpha(0.2)}`,
  },
  durationValue: { fontSize: 28, fontWeight: 1000, color: "#fff" },
  durationUnit: { fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700 },
  generateBtn: {
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
  generateBtnDisabled: {
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
  errorText: { margin: "10px 0 0", fontSize: 12, color: "#F87171", textAlign: "center" },
};

/**
 * @param {{
 *   duration: number,
 *   onDurationChange: (val: number) => void,
 *   generating: boolean,
 *   error: string,
 *   onGenerate: () => void,
 *   stepLabel: string,
 *   minUnit: string,
 *   generateLabel: string,
 *   generatingLabel: string,
 * }} props
 */
export default function BuilderStepDuration({
  duration,
  onDurationChange,
  generating,
  error,
  onGenerate,
  stepLabel,
  minUnit,
  generateLabel,
  generatingLabel,
}) {
  return (
    <div style={s.stepWrap}>
      <p style={s.stepLabel}>{stepLabel}</p>
      <div style={s.durationGrid}>
        {DURATION_OPTIONS.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => onDurationChange(d.value)}
            style={{
              ...s.durationCard,
              ...(duration === d.value ? s.durationCardActive : {}),
            }}
          >
            <span style={s.durationValue}>{d.value}</span>
            <span style={s.durationUnit}>{minUnit}</span>
          </button>
        ))}
      </div>

      {error && <p style={s.errorText}>{error}</p>}

      <button
        type="button"
        style={generating ? s.generateBtnDisabled : s.generateBtn}
        disabled={generating}
        onClick={onGenerate}
      >
        {generating ? generatingLabel : generateLabel}
      </button>
    </div>
  );
}
