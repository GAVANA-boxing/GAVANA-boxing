"use client";

import { memo, useCallback, useState } from "react";
import { getFighterRank } from "@/lib/xp";
import RankBadge from "@/components/RankBadge";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import { formatCompact } from "@/lib/utils";
import { getRankMedal, getScoreColor, getAvatarUrl, getEntryBadges } from "@/lib/leaderboardHelpers";
import Image from "next/image";
import { RED, GOLD } from "@/lib/tokens";
import { getFirebase } from "@/lib/lazyFirebase";

const CHALLENGE_LABEL = { en: "Challenge", mn: "Тулаан", ko: "도전" };

const LeaderboardEntry = memo(function LeaderboardEntry({ entry, index, profiles, user, entries, weeklyEntries, streakEntries, improvementEntries, leaderboardTab, locale, router, t, styles }) {
  const [challengeSent,    setChallengeSent]    = useState(false);
  const [challengeLoading, setChallengeLoading] = useState(false);

  const handleChallenge = useCallback(async (e) => {
    e.stopPropagation();
    if (!user?.uid) { router.push(`/${locale}/login`); return; }
    if (challengeLoading || challengeSent) return;
    setChallengeLoading(true);
    try {
      const { db } = await getFirebase();
      const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
      await addDoc(collection(db, "pvp_challenges"), {
        challengerId: user.uid,
        opponentId:   entry.userId,
        status:       "pending",
        createdAt:    serverTimestamp(),
      });
      await addDoc(collection(db, "notifications"), {
        recipientId:      entry.userId,
        actorId:          user.uid,
        actorName:        user.displayName || "Fighter",
        fromUserId:       user.uid,
        fromUserPhotoURL: user.photoURL || "",
        type:             "pvp_challenge",
        message:
          locale === "mn"
            ? `${user.displayName || "Fighter"} тан руу тулааны шийдэл илгээлээ!`
            : locale === "ko"
            ? `${user.displayName || "Fighter"}님이 PvP 배틀을 신청했습니다!`
            : `${user.displayName || "Fighter"} challenged you to a battle!`,
        read:      false,
        createdAt: serverTimestamp(),
      });
      setChallengeSent(true);
      setTimeout(() => setChallengeSent(false), 3000);
    } catch { /* non-critical */ } finally {
      setChallengeLoading(false);
    }
  }, [user, entry.userId, locale, router, challengeLoading, challengeSent]);

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
      className={`list-row-hover section-reveal${index < 5 ? ` stagger-${index + 1}` : ""}`}
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

      {/* Challenge button (other users only) */}
      {!isCurrentUser && user?.uid && (
        <button
          type="button"
          onClick={handleChallenge}
          style={{
            flexShrink: 0,
            padding: "4px 10px",
            borderRadius: 8,
            border: challengeSent ? "1px solid #34D39944" : "1px solid rgba(239,68,68,0.35)",
            background: challengeSent ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.08)",
            color: challengeSent ? "#34D399" : "#EF4444",
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 0.5,
            cursor: challengeLoading ? "wait" : "pointer",
            marginRight: 6,
            WebkitTapHighlightColor: "transparent",
            transition: "all 180ms ease",
            whiteSpace: "nowrap",
          }}
        >
          {challengeSent
            ? "✓"
            : challengeLoading
            ? "..."
            : `⚔️ ${locale === "mn" ? CHALLENGE_LABEL.mn : locale === "ko" ? CHALLENGE_LABEL.ko : CHALLENGE_LABEL.en}`}
        </button>
      )}

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
        ) : leaderboardTab === "social" && entry.wins != null ? (
          <>
            <div style={{ ...styles.bestScore, color: "#34D399" }}>
              ⚔️ {entry.bestScore}
            </div>
            <div style={styles.latestScore}>
              {entry.wins > 0 ? `${entry.wins} ${t("repChallengeWins")}` : t("lbSocialResponders")}
            </div>
          </>
        ) : leaderboardTab === "social" ? (
          <>
            <div style={{ ...styles.bestScore, color: "#34D399" }}>
              🔥 {entry.bestScore}
            </div>
            <div style={styles.latestScore}>{t("lbSocialActive")}</div>
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
