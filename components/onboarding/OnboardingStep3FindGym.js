"use client";

import Image from "next/image";
import EmptyState from "@/components/EmptyState";
import s from "@/components/onboarding/onboardingStyles";

export default function OnboardingStep3FindGym({
  t,
  gyms,
  gymsLoading,
  requestedGymId,
  joining,
  onJoinGym,
  onSkip,
  onNext,
}) {
  return (
    <div className="ob-step">
      <div style={s.header}>
        <p style={s.kicker}>OPTIONAL</p>
        <h1 style={s.title}>{t("onboardingFindGym")}</h1>
        <p style={s.subtitle}>{t("onboardingGymDesc")}</p>
        <div style={s.valueHint}>
          <span style={{ fontSize: 13 }}>🏆</span>
          <span>{t("onboardingGymHint")}</span>
        </div>
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
                  onClick={() => onJoinGym(gym)}
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
        <button type="button" style={s.skipBtn} onClick={onSkip}>
          {t("onboardingSkipLater")}
        </button>
        <button type="button" style={{ ...s.primaryBtn, flex: 2 }} onClick={onNext}>
          {t("onboardingNext")}
        </button>
      </div>
    </div>
  );
}
