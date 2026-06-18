"use client";

import Image from "next/image";
import styles from "@/components/challenges/challengesStyles";
import { GOLD, PURPLE } from "@/lib/tokens";
import { formatScore, getChallengeRank, getTimestampMs } from "@/lib/utils";

function getResultXP(result) {
  const stored = Number(result?.xpGained);
  if (Number.isFinite(stored) && stored > 0) return Math.round(stored);
  const score = Number(result?.score);
  const rank = String(result?.rank || getChallengeRank(score)).toUpperCase();
  const base = Number.isFinite(score) ? Math.round(score * 50) : 0;
  const bonus = rank === "A" ? 100 : rank === "B" ? 50 : rank === "C" ? 20 : 0;
  return base + bonus;
}

function getRankIcon(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
}

/**
 * Props:
 *   challenge    — { id, titleKey, descKey, emoji }
 *   list         — top 5 results (already sliced)
 *   profiles     — map of userId -> profile object
 *   currentUserId — string
 *   seasonTab    — "week" | "alltime"
 *   locale       — string
 *   router       — Next.js router
 *   t            — (key: string) => string
 */
export default function ChallengeCard({ challenge, list, profiles, currentUserId, seasonTab, locale, router, t }) {
  const isEmpty = list.length === 0;

  return (
    <article key={challenge.id} style={styles.card}>
      <div style={styles.cardTop}>
        <div style={styles.cardTitleGroup}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>{challenge.emoji}</span>
            <h2 style={styles.cardTitle}>{t(challenge.titleKey)}</h2>
          </div>
          <p style={styles.cardDesc}>{t(challenge.descKey)}</p>
        </div>
        <button
          type="button"
          style={styles.startButton}
          onClick={() => router.push(`/${locale}/train?challengeId=${challenge.id}`)}
        >
          {t("challengeStart")}
        </button>
      </div>

      <div style={styles.leaderboard}>
        <h3 style={styles.leaderboardTitle}>{t("challengeLeaderboard")}</h3>
        {isEmpty ? (
          <div style={{ ...styles.emptyLeaderboard, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 16px" }}>
            <span style={{ fontSize: 32 }}>🏆</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
              {seasonTab === "week" ? t("seasonNoResultsThisWeek") : t("challengeNoScores")}
            </span>
            <button
              type="button"
              style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#EF4444,#B91C1C)", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer", letterSpacing: 0.3 }}
              onClick={() => router.push(`/${locale}/train?challengeId=${challenge.id}`)}
            >
              {locale === "mn" ? "Эхний байр авах →" : locale === "ko" ? "첫 번째가 되기 →" : "Be First →"}
            </button>
          </div>
        ) : (
          <div style={styles.scoreRows}>
            {list.map((result, index) => {
              const isCurrentUser = result.userId === currentUserId;
              const profile = profiles[result.userId] || {};
              const displayName = isCurrentUser ? t("challengeYou") : profile.name || t("fighter");
              const initial = (displayName || "F").charAt(0).toUpperCase();
              const rankLetter = result.rank || getChallengeRank(result.score);
              const rankColor =
                rankLetter === "S" ? GOLD
                : rankLetter === "A" ? "#60A5FA"
                : rankLetter === "B" ? PURPLE
                : rankLetter === "C" ? "#34D399"
                : "#888";

              return (
                <div
                  key={result.id}
                  role="button"
                  tabIndex={0}
                  style={{ ...styles.scoreRow, ...(isCurrentUser ? styles.scoreRowCurrent : {}), cursor: "pointer" }}
                  onClick={() => !isCurrentUser && router.push(`/${locale}/profile/${result.userId}`)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !isCurrentUser) router.push(`/${locale}/profile/${result.userId}`); }}
                >
                  <span style={styles.rankNum}>{getRankIcon(index)}</span>
                  <span style={styles.fighterCell}>
                    <span style={styles.avatar}>
                      {profile.photoURL
                        ? <Image src={profile.photoURL} alt="" width={26} height={26} style={{ objectFit: "cover" }} />
                        : initial}
                    </span>
                    <span style={styles.fighterText}>
                      <span style={styles.fighterName}>{displayName}</span>
                      <span style={styles.resultMeta}>
                        {t("challengeRank")}: <span style={{ color: rankColor, fontWeight: 900 }}>{rankLetter}</span>
                      </span>
                    </span>
                  </span>
                  <span style={styles.scoreStack}>
                    <strong style={styles.scoreValue}>{formatScore(result.score)}/10</strong>
                    <span style={styles.xpValue}>+{getResultXP(result).toLocaleString()} {t("xpLabel")}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
