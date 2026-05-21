"use client";

import { memo } from "react";
import { getFighterRank } from "@/lib/xp";
import RankBadge from "@/components/RankBadge";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import { formatCompact } from "@/lib/utils";
import { getRankMedal, getScoreColor, getAvatarUrl, getEntryBadges } from "@/lib/leaderboardHelpers";
import Image from "next/image";
import { RED, GOLD } from "@/lib/tokens";

const LeaderboardEntry = memo(function LeaderboardEntry({ entry, index, profiles, user, entries, weeklyEntries, streakEntries, improvementEntries, leaderboardTab, locale, router, t, styles }) {
  const rank = index + 1;
  const medal = getRankMedal(rank);
  const profile = profiles[entry.userId] || {};
  const avatarUrl = getAvatarUrl(profile);
  const displayName = profile.displayName || profile.username || "Fighter";
  const username = profile.username ? `@${profile.username}` : "";
  const isCurrentUser = entry.userId === user?.uid;
  const scoreColor = getScoreColor(entry.bestScore);
  const allTimeEntry = entries.find((e) => e.userId === entry.userId);
  const entryRank = getFighterRank(allTimeEntry?.xp ?? 0);
  const allTimeRank = entries.findIndex((e) => e.userId === entry.userId);
  const entryBadges = getEntryBadges({ entry, rank, weeklyEntries, streakEntries, improvementEntries });
  const topStyle = rank === 1 ? styles.rowFirst : rank === 2 ? styles.rowSecond : rank === 3 ? styles.rowThird : {};

  return (
    <div
      key={entry.userId}
      role="button"
      tabIndex={0}
      style={{
        ...styles.row,
        ...(isCurrentUser ? styles.rowHighlight : {}),
        ...topStyle,
        cursor: "pointer",
      }}
      onClick={() => router.push(`/${locale}/profile/${entry.userId}`)}
      onKeyDown={(e) => { if (e.key === "Enter") router.push(`/${locale}/profile/${entry.userId}`); }}
    >
      {/* Rank */}
      <div style={styles.rankWrap}>
        {medal ? (
          <span style={styles.medal}>{medal}</span>
        ) : (
          <span style={styles.rankNum}>#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div
        style={{
          ...styles.avatar,
          ...(rank === 1 ? { border: `2px solid ${GOLD}` } : {}),
          ...(rank === 2 ? { border: "2px solid #9CA3AF" } : {}),
          ...(rank === 3 ? { border: "2px solid #FB923C" } : {}),
          ...(isCurrentUser ? { border: `2px solid ${RED}` } : {}),
        }}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={44} height={44} style={{ objectFit: "cover" }} />
        ) : (
          <span style={styles.avatarInitial}>
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name + username */}
      <div style={styles.nameBlock}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={styles.displayName}>
            {displayName}
            {isCurrentUser && <span style={styles.youTag}> YOU</span>}
          </div>
          {(() => {
            const arch = profile.fighterArchetype;
            const ad = ARCHETYPE_DISPLAY[arch];
            if (!ad) return null;
            return (
              <span style={{
                ...styles.archetypeChip,
                color: ad.color,
                background: `${ad.color}18`,
                border: `1px solid ${ad.color}35`,
              }}>
                {ad.emoji}
              </span>
            );
          })()}
        </div>
        {username ? <div style={styles.username}>{username}</div> : null}
        <div style={styles.entryRankRow}>
          <RankBadge rank={entryRank} size={15} glowEnabled={false} />
          <span style={{ color: entryRank.color, fontSize: 9, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "var(--font-condensed)" }}>
            {t(entryRank.key)}
          </span>
          {leaderboardTab === "week" && allTimeRank >= 0 && (
            <span style={styles.allTimeRankBadge}>
              · #{allTimeRank + 1} {t("seasonAllTime")}
            </span>
          )}
          {leaderboardTab === "alltime" && (
            <span style={styles.sessionsBadge}>
              · {entry.sessions} {t("leaderboardSessions").toLowerCase()}
            </span>
          )}
        </div>
        {entryBadges.length > 0 && (
          <div style={styles.badgeRow}>
            {entryBadges.map((b) => (
              <span key={b.label} style={{ ...styles.badge, color: b.color, borderColor: b.color + "44", background: b.color + "12" }}>
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Scores */}
      <div style={styles.scoresBlock}>
        {leaderboardTab === "improvement" ? (
          <>
            <div style={{ ...styles.bestScore, color: "#34D399" }}>
              +{entry.improvement ?? 0}
            </div>
            <div style={styles.latestScore}>{t("lbImprovement")}</div>
          </>
        ) : leaderboardTab === "streak" ? (
          <>
            <div style={{ ...styles.bestScore, color: "#FB923C" }}>
              🔥{entry.bestScore}
            </div>
            <div style={styles.latestScore}>{t("lbStreak")}</div>
          </>
        ) : leaderboardTab === "views" ? (
          <>
            <div style={{ ...styles.bestScore, color: "#60A5FA" }}>
              👁 {formatCompact(entry.bestScore)}
            </div>
            <div style={styles.latestScore}>{t("lbTotalViews")}</div>
          </>
        ) : leaderboardTab === "likes" ? (
          <>
            <div style={{ ...styles.bestScore, color: "#F472B6" }}>
              ❤️ {formatCompact(entry.bestScore)}
            </div>
            <div style={styles.latestScore}>{t("lbTotalLikes")}</div>
          </>
        ) : (
          <>
            <div style={{ ...styles.bestScore, color: scoreColor }}>
              {entry.bestScore}/10
            </div>
            {leaderboardTab === "alltime" && (
              <div style={styles.latestScore}>
                {(allTimeEntry?.xp ?? 0).toLocaleString()} {t("xpLabel")}
              </div>
            )}
            {leaderboardTab === "week" && (
              <div style={styles.latestScore}>
                {t("seasonWeeklyScoreLabel")}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
export { LeaderboardEntry };
