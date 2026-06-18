"use client";

import { WEEKLY_GOALS } from "@/lib/onboardingConstants";
import { RED, redAlpha } from "@/lib/tokens";
import s from "@/components/onboarding/onboardingStyles";

export default function OnboardingStep2WeeklyGoal({
  locale,
  t,
  weeklyGoal,
  setWeeklyGoal,
  saving,
  onNext,
}) {
  return (
    <div className="ob-step">
      <div style={s.header}>
        <p style={s.kicker}>COMBAT · FIGHTER</p>
        <h1 style={s.title}>{t("onboardingWeeklyGoal")}</h1>
        <p style={s.subtitle}>{t("onboardingWeeklyDesc")}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {WEEKLY_GOALS.map((g) => {
          const isSelected = weeklyGoal === g.value;
          return (
            <button
              key={g.value}
              type="button"
              onClick={() => setWeeklyGoal(g.value)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "16px 18px", borderRadius: 16,
                border: isSelected ? `2px solid ${redAlpha(0.6)}` : "2px solid rgba(255,255,255,0.08)",
                background: isSelected ? `${redAlpha(0.12)}` : "rgba(255,255,255,0.03)",
                boxShadow: isSelected ? `0 0 20px ${redAlpha(0.18)}` : "none",
                cursor: "pointer", textAlign: "left", width: "100%",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{g.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: isSelected ? "#fff" : "rgba(255,255,255,0.85)", marginBottom: 2 }}>
                  {locale === "mn" ? g.labelMn : locale === "ko" ? g.labelKo : g.labelEn}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.35 }}>
                  {locale === "mn" ? g.descMn : locale === "ko" ? g.descKo : g.descEn}
                </div>
              </div>
              {isSelected && (
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        style={weeklyGoal ? s.primaryBtn : s.primaryBtnDisabled}
        disabled={!weeklyGoal || saving}
        onClick={onNext}
      >
        {saving ? "…" : t("onboardingContinue")}
      </button>
    </div>
  );
}
