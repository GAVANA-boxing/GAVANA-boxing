"use client";

import BottomNav from "@/components/BottomNav";
import styles from "@/components/reels/reelStyles";

/**
 * Full-screen cinematic loading state shown while auth or reel feed is loading.
 *
 * Props:
 *   router        — Next.js router
 *   user          — current auth user (may be null)
 *   currentLocale — locale string
 *   t             — translate(key) helper
 *   authLoading   — true when auth check is still in progress
 */
export default function ReelsLoadingScreen({ router, user, currentLocale, t, authLoading }) {
  return (
    <div style={styles.container}>
      <div style={styles.loadingCinematic}>
        <div style={styles.loadingOrb} />
        <div className="reel-skeleton" style={styles.skeletonBack} />
        <div className="reel-skeleton" style={styles.skeletonMid} />
        <div className="reel-skeleton" style={styles.skeletonFront} />
        <div style={styles.loadingStatus}>
          <div style={styles.spinner} />
          <div style={styles.loadingTitle}>{t("loadingReels")}</div>
          <div style={styles.loadingMeta}>
            {authLoading ? t("checkingSession") : t("fetchingFeed")}
          </div>
        </div>
      </div>
      <BottomNav router={router} user={user} currentLocale={currentLocale} />
    </div>
  );
}
