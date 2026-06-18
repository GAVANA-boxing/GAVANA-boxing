"use client";

import styles from "@/components/leaderboard/leaderboardStyles";
import { redAlpha } from "@/lib/tokens";
import { formatCountdown } from "@/lib/leaderboardHelpers";

const SOCIAL_GREEN = "rgba(52,211,153,0.12)";
const SOCIAL_GREEN_BORDER = "rgba(52,211,153,0.35)";
const SOCIAL_GREEN_TEXT = "#34D399";

/** Tab ids that the parent manages via `leaderboardTab` state. */
export default function LeaderboardTabs({
  leaderboardTab,
  setLeaderboardTab,
  socialSubTab,
  setSocialSubTab,
  seasonLabel,
  weeklyCountdownMs,
  locale,
  t,
  onFriendsClick,
}) {
  return (
    <div style={styles.tabsWrap}>
      <div style={styles.tabsRow}>
        <button
          type="button"
          style={{ ...styles.tabBtn, ...(leaderboardTab === "week" ? styles.tabBtnActive : {}) }}
          onClick={() => setLeaderboardTab("week")}
        >
          {t("leaderboardTabWeek")}
        </button>
        <button
          type="button"
          style={{ ...styles.tabBtn, ...(leaderboardTab === "alltime" ? styles.tabBtnActive : {}) }}
          onClick={() => setLeaderboardTab("alltime")}
        >
          {t("leaderboardTabAllTime")}
        </button>
        <button
          type="button"
          style={{ ...styles.tabBtn, ...(leaderboardTab === "improvement" ? styles.tabBtnActive : {}) }}
          onClick={() => setLeaderboardTab("improvement")}
        >
          {t("lbImprovement")}
        </button>
        <button
          type="button"
          style={{ ...styles.tabBtn, ...(leaderboardTab === "streak" ? styles.tabBtnActive : {}) }}
          onClick={() => setLeaderboardTab("streak")}
        >
          {t("lbStreak")}
        </button>
        <button
          type="button"
          style={{ ...styles.tabBtn, ...(leaderboardTab === "friends" ? styles.tabBtnActive : {}) }}
          onClick={onFriendsClick}
        >
          {t("friendsLeaderboard")}
        </button>
        <button
          type="button"
          style={{ ...styles.tabBtn, ...(leaderboardTab === "views" ? styles.tabBtnViews : {}) }}
          onClick={() => setLeaderboardTab("views")}
        >
          👁 {t("lbViews")}
        </button>
        <button
          type="button"
          style={{ ...styles.tabBtn, ...(leaderboardTab === "likes" ? styles.tabBtnLikes : {}) }}
          onClick={() => setLeaderboardTab("likes")}
        >
          ❤️ {t("lbLikes")}
        </button>
        <button
          type="button"
          style={{
            ...styles.tabBtn,
            ...(leaderboardTab === "social"
              ? { background: SOCIAL_GREEN, color: SOCIAL_GREEN_TEXT, border: `1px solid ${SOCIAL_GREEN_BORDER}` }
              : {}),
          }}
          onClick={() => setLeaderboardTab("social")}
        >
          🌐 {t("lbSocial")}
        </button>
      </div>

      {/* Social sub-tabs */}
      {leaderboardTab === "social" && (
        <div style={{ display: "flex", gap: 6, padding: "8px 4px 0" }}>
          {[
            { key: "active",     label: t("lbSocialActive"),    icon: "🔥" },
            { key: "responders", label: t("lbSocialResponders"), icon: "⚔️" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSocialSubTab(key)}
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 800,
                border: socialSubTab === key
                  ? "1px solid rgba(52,211,153,0.5)"
                  : "1px solid rgba(255,255,255,0.1)",
                background: socialSubTab === key ? SOCIAL_GREEN : "transparent",
                color: socialSubTab === key ? SOCIAL_GREEN_TEXT : "rgba(255,255,255,0.45)",
                cursor: "pointer",
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      )}

      {/* Week reset countdown */}
      {leaderboardTab === "week" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 4px 0" }}>
          <p style={{ ...styles.seasonLabel, margin: 0 }}>{seasonLabel}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, background: redAlpha(0.1), border: `1px solid ${redAlpha(0.25)}` }}>
            <span style={{ fontSize: 10 }}>⏱</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#F87171", letterSpacing: 0.3 }}>
              {t("lbResets")}
              {weeklyCountdownMs !== null ? formatCountdown(weeklyCountdownMs, locale) : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
