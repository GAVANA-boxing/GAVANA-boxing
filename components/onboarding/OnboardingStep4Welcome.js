"use client";

import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import { WEEKLY_GOALS } from "@/lib/onboardingConstants";
import { GOLD, redAlpha } from "@/lib/tokens";
import s from "@/components/onboarding/onboardingStyles";
import { CORE_MODE } from "@/lib/coreRoutes";

const DIM_COLORS = {
  pressure: "#EF4444", outboxer: "#3B82F6", counter: "#8B5CF6", explosive: "#F59E0B", technician: "#10B981",
};

const DIM_LABELS = {
  en: { pressure: "Pressure", outboxer: "Outboxer", counter: "Counter", explosive: "Explosive", technician: "Technician" },
  mn: { pressure: "Дарамт", outboxer: "Аутбоксер", counter: "Контр", explosive: "Тэсрэлт", technician: "Техник" },
  ko: { pressure: "압박", outboxer: "아웃복서", counter: "카운터", explosive: "폭발력", technician: "기술" },
};

export default function OnboardingStep4Welcome({
  locale,
  t,
  role,
  archetype,
  weeklyGoal,
  saving,
  redirectAfter,
  onFinish,
}) {
  const archetypeArch = archetype ? ARCHETYPE_DISPLAY[archetype] : null;
  const selectedGoal = WEEKLY_GOALS.find((g) => g.value === weeklyGoal);

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ ...s.welcomeEmoji, animation: "welcomePop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards" }}>
        {role === "coach" ? "🎓" : role === "gym" ? "🏋️" : archetypeArch?.emoji || "🥊"}
      </div>
      <div style={{ animation: "fadeUp 0.5s ease 0.3s both" }}>
        <p style={s.kicker}>YOU&rsquo;RE IN</p>
        <h1 style={s.title}>{t("onboardingWelcome")}</h1>

        {role === "coach" && (
          <p style={{ ...s.archetypeNameLarge, color: GOLD }}>🎓 {t("onboardingRoleCoach")}</p>
        )}
        {role === "gym" && (
          <p style={{ ...s.archetypeNameLarge, color: "#34D399" }}>🏋️ {t("onboardingRoleGymLabel")}</p>
        )}
        {role === "fighter" && archetypeArch && (
          <p style={{ ...s.archetypeNameLarge, color: archetypeArch.color }}>
            {archetypeArch.emoji} {archetypeArch.name}
          </p>
        )}

        {role === "fighter" && selectedGoal && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10, padding: "8px 16px", borderRadius: 999, background: `${redAlpha(0.1)}`, border: `1px solid ${redAlpha(0.25)}` }}>
            <span>{selectedGoal.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>
              {locale === "mn" ? `${selectedGoal.labelMn} дасгал` : locale === "ko" ? `${selectedGoal.labelKo} 훈련` : `${selectedGoal.labelEn} training`}
            </span>
          </div>
        )}

        {role === "fighter" && archetypeArch && (() => {
          // No numbers yet: the real DNA is measured from the first 3 rounds.
          const dims = DIM_LABELS[locale] || DIM_LABELS.en;
          return (
            <div style={{ margin: "14px auto 0", padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", maxWidth: 320 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: 10, textAlign: "left" }}>
                🧬 {locale === "mn" ? "ТАНЫ ДНХ ХЭМЖИГДЭНЭ" : locale === "ko" ? "측정될 DNA" : "YOUR DNA WILL MEASURE"}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.keys(DIM_COLORS).map((dim) => (
                  <span key={dim} style={{ padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800, color: DIM_COLORS[dim], border: `1px solid ${DIM_COLORS[dim]}55` }}>{dims[dim]}</span>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8, textAlign: "center" }}>
                {locale === "mn" ? "Эхний 3 бэлтгэлийн дараа камерын хэмжилтээр гарна" : locale === "ko" ? "첫 3번의 훈련 후 카메라 측정으로 나타납니다" : "Shows after your first 3 rounds, from camera measurements"}
              </div>
            </div>
          );
        })()}

        <p style={{ ...s.subtitle, marginTop: 12 }}>
          {role === "coach"
            ? t("onboardingWelcomeCoachDesc")
            : role === "gym"
            ? t("onboardingWelcomeGymDesc")
            : t("onboardingWelcomeFighterDesc")}
        </p>

        <div style={s.ctaGroup}>
          {role === "coach" ? (
            <>
              <button type="button" style={s.primaryBtn} disabled={saving} onClick={() => onFinish(`/${locale}/coach/dashboard`)}>
                🎓 {t("onboardingGoToCoachDash")}
              </button>
              <button type="button" style={s.ghostBtn} disabled={saving} onClick={() => onFinish(`/${locale}/${CORE_MODE ? "home" : "reels"}`)}>
                {t("onboardingBrowseReels")}
              </button>
            </>
          ) : role === "gym" ? (
            <>
              <button type="button" style={s.primaryBtn} disabled={saving} onClick={() => onFinish(`/${locale}/gyms/dashboard`)}>
                🏋️ {t("onboardingRegisterGym")}
              </button>
              <button type="button" style={s.ghostBtn} disabled={saving} onClick={() => onFinish(`/${locale}/${CORE_MODE ? "home" : "reels"}`)}>
                {t("onboardingBrowseReels")}
              </button>
            </>
          ) : (
            <>
              <button type="button" style={s.primaryBtn} disabled={saving} onClick={() => onFinish(redirectAfter || null)}>
                🥊 {t("onboardingStartTraining")}
              </button>
              {!redirectAfter && !CORE_MODE && (
                <button type="button" style={s.ghostBtn} disabled={saving} onClick={() => onFinish(`/${locale}/${CORE_MODE ? "home" : "reels"}`)}>
                  {t("onboardingBrowseReels")}
                </button>
              )}
            </>
          )}
        </div>

        <p style={{ margin: "16px 0 0", fontSize: 11, color: "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: 1.6 }}>
          {locale === "mn"
            ? "Үргэлжлүүлэхдээ та манай "
            : locale === "ko"
            ? "계속하면 "
            : "By continuing you agree to our "}
          <a href={`/${locale}/terms`} style={{ color: "rgba(255,255,255,0.75)", textDecoration: "underline" }}>
            {locale === "mn" ? "Үйлчилгээний нөхцөл" : locale === "ko" ? "이용약관" : "Terms of Service"}
          </a>
          {locale === "mn" ? " болон " : locale === "ko" ? " 및 " : " and "}
          <a href={`/${locale}/privacy`} style={{ color: "rgba(255,255,255,0.75)", textDecoration: "underline" }}>
            {locale === "mn" ? "Нууцлалын бодлого" : locale === "ko" ? "개인정보처리방침" : "Privacy Policy"}
          </a>
          {locale === "mn" ? "-г зөвшөөрч байна." : locale === "ko" ? "에 동의합니다." : "."}
        </p>
      </div>
    </div>
  );
}
