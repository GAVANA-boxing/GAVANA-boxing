"use client";

import styles from "@/components/creator/creatorDashboardStyles";
import ReelRow from "@/components/creator/ReelRow";
import EmptyState from "@/components/EmptyState";

/**
 * @param {{
 *   t: (key: string) => string,
 *   locale: string,
 *   router: import("next/navigation").AppRouterInstance,
 *   reelsByViews: object[],
 *   reelStats: Record<string, object>,
 *   maxViews: number,
 * }} props
 */
export default function CreatorReelsTab({ t, locale, router, reelsByViews, reelStats, maxViews }) {
  if (reelsByViews.length === 0) {
    return (
      <EmptyState
        title={t("creatorNoReels")}
        action={
          <button type="button" style={styles.uploadBtn} onClick={() => router.push(`/${locale}/upload`)}>
            {t("creatorGoUpload")}
          </button>
        }
      />
    );
  }

  return (
    <>
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>📈 {t("creatorPerformance")} · {reelsByViews.length} reels</h2>
        <div style={styles.reelList}>
          {reelsByViews.map((reel, i) => (
            <ReelRow
              key={reel.id}
              reel={reel}
              stats={reelStats[reel.id]}
              rank={i + 1}
              maxViews={maxViews}
              t={t}
              locale={locale}
              router={router}
            />
          ))}
        </div>
      </section>

      <button type="button" style={styles.uploadBtn} onClick={() => router.push(`/${locale}/upload`)}>
        + {t("creatorUploadNew")}
      </button>
    </>
  );
}
