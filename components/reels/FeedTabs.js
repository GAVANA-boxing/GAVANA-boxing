"use client";

import { GOLD, goldAlpha } from "@/lib/tokens";
import styles from "@/components/reels/reelStyles";

/**
 * For You / Following / Filter tab bar at the top of the mobile reels feed.
 *
 * Props:
 *   feedMode          — "forYou" | "following"
 *   setFeedMode       — state setter
 *   diffFilter        — current difficulty filter value
 *   ctFilter          — current content-type filter value
 *   user              — auth user (null if logged out)
 *   router            — Next.js router
 *   currentLocale     — locale string
 *   t                 — translate(key) helper
 *   setShowFilterSheet — open the FilterSheet
 */
export default function FeedTabs({
  feedMode,
  setFeedMode,
  diffFilter,
  ctFilter,
  user,
  router,
  currentLocale,
  t,
  setShowFilterSheet,
}) {
  const hasActiveFilter = diffFilter !== "all" || ctFilter !== "all";

  return (
    <div style={styles.feedTabs}>
      <button
        type="button"
        onClick={() => setFeedMode("forYou")}
        style={{
          ...styles.feedTab,
          ...(feedMode === "forYou" ? styles.feedTabActive : {}),
        }}
      >
        {t("forYou")}
      </button>

      <button
        type="button"
        onClick={() => {
          if (!user?.uid) {
            router.push(`/${currentLocale}/login`);
            return;
          }
          setFeedMode("following");
        }}
        style={{
          ...styles.feedTab,
          ...(feedMode === "following" ? styles.feedTabActive : {}),
        }}
      >
        {t("following")}
      </button>

      <button
        type="button"
        onClick={() => setShowFilterSheet(true)}
        style={{
          ...styles.feedTab,
          ...(hasActiveFilter
            ? {
                ...styles.feedTabActive,
                color: GOLD,
                background: `${goldAlpha(0.15)}`,
              }
            : {}),
          padding: "4px 9px",
          fontSize: 14,
        }}
        aria-label="Filters"
      >
        {hasActiveFilter ? "●" : "⚙"}
      </button>
    </div>
  );
}
