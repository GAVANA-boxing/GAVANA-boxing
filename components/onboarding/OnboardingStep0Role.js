"use client";

import s from "@/components/onboarding/onboardingStyles";

export default function OnboardingStep0Role({ t, saving, onRoleNext }) {
  const roles = [
    { key: "fighter", emoji: "🥊", label: t("onboardingRoleFighterLabel"), desc: t("onboardingRoleFighterDesc") },
    { key: "coach",   emoji: "🎓", label: t("onboardingRoleCoachLabel"),   desc: t("onboardingRoleCoachDesc") },
    { key: "gym",     emoji: "🏋️", label: t("onboardingRoleGymLabel"),     desc: t("onboardingRoleGymDesc") },
  ];

  return (
    <div className="ob-step">
      <div style={s.header}>
        <p style={s.kicker}>GAVANA</p>
        <h1 style={s.title}>{t("onboardingWhoAreYou")}</h1>
        <p style={s.subtitle}>{t("onboardingChooseRole")}</p>
        <div style={s.valueHint}>
          <span style={{ fontSize: 13 }}>💡</span>
          <span>{t("onboardingRoleHint")}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {roles.map((r) => (
          <button
            key={r.key}
            type="button"
            disabled={saving}
            onClick={() => onRoleNext(r.key)}
            style={s.roleCard}
          >
            <span style={{ fontSize: 36, flexShrink: 0 }}>{r.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 3 }}>{r.label}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{r.desc}</div>
            </div>
            <span style={{ fontSize: 20, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
