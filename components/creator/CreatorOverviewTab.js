"use client";

import { RED, GOLD, redAlpha } from "@/lib/tokens";
import styles from "@/components/creator/creatorDashboardStyles";
import StatCard from "@/components/creator/StatCard";
import { formatCompact } from "@/lib/utils";
import { cleanCaption } from "@/lib/reelHelpers";

const BEST_DAY_LABELS = {
  mn: ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"],
  ko: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

function bestDayAvgLabel(locale, avg) {
  if (locale === "mn") return `Дундажаар ${formatCompact(avg)} үзэлт`;
  if (locale === "ko") return `평균 ${formatCompact(avg)} 조회수`;
  return `~${formatCompact(avg)} avg views`;
}

function challengeLabel(locale) {
  if (locale === "mn") return "оролдлого";
  if (locale === "ko") return "도전";
  return "challenges";
}

/**
 * @param {{
 *   t: (key: string) => string,
 *   locale: string,
 *   router: import("next/navigation").AppRouterInstance,
 *   totalViews: number,
 *   totalLikes: number,
 *   followerCount: number,
 *   externalAttemptsCount: number,
 *   newFollowersThisWeek: number,
 *   engagementRate: string,
 *   attemptsThisWeek: number,
 *   uniqueStudents: number,
 *   bestPostDay: { day: string, avg: number } | null,
 *   growthTip: string,
 *   mostChallengedReel: object | null,
 *   attemptsByReel: Record<string, number>,
 *   avgScore: string | null,
 * }} props
 */
export default function CreatorOverviewTab({
  t,
  locale,
  router,
  totalViews,
  totalLikes,
  followerCount,
  externalAttemptsCount,
  newFollowersThisWeek,
  engagementRate,
  attemptsThisWeek,
  uniqueStudents,
  bestPostDay,
  growthTip,
  mostChallengedReel,
  attemptsByReel,
  avgScore,
}) {
  const engColor = Number(engagementRate) >= 5 ? "#34D399" : Number(engagementRate) >= 2 ? GOLD : "#F87171";

  return (
    <>
      <div style={styles.statsGrid}>
        <StatCard label={t("creatorTotalViews")}          value={totalViews}             icon="👁"  color="#60A5FA" />
        <StatCard label={t("creatorTotalLikes")}          value={totalLikes}             icon="❤"  color="#F87171" />
        <StatCard label={t("creatorFollowers")}           value={followerCount}          icon="👥" color={GOLD} />
        <StatCard label={t("creatorChallengeAttempts")}   value={externalAttemptsCount}  icon="🥊" color="#34D399" />
      </div>

      <div style={styles.growthRow}>
        <div style={styles.growthItem}>
          <span style={styles.growthNum}>+{newFollowersThisWeek}</span>
          <span style={styles.growthLbl}>{t("creatorNewFollowers")}</span>
        </div>
        <div style={styles.growthItem}>
          <span style={{ ...styles.growthNum, color: engColor }}>{engagementRate}%</span>
          <span style={styles.growthLbl}>{t("creatorEngagementRate")}</span>
        </div>
        <div style={styles.growthItem}>
          <span style={{ ...styles.growthNum, color: "#60A5FA" }}>+{attemptsThisWeek}</span>
          <span style={styles.growthLbl}>{t("creatorAttemptsWeek")}</span>
        </div>
        {uniqueStudents > 0 && (
          <div style={styles.growthItem}>
            <span style={styles.growthNum}>{uniqueStudents}</span>
            <span style={styles.growthLbl}>{t("creatorTotalStudents")}</span>
          </div>
        )}
      </div>

      {bestPostDay && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 14, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.18)", borderLeft: "3px solid #60A5FA" }}>
          <span style={{ fontSize: 20 }}>📅</span>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>
              {t("creatorBestPostDay")} <span style={{ color: "#60A5FA" }}>{bestPostDay.day}</span>
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "#888" }}>
              {bestDayAvgLabel(locale, bestPostDay.avg)}
            </p>
          </div>
        </div>
      )}

      <div style={styles.tip}>
        <span style={styles.tipIcon}>💡</span>
        <span style={styles.tipText}>{growthTip}</span>
      </div>

      {mostChallengedReel && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🔥 {t("creatorMostChallenged")}</h2>
          <div
            style={{ background: "#141416", border: `1px solid ${redAlpha(0.2)}`, borderLeft: "3px solid #FF3B30", borderRadius: "3px 14px 14px 3px", padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
            onClick={() => router.push(`/${locale}/reels?reelId=${mostChallengedReel.id}`)}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {cleanCaption(mostChallengedReel.description || mostChallengedReel.caption || "") || t("trainingReel")}
              </div>
              <div style={{ fontSize: 11, color: "#888" }}>
                🥊 {attemptsByReel[mostChallengedReel.id]} {challengeLabel(locale)}
                {avgScore && <span style={{ marginLeft: 10, color: GOLD }}>⭐ avg {avgScore}/10</span>}
              </div>
            </div>
            <span style={{ color: RED, fontSize: 18, flexShrink: 0 }}>→</span>
          </div>
        </section>
      )}

      <button type="button" style={styles.uploadBtn} onClick={() => router.push(`/${locale}/upload`)}>
        + {t("creatorUploadNew")}
      </button>
    </>
  );
}
