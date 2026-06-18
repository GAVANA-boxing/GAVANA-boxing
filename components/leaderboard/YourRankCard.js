"use client";

import styles from "@/components/leaderboard/leaderboardStyles";
import { RED, GOLD, goldAlpha } from "@/lib/tokens";
import { getScoreColor } from "@/lib/leaderboardHelpers";

/**
 * Displays the current user's rank, score, share button, and gap-to-first info.
 *
 * Props:
 *   leaderboardTab           string
 *   currentUserWeeklyRank    number|null
 *   currentUserAllTimeRank   number|null
 *   currentUserWeeklyEntry   object|null
 *   currentUserAllTimeEntry  object|null
 *   weeklyEntries            array
 *   entries                  array
 *   profiles                 object   – { [userId]: profileData }
 *   userId                   string   – logged-in user's uid
 *   shareCopied              boolean
 *   onShare                  fn
 *   t                        fn
 */
export default function YourRankCard({
  leaderboardTab,
  currentUserWeeklyRank,
  currentUserAllTimeRank,
  currentUserWeeklyEntry,
  currentUserAllTimeEntry,
  weeklyEntries,
  entries,
  profiles,
  userId,
  shareCopied,
  onShare,
  t,
}) {
  const isWeek = leaderboardTab === "week";
  const score = isWeek
    ? (currentUserWeeklyEntry?.bestScore ?? 0)
    : (currentUserAllTimeEntry?.bestScore ?? 0);

  const rankLabel = isWeek
    ? (currentUserWeeklyRank
        ? t("seasonWeeklyRank").replace("{rank}", currentUserWeeklyRank)
        : t("seasonNoResultsThisWeek").split(".")[0])
    : t("leaderboardYourRank").replace("{rank}", currentUserAllTimeRank ?? "—");

  const topEntry = isWeek ? weeklyEntries[0] : entries[0];
  const topScore = topEntry?.bestScore ?? null;
  const userScore = isWeek ? (currentUserWeeklyEntry?.bestScore ?? null) : (currentUserAllTimeEntry?.bestScore ?? null);

  const renderGapRow = () => {
    if (!topEntry || userScore === null || topScore === null) return null;
    if (topEntry.userId === userId) {
      return (
        <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, color: GOLD }}>
          👑 {t("lbYouAreFirst")}
        </div>
      );
    }
    const gap = Math.max(0, topScore - userScore).toFixed(1);
    return (
      <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.38)", display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ color: RED, fontWeight: 900 }}>-{gap}</span>
        <span>{t("lbPtsFromFirst")}</span>
        <span style={{ color: "rgba(255,255,255,0.25)" }}>· #1</span>
        <span style={{ color: "rgba(255,255,255,0.5)" }}>
          {profiles[topEntry.userId]?.displayName?.split(" ")[0] || profiles[topEntry.userId]?.username || "Fighter"}
        </span>
        <span style={{ color: "rgba(255,255,255,0.25)" }}>({topScore}/10)</span>
      </div>
    );
  };

  return (
    <div style={styles.yourRankCard} className="hud-corners section-reveal stagger-1">
      <div style={styles.yourRankTop}>
        <span style={styles.yourRankLabel}>{rankLabel}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...styles.scorePill, background: getScoreColor(score) }}>
            {score}/10
          </span>
          <button
            type="button"
            onClick={onShare}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              border: `1px solid ${goldAlpha(0.3)}`,
              background: goldAlpha(0.08),
              color: GOLD,
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {shareCopied ? "✓" : t("lbShare")}
          </button>
        </div>
      </div>

      <div style={styles.yourRankSub}>
        {currentUserWeeklyRank && (
          <span style={{ color: "#60A5FA" }}>
            {t("seasonWeeklyRank").replace("{rank}", currentUserWeeklyRank)}
          </span>
        )}
        {currentUserWeeklyRank && currentUserAllTimeRank && "  ·  "}
        {currentUserAllTimeRank && (
          <span>{t("seasonAllTimeRank").replace("{rank}", currentUserAllTimeRank)}</span>
        )}
        {(currentUserWeeklyRank || currentUserAllTimeRank) && currentUserAllTimeEntry && "  ·  "}
        {currentUserAllTimeEntry && `${currentUserAllTimeEntry.xp.toLocaleString()} ${t("xpLabel")}`}
      </div>

      {renderGapRow()}
    </div>
  );
}
