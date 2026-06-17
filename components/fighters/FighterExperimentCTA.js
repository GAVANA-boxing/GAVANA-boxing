"use client";

import { translate } from "@/lib/i18n";

// ─── "Try This Style" experiment CTA / active experiment panel ────────────────
// Props:
//   fighter           — fighter object (id, name, accent)
//   locale            — locale string
//   currentExperiment — object from Firestore or null
//   settingExperiment — boolean (loading state)
//   onStart           — function ()
//   onStop            — function ()
export default function FighterExperimentCTA({ fighter, locale, currentExperiment, settingExperiment, onStart, onStop }) {
  const acc = fighter.accent;
  const t = (key) => translate(locale, key);
  const isThisActive = currentExperiment?.fighterId === fighter.id;
  const isOtherActive = currentExperiment && !isThisActive;

  if (isThisActive) {
    return (
      <div style={{
        marginBottom: 16, padding: "12px 16px", borderRadius: 14,
        background: `${acc}0a`, border: `1px solid ${acc}35`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚗️</span>
          <div>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 2 }}>
              {t("experimentActive")}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
              {t("experimentFocusHint")}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onStop}
          style={{ fontSize: 10, fontWeight: 900, color: "#F87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 8, padding: "5px 11px", cursor: "pointer" }}
        >
          {t("experimentStop")}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onStart}
      disabled={settingExperiment}
      style={{
        width: "100%", marginBottom: 16, padding: "12px 20px", borderRadius: 14,
        background: `${acc}10`, border: `1px solid ${acc}35`, color: acc,
        fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase",
        cursor: settingExperiment ? "wait" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        opacity: settingExperiment ? 0.6 : 1,
      }}
    >
      <span>⚗️</span>
      {isOtherActive ? t("experimentSwitch") : t("experimentCta")}
    </button>
  );
}
