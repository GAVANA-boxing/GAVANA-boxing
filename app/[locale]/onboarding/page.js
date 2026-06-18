"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { RED, redAlpha } from "@/lib/tokens";
import s from "@/components/onboarding/onboardingStyles";
import { TOTAL_STEPS } from "@/lib/onboardingConstants";
import { useOnboardingActions } from "@/hooks/useOnboardingActions";
import OnboardingIntroScreen from "@/components/onboarding/OnboardingIntroScreen";
import OnboardingStep0Role from "@/components/onboarding/OnboardingStep0Role";
import OnboardingStep1Archetype from "@/components/onboarding/OnboardingStep1Archetype";
import OnboardingStep2WeeklyGoal from "@/components/onboarding/OnboardingStep2WeeklyGoal";
import OnboardingStep3FindGym from "@/components/onboarding/OnboardingStep3FindGym";
import OnboardingStep4Welcome from "@/components/onboarding/OnboardingStep4Welcome";

export default function OnboardingPage() {
  const pathname     = usePathname();
  const locale       = getLocaleFromPathname(pathname);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Preserve original challenge/reel deep-link through onboarding
  const rawRedirect   = searchParams.get("redirect") || "";
  const redirectAfter = rawRedirect.startsWith(`/${locale}/`) ? rawRedirect : null;

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

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  if (authLoading || !user) {
    return <div style={s.loading}>…</div>;
  }

  if (showIntro) {
    return <OnboardingIntroScreen locale={locale} onNext={handleIntroNext} />;
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

        {step === 0 && (
          <OnboardingStep0Role t={t} saving={saving} onRoleNext={handleRoleNext} />
        )}

        {step === 1 && (
          <OnboardingStep1Archetype
            locale={locale}
            t={t}
            archetype={archetype}
            setArchetype={setArchetype}
            weightClass={weightClass}
            setWeightClass={setWeightClass}
            saving={saving}
            onNext={handleStep1Next}
          />
        )}

        {step === 2 && (
          <OnboardingStep2WeeklyGoal
            locale={locale}
            t={t}
            weeklyGoal={weeklyGoal}
            setWeeklyGoal={setWeeklyGoal}
            saving={saving}
            onNext={handleStep2Next}
          />
        )}

        {step === 3 && (
          <OnboardingStep3FindGym
            t={t}
            gyms={gyms}
            gymsLoading={gymsLoading}
            requestedGymId={requestedGymId}
            joining={joining}
            onJoinGym={handleJoinGym}
            onSkip={() => goTo(4)}
            onNext={() => goTo(4)}
          />
        )}

        {step === 4 && (
          <OnboardingStep4Welcome
            locale={locale}
            t={t}
            role={role}
            archetype={archetype}
            weeklyGoal={weeklyGoal}
            saving={saving}
            redirectAfter={redirectAfter}
            onFinish={finishOnboarding}
          />
        )}

      </div>
    </div>
  );
}
