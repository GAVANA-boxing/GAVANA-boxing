"use client";

import styles from "@/components/profile/profilePageStyles";
import { CORE_MODE } from "@/lib/coreRoutes";

/**
 * @param {{
 *   profileTab: string,
 *   isOwnProfile: boolean,
 *   onTabChange: (tab: string) => void,
 *   t: (key: string) => string,
 * }} props
 */
export default function ProfileTabBar({ profileTab, isOwnProfile, onTabChange, t }) {
  // Core mode: posts / saved / battle record are social features that are
  // hidden — progress is the only tab, so no tab bar at all.
  if (CORE_MODE) return null;
  return (
    <div style={styles.profileTabs}>
      <button
        type="button"
        onClick={() => onTabChange("posts")}
        style={{
          ...styles.profileTab,
          ...(profileTab === "posts" ? styles.profileTabActive : {}),
        }}
      >
        {t("postsGrid")}
      </button>
      {isOwnProfile && (
        <button
          type="button"
          onClick={() => onTabChange("saved")}
          style={{
            ...styles.profileTab,
            ...(profileTab === "saved" ? styles.profileTabActive : {}),
          }}
        >
          {t("saved")}
        </button>
      )}
      <button
        type="button"
        onClick={() => onTabChange("progress")}
        style={{
          ...styles.profileTab,
          ...(profileTab === "progress" ? styles.profileTabActive : {}),
        }}
      >
        {t("aiProgress")}
      </button>
      <button
        type="button"
        onClick={() => onTabChange("record")}
        style={{
          ...styles.profileTab,
          ...(profileTab === "record" ? styles.profileTabActive : {}),
        }}
      >
        ⚔️ {t("profileRecordTab")}
      </button>
    </div>
  );
}
