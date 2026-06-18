"use client";

import { RED, redAlpha } from "@/lib/tokens";
import { GOALS, label } from "./builderConstants";

const s = {
  stepWrap: { display: "flex", flexDirection: "column", gap: 0 },
  stepLabel: { margin: "0 0 18px", fontSize: 17, fontWeight: 900, color: "#fff" },
  goalGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 },
  goalCard: {
    padding: "20px 12px",
    borderRadius: 16,
    border: "1.5px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    transition: "border-color 0.2s",
  },
  goalCardActive: {
    border: `1.5px solid ${redAlpha(0.7)}`,
    background: `${redAlpha(0.1)}`,
    boxShadow: `0 0 0 1px ${redAlpha(0.2)}`,
  },
  goalEmoji: { fontSize: 32 },
  goalLabel: { fontSize: 13, fontWeight: 800, color: "#fff", textAlign: "center" },
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
 *   goal: string|null,
 *   onGoalChange: (key: string) => void,
 *   onNext: () => void,
 *   stepLabel: string,
 *   nextLabel: string,
 * }} props
 */
export default function BuilderStepGoal({
  locale,
  goal,
  onGoalChange,
  onNext,
  stepLabel,
  nextLabel,
}) {
  return (
    <div style={s.stepWrap}>
      <p style={s.stepLabel}>{stepLabel}</p>
      <div style={s.goalGrid}>
        {GOALS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => onGoalChange(g.key)}
            style={{ ...s.goalCard, ...(goal === g.key ? s.goalCardActive : {}) }}
          >
            <span style={s.goalEmoji}>{g.emoji}</span>
            <span style={s.goalLabel}>{label(g, locale)}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        style={goal ? s.nextBtn : s.nextBtnDisabled}
        disabled={!goal}
        onClick={onNext}
      >
        {nextLabel}
      </button>
    </div>
  );
}
