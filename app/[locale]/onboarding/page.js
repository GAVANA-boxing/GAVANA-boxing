"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import EmptyState from "@/components/EmptyState";
import { RED, GOLD, redAlpha } from "@/lib/tokens";
import s from "@/components/onboarding/onboardingStyles";
import { WEIGHT_CLASSES, ARCHETYPE_DESCS, TOTAL_STEPS, WEEKLY_GOALS } from "@/lib/onboardingConstants";
import { useOnboardingActions } from "@/hooks/useOnboardingActions";
import Image from "next/image";

export default function OnboardingPage() {
  const pathname     = usePathname();
  const locale       = getLocaleFromPathname(pathname);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Preserve original challenge/reel deep-link through onboarding
  const rawRedirect    = searchParams.get("redirect") || "";
  const redirectAfter  = rawRedirect.startsWith(`/${locale}/`) ? rawRedirect : null;

  const t = (key) => translate(locale, key);

  const {
    showIntro, handleIntroNext,
    step, setStep,
    role,
    archetype, setArchetype,
    weightClass, setWeightClass,
    weeklyGoal, setWeeklyGoal,
    saving,
    animDir,
    gyms,
    gymsLoading,
    requestedGymId,
    joining,
    goTo,
    handleRoleNext,
    handleStep1Next,
    handleStep2Next,
    handleJoinGym,
    finishOnboarding,
  } = useOnboardingActions({ user, locale, router });

  const INTRO_CARDS = [
    {
      value: "train",
      emoji: "🥊",
      label: locale === "mn" ? "AI-тай дасгал" : locale === "ko" ? "AI로 훈련하기" : "Train With AI",
      desc: locale === "mn" ? "Хурд, хүч, техникийг бодит цаг дотор хэмж" : locale === "ko" ? "속도, 파워, 기술을 실시간으로 측정" : "Measure your speed, power & technique in real time",
    },
    {
      value: "learn",
      emoji: "🎓",
      label: locale === "mn" ? "Боксын академи" : locale === "ko" ? "복싱 배우기" : "Learn Boxing",
      desc: locale === "mn" ? "Чемпионуудын нэрт техникийг судлах" : locale === "ko" ? "챔피언의 기술을 체계적으로 배우기" : "Study the techniques of legendary champions",
    },
    {
      value: "sparring",
      emoji: "⚔️",
      label: locale === "mn" ? "Спарринг хайх" : locale === "ko" ? "스파링 찾기" : "Find Sparring",
      desc: locale === "mn" ? "Ойр орчмын ижил түвшний тулаанч олох" : locale === "ko" ? "근처의 같은 수준 파이터 찾기" : "Connect with fighters at your level nearby",
    },
    {
      value: "watch",
      emoji: "📱",
      label: locale === "mn" ? "Тулаанчдыг дагах" : locale === "ko" ? "파이터 보기" : "Watch Fighters",
      desc: locale === "mn" ? "Тулаанчдын бичлэг, сорилтыг үзэх" : locale === "ko" ? "파이터들의 영상과 챌린지 보기" : "Watch training reels, challenges & breakdowns",
    },
  ];

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  if (authLoading || !user) {
    return <div style={s.loading}>…</div>;
  }

  const archetypeArch = archetype ? ARCHETYPE_DISPLAY[archetype] : null;
  const selectedGoal = WEEKLY_GOALS.find((g) => g.value === weeklyGoal);

  // Progress: step maps to visual segment
  const visualStep = role === "fighter" ? step : step === 4 ? 4 : 0;
  const progressFilled = role === "fighter"
    ? step
    : step >= 4 ? TOTAL_STEPS - 1 : 0;

  // ── Intro screen: show app value before profile building ──────────────────
  if (showIntro) {
    return (
      <div style={s.page}>
        <div style={s.bgGlow} />
        <div style={{ ...s.inner, paddingTop: 40 }} className="ob-step">
          <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.ob-step{animation:slideIn 0.3s ease forwards}`}</style>
          <div style={s.header}>
            <p style={s.kicker}>GAVANA</p>
            <h1 style={s.title}>
              {locale === "mn" ? "Юу хийхийг хүсч байна вэ?" : locale === "ko" ? "무엇을 하고 싶으신가요?" : "What brings you here?"}
            </h1>
            <p style={s.subtitle}>
              {locale === "mn" ? "Таны туршлагыг тохируулна. Дараа нь бүгдийг хийж болно." : locale === "ko" ? "경험을 맞춤 설정합니다. 나중에 모든 걸 할 수 있어요." : "Personalizes your experience. You can do everything later."}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {INTRO_CARDS.map((card) => (
              <button
                key={card.value}
                type="button"
                onClick={() => handleIntroNext(card.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "16px 18px", borderRadius: 16, cursor: "pointer",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  textAlign: "left", width: "100%",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 30, flexShrink: 0, lineHeight: 1, width: 40, textAlign: "center" }}>{card.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 2 }}>{card.label}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.35 }}>{card.desc}</div>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(${animDir > 0 ? "32px" : "-32px"}); } to { opacity: 1; transform: translateX(0); } }
        @keyframes welcomePop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .ob-step { animation: slideIn 0.28s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
      `}</style>

      {/* Background glow */}
      <div style={s.bgGlow} />

      {/* Progress bar */}
      <div style={s.progressWrap}>
        <div style={s.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, n) => (
            <div
              key={n}
              style={{
                ...s.progressSeg,
                background: n < (role === "fighter" ? step : step >= 4 ? TOTAL_STEPS : 0)
                  ? RED
                  : "rgba(255,255,255,0.1)",
                boxShadow: n === (role === "fighter" ? step - 1 : step >= 4 ? TOTAL_STEPS - 1 : -1)
                  ? `0 0 10px ${redAlpha(0.6)}`
                  : "none",
              }}
            />
          ))}
        </div>
      </div>

      <div style={s.inner}>

        {/* ── STEP 0: Role Selection ── */}
        {step === 0 && (
          <div className="ob-step">
            <div style={s.header}>
              <p style={s.kicker}>GAVANA</p>
              <h1 style={s.title}>
                {t("onboardingWhoAreYou")}
              </h1>
              <p style={s.subtitle}>
                {t("onboardingChooseRole")}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {[
                { key: "fighter", emoji: "🥊", label: t("onboardingRoleFighterLabel"), desc: t("onboardingRoleFighterDesc") },
                { key: "coach", emoji: "🎓", label: t("onboardingRoleCoachLabel"), desc: t("onboardingRoleCoachDesc") },
                { key: "gym", emoji: "🏋️", label: t("onboardingRoleGymLabel"), desc: t("onboardingRoleGymDesc") },
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  disabled={saving}
                  onClick={() => handleRoleNext(r.key)}
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
        )}

        {/* ── STEP 1: Fighter Archetype ── */}
        {step === 1 && (
          <div className="ob-step">
            <div style={s.header}>
              <p style={s.kicker}>COMBAT · FIGHTER</p>
              <h1 style={s.title}>
                {t("onboardingFighterStyle")}
              </h1>
              <p style={s.subtitle}>
                {t("onboardingChooseArchetype")}
              </p>
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
                <option value="">
                  {t("onboardingSelectWeight")}
                </option>
                {WEIGHT_CLASSES.map((wc) => <option key={wc} value={wc}>{wc}</option>)}
              </select>
            </div>

            <button
              type="button"
              style={archetype ? s.primaryBtn : s.primaryBtnDisabled}
              disabled={!archetype || saving}
              onClick={handleStep1Next}
            >
              {saving ? "…" : t("onboardingContinue")}
            </button>
          </div>
        )}

        {/* ── STEP 2: Weekly Training Goal ── */}
        {step === 2 && (
          <div className="ob-step">
            <div style={s.header}>
              <p style={s.kicker}>COMBAT · FIGHTER</p>
              <h1 style={s.title}>
                {t("onboardingWeeklyGoal")}
              </h1>
              <p style={s.subtitle}>
                {t("onboardingWeeklyDesc")}
              </p>
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
              onClick={handleStep2Next}
            >
              {saving ? "…" : t("onboardingContinue")}
            </button>
          </div>
        )}

        {/* ── STEP 3: Find Your Gym ── */}
        {step === 3 && (
          <div className="ob-step">
            <div style={s.header}>
              <p style={s.kicker}>COMBAT · FIGHTER</p>
              <h1 style={s.title}>
                {t("onboardingFindGym")}
              </h1>
              <p style={s.subtitle}>
                {t("onboardingGymDesc")}
              </p>
            </div>

            {requestedGymId && (
              <div style={s.successBanner}>
                ✓ {t("onboardingJoinSent")}
              </div>
            )}

            {gymsLoading ? (
              <div style={s.gymList}>
                {[0, 1, 2].map((i) => <div key={i} style={s.gymSkeleton} />)}
              </div>
            ) : gyms.length === 0 ? (
              <EmptyState emoji="🏋️" title={t("onboardingNoGyms")} />
            ) : (
              <div style={s.gymList}>
                {gyms.map((gym) => {
                  const isRequested = requestedGymId === gym.id;
                  return (
                    <div key={gym.id} style={s.gymCard}>
                      <div style={s.gymCardLeft}>
                        {gym.logo ? (
                          <Image src={gym.logo} alt="" width={40} height={40} style={{ borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                        ) : (
                          <div style={s.gymLogoFallback}>🥊</div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <p style={s.gymName}>{gym.gymName}</p>
                          <p style={s.gymMeta}>{[gym.gymType, gym.city].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!!requestedGymId || joining === gym.id}
                        onClick={() => handleJoinGym(gym)}
                        style={isRequested ? s.joinedBtn : requestedGymId ? s.joinBtnDisabled : s.joinBtn}
                      >
                        {isRequested ? "✓" : joining === gym.id ? "…" : t("onboardingJoin")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={s.actionRow}>
              <button type="button" style={s.skipBtn} onClick={() => goTo(4)}>
                {t("onboardingSkip")}
              </button>
              <button type="button" style={{ ...s.primaryBtn, flex: 2 }} onClick={() => goTo(4)}>
                {t("onboardingNext")}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Welcome ── */}
        {step === 4 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ ...s.welcomeEmoji, animation: "welcomePop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards" }}>
              {role === "coach" ? "🎓" : role === "gym" ? "🏋️" : archetypeArch?.emoji || "🥊"}
            </div>
            <div style={{ animation: "fadeUp 0.5s ease 0.3s both" }}>
              <p style={s.kicker}>GAVANA</p>
              <h1 style={s.title}>
                {t("onboardingWelcome")}
              </h1>
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

              {/* Weekly goal confirmation */}
              {role === "fighter" && selectedGoal && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10, padding: "8px 16px", borderRadius: 999, background: `${redAlpha(0.1)}`, border: `1px solid ${redAlpha(0.25)}` }}>
                  <span>{selectedGoal.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>
                    {locale === "mn" ? `${selectedGoal.labelMn} дасгал` : locale === "ko" ? `${selectedGoal.labelKo} 훈련` : `${selectedGoal.labelEn} training`}
                  </span>
                </div>
              )}

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
                    <button type="button" style={s.primaryBtn} disabled={saving} onClick={() => finishOnboarding(`/${locale}/coach/dashboard`)}>
                      🎓 {t("onboardingGoToCoachDash")}
                    </button>
                    <button type="button" style={s.ghostBtn} disabled={saving} onClick={() => finishOnboarding(`/${locale}/reels`)}>
                      {t("onboardingBrowseReels")}
                    </button>
                  </>
                ) : role === "gym" ? (
                  <>
                    <button type="button" style={s.primaryBtn} disabled={saving} onClick={() => finishOnboarding(`/${locale}/gyms/dashboard`)}>
                      🏋️ {t("onboardingRegisterGym")}
                    </button>
                    <button type="button" style={s.ghostBtn} disabled={saving} onClick={() => finishOnboarding(`/${locale}/reels`)}>
                      {t("onboardingBrowseReels")}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" style={s.primaryBtn} disabled={saving} onClick={() => finishOnboarding(redirectAfter || null)}>
                      🥊 {t("onboardingStartTraining")}
                    </button>
                    {!redirectAfter && (
                      <button type="button" style={s.ghostBtn} disabled={saving} onClick={() => finishOnboarding(`/${locale}/reels`)}>
                        {t("onboardingBrowseReels")}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

