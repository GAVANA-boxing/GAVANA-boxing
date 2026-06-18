"use client";

import styles from "@/components/challenges/challengesStyles";

const SEASON_BADGE = ["🥇", "🥈", "🥉"];

import { formatScore } from "@/lib/utils";

/**
 * Props:
 *   champions   — array of { challenge, result, profile }
 *   t           — (key: string) => string
 */
export default function WeeklyChampionsBanner({ champions, t }) {
  if (!champions || champions.length === 0) return null;

  return (
    <div style={styles.champBanner}>
      <p style={styles.champBannerTitle}>🏆 {t("seasonWeeklyChampion")}</p>
      <div style={styles.champList}>
        {champions.map(({ challenge, result: res, profile }, i) => {
          const name = profile?.name || t("fighter");
          return (
            <div key={challenge.id} style={styles.champItem}>
              <span style={styles.champBadge}>{SEASON_BADGE[i] || `#${i + 1}`}</span>
              <div style={styles.champInfo}>
                <span style={styles.champName}>{name}</span>
                <span style={styles.champChallenge}>{t(challenge.titleKey)}</span>
              </div>
              <span style={styles.champScore}>{formatScore(res.score)}/10</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
