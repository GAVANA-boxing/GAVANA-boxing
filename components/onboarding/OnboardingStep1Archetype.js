"use client";

import { ARCHETYPE_DISPLAY, ARCHETYPE_DESCS, archetypeName, normalizeArchetype } from "@/lib/archetypes";
import { WEIGHT_CLASSES } from "@/lib/onboardingConstants";
import s from "@/components/onboarding/onboardingStyles";
import StancePhotoCheck from "@/components/onboarding/StancePhotoCheck";

export default function OnboardingStep1Archetype({
  locale,
  t,
  archetype,
  setArchetype,
  stance,
  setStance,
  weightClass,
  setWeightClass,
  saving,
  onNext,
}) {
  const L = (mn, ko, en) => (locale === "mn" ? mn : locale === "ko" ? ko : en);
  return (
    <div className="ob-step">
      <div style={s.header}>
        <p style={s.kicker}>{L("Тулаанчийн профайл", "파이터 프로필", "Fighter profile")}</p>
        <h1 style={s.title}>{L("Чиний байрлал", "나의 스탠스", "Your stance")}</h1>
        <p style={s.subtitle}>{L("Jab, cross-оо зөв тоолуулахын тулд", "잽과 크로스를 정확히 세기 위해", "So your jabs and crosses are counted right")}</p>
        <div style={s.valueHint}>
          <span style={{ fontSize: 13 }}>🤖</span>
          <span>{t("onboardingArchetypeHint")}</span>
        </div>
      </div>

      {/* Stance — required: it decides which hand is the jab */}
      <div style={{ marginBottom: 22 }}>
        <label style={s.fieldLabel}>{L("Аль хөл чинь урдаа вэ?", "어느 발이 앞인가요?", "Which foot is forward?")}</label>
        <div role="radiogroup" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
          {[
            ["orthodox", L("Зүүн хөл", "왼발", "Left foot"), L("Orthodox · jab = зүүн гар", "오소독스 · 잽 = 왼손", "Orthodox · jab = left hand")],
            ["southpaw", L("Баруун хөл", "오른발", "Right foot"), L("Southpaw · jab = баруун гар", "사우스포 · 잽 = 오른손", "Southpaw · jab = right hand")],
          ].map(([key, title, sub]) => {
            const on = stance === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setStance(key)}
                style={{
                  padding: "14px 12px", borderRadius: 16, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  border: on ? "2px solid #FF3B30" : "2px solid rgba(255,255,255,0.08)",
                  background: on ? "rgba(255,59,48,0.10)" : "rgba(255,255,255,0.03)",
                  color: "#fff",
                }}
              >
                <span style={{ display: "block", fontSize: 16, fontWeight: 700 }}>{title}</span>
                <span style={{ display: "block", marginTop: 4, fontSize: 12.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.35 }}>{sub}</span>
              </button>
            );
          })}
        </div>
        <StancePhotoCheck locale={locale} onStance={setStance} />
      </div>

      <label style={{ ...s.fieldLabel, display: "block", marginBottom: 8 }}>
        {L("Тулааны хэв маяг", "파이팅 스타일", "Fighting style")}
        <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400, marginLeft: 6 }}>
          {L("заавал биш — Fighter DNA раундаас олно", "선택 — Fighter DNA가 라운드로 찾아요", "optional — Fighter DNA finds it from your rounds")}
        </span>
      </label>
      <div style={s.archetypeGrid}>
        {Object.entries(ARCHETYPE_DISPLAY).map(([key, arch]) => {
          const desc = ARCHETYPE_DESCS[key];
          const isSelected = normalizeArchetype(archetype) === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setArchetype(isSelected ? null : key)}
              style={{
                ...s.archetypeCard,
                border: isSelected ? `2px solid ${arch.color}` : "2px solid rgba(255,255,255,0.08)",
                background: isSelected ? `${arch.color}14` : "rgba(255,255,255,0.03)",
                boxShadow: isSelected ? `0 0 28px ${arch.color}28` : "none",
              }}
            >
              <span style={s.archetypeEmoji}>{arch.emoji}</span>
              <span style={{ ...s.archetypeName, color: isSelected ? arch.color : "#fff" }}>
                {archetypeName(key, locale)}
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
        style={stance ? s.primaryBtn : s.primaryBtnDisabled}
        disabled={!stance || saving}
        onClick={onNext}
      >
        {saving ? "…" : t("onboardingContinue")}
      </button>
    </div>
  );
}
