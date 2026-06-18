"use client";

import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import { WEIGHT_CLASSES, ARCHETYPE_DESCS } from "@/lib/onboardingConstants";
import s from "@/components/onboarding/onboardingStyles";

export default function OnboardingStep1Archetype({
  locale,
  t,
  archetype,
  setArchetype,
  weightClass,
  setWeightClass,
  saving,
  onNext,
}) {
  return (
    <div className="ob-step">
      <div style={s.header}>
        <p style={s.kicker}>COMBAT · FIGHTER</p>
        <h1 style={s.title}>{t("onboardingFighterStyle")}</h1>
        <p style={s.subtitle}>{t("onboardingChooseArchetype")}</p>
      </div>

      <div style={s.archetypeGrid}>
        {Object.entries(ARCHETYPE_DISPLAY).map(([key, arch]) => {
          const desc = ARCHETYPE_DESCS[key];
          const isSelected = archetype === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setArchetype(key)}
              style={{
                ...s.archetypeCard,
                border: isSelected ? `2px solid ${arch.color}` : "2px solid rgba(255,255,255,0.08)",
                background: isSelected ? `${arch.color}14` : "rgba(255,255,255,0.03)",
                boxShadow: isSelected ? `0 0 28px ${arch.color}28` : "none",
              }}
            >
              <span style={s.archetypeEmoji}>{arch.emoji}</span>
              <span style={{ ...s.archetypeName, color: isSelected ? arch.color : "#fff" }}>
                {arch.name}
              </span>
              <span style={s.archetypeDesc}>{desc[locale] || desc.en}</span>
              {isSelected && (
                <div style={{ ...s.selectedDot, background: arch.color }} />
              )}
            </button>
          );
        })}
      </div>

      <div style={s.weightSection}>
        <label style={s.fieldLabel}>
          {t("onboardingWeightClass")}
          <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400, marginLeft: 6 }}>
            {t("onboardingOptional")}
          </span>
        </label>
        <select value={weightClass} onChange={(e) => setWeightClass(e.target.value)} style={s.select}>
          <option value="">{t("onboardingSelectWeight")}</option>
          {WEIGHT_CLASSES.map((wc) => <option key={wc} value={wc}>{wc}</option>)}
        </select>
      </div>

      <button
        type="button"
        style={archetype ? s.primaryBtn : s.primaryBtnDisabled}
        disabled={!archetype || saving}
        onClick={onNext}
      >
        {saving ? "…" : t("onboardingContinue")}
      </button>
    </div>
  );
}
