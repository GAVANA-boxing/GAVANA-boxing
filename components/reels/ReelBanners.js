"use client";

import styles from "@/components/reels/reelStyles";

/**
 * ReelBanners
 * Two conditional banners that appear on the active reel:
 *  - PVP source banner (sword icon)
 *  - Profile-source progress card (best / latest / attempts)
 */
export default function ReelBanners({
  reel,
  isActive,
  isPvpSource,
  isProfileSource,
  profileReelProgress,
  t,
}) {
  if (reel.isDemo || !isActive) return null;

  return (
    <>
      {isPvpSource && (
        <div style={styles.pvpSourceBanner}>
          <span style={styles.pvpSourceIcon}>⚔️</span>
          <span style={styles.pvpSourceText}>{t("pvpChallengeBanner")}</span>
        </div>
      )}

      {isProfileSource && (
        <div style={styles.profileProgressCard}>
          <span style={styles.profileProgressTitle}>{t("reelProgressTitle")}</span>
          {profileReelProgress === null ? (
            <span style={{ ...styles.profileProgressEmpty, opacity: 0.4 }}>…</span>
          ) : profileReelProgress.empty ? (
            <span style={styles.profileProgressEmpty}>{t("reelNoAttempts")}</span>
          ) : (
            <div style={styles.profileProgressStats}>
              <div style={styles.profileProgressStat}>
                <span style={styles.profileProgressStatVal}>{profileReelProgress.bestScore?.toFixed(1)}</span>
                <span style={styles.profileProgressStatLbl}>{t("best")}</span>
              </div>
              <div style={styles.profileProgressDivider} />
              <div style={styles.profileProgressStat}>
                <span style={styles.profileProgressStatVal}>{profileReelProgress.latestScore?.toFixed(1)}</span>
                <span style={styles.profileProgressStatLbl}>{t("reelLatestAttempt")}</span>
              </div>
              <div style={styles.profileProgressDivider} />
              <div style={styles.profileProgressStat}>
                <span style={styles.profileProgressStatVal}>{profileReelProgress.attempts}</span>
                <span style={styles.profileProgressStatLbl}>{t("reelAttemptCount")}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
