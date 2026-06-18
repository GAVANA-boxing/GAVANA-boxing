"use client";

import { useState } from "react";
import { translate } from "@/lib/i18n";
import { punchIconFromStep } from "@/lib/visualAssets";
import s from "@/components/fighters/fighterStyles";

// ─── Combo step pills ─────────────────────────────────────────────────────────
function ComboSteps({ steps, accent }) {
  return (
    <div style={s.comboSteps}>
      {steps.map((step, i) => {
        const pi = punchIconFromStep(step);
        return (
          <span key={i} style={s.comboStepWrap}>
            <span style={{
              ...s.comboStep,
              display: "inline-flex", alignItems: "center", gap: 5,
              borderColor: `${pi.color}28`,
            }}>
              <span style={{
                fontSize: 7.5, fontWeight: 900, color: pi.color,
                background: `${pi.color}18`, border: `1px solid ${pi.color}28`,
                borderRadius: 3, padding: "1px 4px", letterSpacing: 0.5, lineHeight: 1,
                flexShrink: 0,
              }}>
                {pi.code}
              </span>
              {step}
            </span>
            {i < steps.length - 1 && <span style={s.comboArrow}>›</span>}
          </span>
        );
      })}
    </div>
  );
}

// ─── Interactive Combo Trainer ────────────────────────────────────────────────
// Props: combo { name, steps[] }, acc (accent color string), locale
export default function FighterComboTrainer({ combo, acc, locale }) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const t = (key) => translate(locale, key);

  function start() { setActive(true); setStep(0); setDone(false); }
  function next() {
    if (step < combo.steps.length - 1) { setStep((s) => s + 1); }
    else { setDone(true); setActive(false); }
  }
  function reset() { setActive(false); setStep(0); setDone(false); }

  return (
    <div style={{ ...s.comboCard, borderColor: active ? `${acc}40` : undefined }} className="fighter-combo-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <p style={{ ...s.comboName, color: acc, margin: 0 }}>{combo.name}</p>
        {!active && !done && (
          <button type="button" onClick={start} style={{ fontSize: 9, fontWeight: 900, color: acc, background: `${acc}18`, border: `1px solid ${acc}35`, borderRadius: 20, padding: "3px 10px", cursor: "pointer" }}>
            {t("comboTrainerPractice")}
          </button>
        )}
        {done && (
          <button type="button" onClick={reset} style={{ fontSize: 9, fontWeight: 900, color: "#34D399", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 20, padding: "3px 10px", cursor: "pointer" }}>
            {t("comboTrainerAgain")}
          </button>
        )}
      </div>

      {!active && !done && <ComboSteps steps={combo.steps} accent={acc} />}

      {active && (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, marginBottom: 8 }}>
            {step + 1} / {combo.steps.length}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: acc, marginBottom: 14, lineHeight: 1.1 }}>
            {combo.steps[step]}
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {combo.steps.map((_, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= step ? acc : "rgba(255,255,255,0.12)" }} />
            ))}
          </div>
          <button type="button" onClick={next} style={{ marginTop: 14, padding: "9px 28px", borderRadius: 12, background: acc, border: "none", color: "#000", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
            {step < combo.steps.length - 1 ? t("comboTrainerNext") : t("comboTrainerDone")}
          </button>
        </div>
      )}

      {done && (
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <div style={{ fontSize: 18, marginBottom: 4 }}>✅</div>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#34D399" }}>
            {t("comboTrainerComplete")}
          </div>
        </div>
      )}
    </div>
  );
}
