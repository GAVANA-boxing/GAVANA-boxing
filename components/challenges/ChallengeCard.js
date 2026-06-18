"use client";

import Image from "next/image";
import styles from "@/components/challenges/challengesStyles";
import { GOLD, PURPLE } from "@/lib/tokens";
import { formatScore, getChallengeRank } from "@/lib/utils";

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

export default function ChallengeCard({ challenge, list, profiles, currentUserId, seasonTab, locale, router, t }) {
  const isEmpty = list.length === 0;

  return (
    <article style={styles.card}>
      {/* ── Card header ── */}
      <div style={styles.cardHeader}>
        <div style={styles.cardLeft}>
          <div style={styles.cardEmojiBadge}>{challenge.emoji}</div>
          <div style={styles.cardTitleGroup}>
            <h2 style={styles.cardTitle}>{t(challenge.titleKey)}</h2>
            <p style={styles.cardDesc}>{t(challenge.descKey)}</p>
          </div>
        </div>
        <button
          type="button"
          style={styles.startButton}
          onClick={() => router.push(`/${locale}/train?challengeId=${challenge.id}`)}
        >
          {t("challengeStart")}
        </button>
      </div>

      <div style={styles.cardDivider} />

      {/* ── Leaderboard ── */}
      {isEmpty ? (
        <div style={styles.emptyLeaderboard}>
          <span>
            {seasonTab === "week" ? t("seasonNoResultsThisWeek") : t("challengeNoScores")}
          </span>
          <button
            type="button"
            style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: "rgba(239,68,68,0.12)", color: "rgba(252,165,165,0.85)", fontSize: 11, fontWeight: 900, cursor: "pointer", letterSpacing: 0.3 }}
            onClick={() => router.push(`/${locale}/train?challengeId=${challenge.id}`)}
          >
            {locale === "mn" ? "Эхлэх →" : locale === "ko" ? "시작 →" : "Go first →"}
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
            const isLast = index === list.length - 1;

            return (
              <div
                key={result.id}
                role="button"
                tabIndex={0}
                style={{
                  ...styles.scoreRow,
                  ...(isCurrentUser ? styles.scoreRowCurrent : {}),
                  ...(isLast ? styles.scoreRowLast : {}),
                  cursor: "pointer",
                }}
                onClick={() => !isCurrentUser && router.push(`/${locale}/profile/${result.userId}`)}
                onKeyDown={(e) => { if (e.key === "Enter" && !isCurrentUser) router.push(`/${locale}/profile/${result.userId}`); }}
              >
                <span style={index < 3 ? styles.rankMedal : styles.rankNum}>
                  {getRankIcon(index)}
                </span>

                <span style={styles.fighterCell}>
                  <span style={{ ...styles.avatar, ...(isCurrentUser ? styles.avatarCurrent : {}) }}>
                    {profile.photoURL
                      ? <Image src={profile.photoURL} alt="" width={30} height={30} style={styles.avatarImg} />
                      : initial}
                  </span>
                  <span style={{ ...styles.fighterName, ...(isCurrentUser ? styles.fighterNameCurrent : {}) }}>
                    {displayName}
                  </span>
                </span>

                <span style={styles.scoreStack}>
                  <strong style={{ ...styles.scoreValue, ...(isCurrentUser ? styles.scoreValueCurrent : {}) }}>
                    {formatScore(result.score)}/10
                  </strong>
                  <span style={{ ...styles.xpValue, color: rankColor }}>
                    {rankLetter} · +{getResultXP(result).toLocaleString()} {t("xpLabel")}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
