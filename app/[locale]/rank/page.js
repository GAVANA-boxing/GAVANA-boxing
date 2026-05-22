"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { RANK_TIERS, getFighterRank, getNextRank, getRankProgress } from "@/lib/xp";
import { getLocale, translate } from "@/lib/i18n";
import RankIcon from "@/components/RankIcon";
import RankPromotionModal from "@/components/RankPromotionModal";
import BottomNav from "@/components/BottomNav";
import PageTopBar from "@/components/PageTopBar";
import { RED, GOLD, PURPLE, BG, BORDER, goldAlpha, redAlpha, pageBg } from "@/lib/tokens";
import { useRankData } from "@/hooks/useRankData";

const HOW_TO_EARN = [
  {
    icon: "🎯",
    en: "Training session",
    mn: "Дасгалын сесс",
    ko: "훈련 세션",
    detailEn: "score² × 10 XP (max 1,000/day)",
    detailMn: "оноо² × 10 XP (өдөрт хамгийн ихдээ 1,000)",
    detailKo: "점수² × 10 XP (하루 최대 1,000)",
    color: GOLD,
  },
  {
    icon: "⚡",
    en: "Improvement bonus",
    mn: "Дэвшлийн бонус",
    ko: "향상 보너스",
    detailEn: "+200 XP (0.5pt jump) or +400 XP (1pt jump)",
    detailMn: "+200 XP (0.5 оноо) эсвэл +400 XP (1 оноо)",
    detailKo: "+200 XP (0.5점 향상) 또는 +400 XP (1점 향상)",
    color: PURPLE,
  },
  {
    icon: "⚔️",
    en: "Challenge",
    mn: "Тэмцээн",
    ko: "찼린지",
    detailEn: "Up to 500 XP per attempt",
    detailMn: "Нэг оролдлогод хамгийн ихдээ 500 XP",
    detailKo: "시도당 최대 500 XP",
    color: "#F87171",
  },
  {
    icon: "🔥",
    en: "Daily streak",
    mn: "Өдрийн streak",
    ko: "데일리 스트릭",
    detailEn: "20 XP per streak day",
    detailMn: "Streak өдөр бүрт 20 XP",
    detailKo: "스트릭 하루당 20 XP",
    color: "#FB923C",
  },
  {
    icon: "❤️",
    en: "Likes received",
    mn: "Хүлээн авсан лайк",
    ko: "받은 좋아요",
    detailEn: "2 XP per like on your reels",
    detailMn: "Таны видео дээрх лайк бүрт 2 XP",
    detailKo: "내 릴에 받은 좋아요당 2 XP",
    color: "#F472B6",
  },
];

export default function RankPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);
  const lbl = (mn, ko, en) => locale === "mn" ? mn : locale === "ko" ? ko : en;

  const { xp, sessionCount, dataLoading } = useRankData({ user, authLoading });

  const currentXP = xp ?? 0;
  const fighterRank = getFighterRank(currentXP);
  const nextRank = getNextRank(currentXP);
  const rankProgress = getRankProgress(currentXP);
  const xpToNext = nextRank ? nextRank.minXP - currentXP : 0;

  const [showPromotion, setShowPromotion] = useState(false);
  const [promotionRank, setPromotionRank] = useState(null);

  useEffect(() => {
    if (dataLoading || !user?.uid || !fighterRank) return;
    const storageKey = `gavana_rank_${user.uid}`;
    const lastRankKey = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (lastRankKey && lastRankKey !== fighterRank.key) {
      setPromotionRank(fighterRank);
      setShowPromotion(true);
    }
    localStorage.setItem(storageKey, fighterRank.key);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoading, user?.uid, fighterRank?.key]);
  const tierXPStart = fighterRank.minXP;
  const tierXPEnd = nextRank?.minXP ?? fighterRank.minXP;
  const tierXPDone = currentXP - tierXPStart;
  const tierXPRange = tierXPEnd - tierXPStart;

  return (
    <main style={styles.page} className="page-enter cinematic-bg">
      {showPromotion && promotionRank && (
        <RankPromotionModal
          rank={promotionRank}
          rankName={t(promotionRank.key)}
          onDismiss={() => setShowPromotion(false)}
        />
      )}

      <PageTopBar kicker="COMBAT · RANK" title={t("rankPageTitle") || "RANK"} user={user} currentLocale={locale} showBack />

      <div style={styles.content}>

        {/* Current rank card */}
        {dataLoading ? (
          <div style={{ marginBottom: 28 }}>
            <div className="shimmer" style={{ height: 160, borderRadius: 20 }} />
          </div>
        ) : (
          <div
            className="hud-corners section-reveal"
            style={{
              ...styles.currentCard,
              borderColor: fighterRank.glowColor
                ? fighterRank.glowColor.replace(/[\d.]+\)$/, "0.5)")
                : `${fighterRank.color}55`,
              background: fighterRank.glowColor
                ? fighterRank.glowColor.replace(/[\d.]+\)$/, "0.08)")
                : `${fighterRank.color}12`,
              boxShadow: fighterRank.pulse
                ? `0 0 32px ${fighterRank.glowColor?.replace(/[\d.]+\)$/, "0.22)")}`
                : "none",
            }}
          >
            <div style={styles.currentTop}>
              <RankIcon rank={fighterRank} size={64} animated />
              <div style={styles.currentInfo}>
                <p style={styles.currentKicker}>{t("rankCurrentLabel")}</p>
                <h2 style={{ ...styles.currentName, color: fighterRank.color }}>
                  {t(fighterRank.key)}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <p style={styles.currentXP} className="num-reveal">
                    {currentXP.toLocaleString()} {t("xpLabel")}
                  </p>
                  {sessionCount > 0 && (
                    <span style={{ fontSize: 11, color: "#555", fontWeight: 700 }}>
                      · {sessionCount} {lbl("сесс", "세션", "sessions")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* XP bar */}
            <div style={styles.xpBarWrap}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "#666", fontWeight: 700 }}>
                  {tierXPDone.toLocaleString()} / {tierXPRange > 0 ? tierXPRange.toLocaleString() : "MAX"}
                </span>
                <span style={{ fontSize: 10, fontWeight: 900, color: fighterRank.color }}>
                  {nextRank ? `${rankProgress}%` : "MAX"}
                </span>
              </div>
              <div style={styles.xpTrack}>
                <div className="xp-fill-anim" style={{
                  ...styles.xpFill,
                  width: `${rankProgress}%`,
                  background: fighterRank.gradient,
                }} />
              </div>
              <p style={styles.xpBarLabel}>
                {nextRank
                  ? `${xpToNext.toLocaleString()} XP → ${t(nextRank.key)}`
                  : t("atMaxRank")}
              </p>
            </div>
          </div>
        )}

        {/* All-rank ladder */}
        <h2 style={styles.ladderHeading}>{t("rankPageKicker")}</h2>

        <div style={styles.ladder} className="stagger-list">
          {RANK_TIERS.map((tier) => {
            const isCurrent = fighterRank.key === tier.key;
            const isUnlocked = !dataLoading && currentXP >= tier.minXP;

            return (
              <div
                key={tier.key}
                style={{
                  ...styles.row,
                  ...(isCurrent ? {
                    ...styles.rowCurrent,
                    borderColor: tier.glowColor
                      ? tier.glowColor.replace(/[\d.]+\)$/, "0.5)")
                      : `${tier.color}55`,
                    background: tier.glowColor
                      ? tier.glowColor.replace(/[\d.]+\)$/, "0.1)")
                      : `${tier.color}18`,
                  } : {}),
                  ...(!isUnlocked ? styles.rowLocked : {}),
                }}
              >
                <div style={styles.rowIcon}>
                  <RankIcon rank={tier} size={36} animated={isCurrent} />
                </div>

                <div style={styles.rowInfo}>
                  <div style={styles.rowNameLine}>
                    <span style={{ ...styles.rowName, color: isUnlocked ? tier.color : "#555" }}>
                      {t(tier.key)}
                    </span>
                    {isCurrent && (
                      <span style={{ ...styles.currentBadge, background: tier.gradient }}>
                        {t("rankCurrentLabel")}
                      </span>
                    )}
                    {!isUnlocked && !dataLoading && (
                      <span style={styles.lockIcon}>🔒</span>
                    )}
                  </div>
                  <p style={{ ...styles.rowXP, color: isUnlocked ? "#888" : "#444" }}>
                    {tier.minXP === 0
                      ? t("rankStarterLabel")
                      : t("rankXPRequired").replace("{xp}", tier.minXP.toLocaleString())}
                  </p>
                </div>

                {isCurrent && (
                  <div style={styles.rowProgress}>
                    <div style={{ ...styles.rowProgressFill, width: `${rankProgress}%`, background: tier.gradient }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* How to earn XP */}
        <h2 style={{ ...styles.ladderHeading, marginTop: 36 }}>
          {t("howToEarnXP")}
        </h2>
        <div style={styles.earnGrid}>
          {HOW_TO_EARN.map((item) => (
            <div key={item.en} style={{ ...styles.earnCard, borderColor: `${item.color}28` }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <div style={styles.earnInfo}>
                <span style={{ ...styles.earnTitle, color: item.color }}>
                  {lbl(item.mn, item.ko, item.en)}
                </span>
                <span style={styles.earnDetail}>
                  {lbl(item.detailMn, item.detailKo, item.detailEn)}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: pageBg(),
    color: "#fff",
    paddingBottom: "calc(88px + env(safe-area-inset-bottom))",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "grid",
    gridTemplateColumns: "64px 1fr 44px",
    alignItems: "center",
    gap: 12,
    padding: "calc(env(safe-area-inset-top) + 14px) 16px 14px",
    background: "rgba(11,11,12,0.92)",
    backdropFilter: "blur(28px)",
    WebkitBackdropFilter: "blur(28px)",
    borderBottom: `1px solid ${goldAlpha(0.14)}`,
  },
  backBtn: {
    border: `1px solid ${goldAlpha(0.28)}`,
    background: "transparent",
    color: "#fff",
    borderRadius: 12,
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
  },
  headerCenter: { textAlign: "center" },
  eyebrow: {
    margin: 0,
    color: RED,
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  title: {
    margin: "3px 0 0",
    fontSize: 26,
    fontWeight: 1000,
    lineHeight: 1,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    textTransform: "uppercase",
    letterSpacing: "-0.02em",
  },
  content: {
    maxWidth: 540,
    margin: "0 auto",
    padding: "20px 16px",
  },
  currentCard: {
    padding: "20px 18px",
    borderRadius: "var(--r-xl)",
    border: "1px solid",
    marginBottom: 28,
    transition: "box-shadow 0.4s",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  },
  currentTop: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    marginBottom: 16,
  },
  currentInfo: { flex: 1, minWidth: 0 },
  currentKicker: {
    margin: "0 0 3px",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-black)",
    letterSpacing: "0.22em",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  currentName: {
    margin: "0 0 5px",
    fontSize: "var(--text-2xl)",
    fontWeight: "var(--fw-ultra)",
    lineHeight: "var(--lh-tight)",
    textTransform: "uppercase",
    letterSpacing: "var(--ls-tight)",
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
  },
  currentXP: {
    margin: 0,
    fontSize: "var(--text-base)",
    color: "rgba(255,255,255,0.45)",
    fontWeight: "var(--fw-bold)",
  },
  xpBarWrap: {},
  xpTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginBottom: 6,
  },
  xpFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 700ms ease",
  },
  xpBarLabel: {
    margin: 0,
    fontSize: "var(--text-sm)",
    color: "rgba(255,255,255,0.38)",
    textAlign: "right",
    fontWeight: "var(--fw-bold)",
    letterSpacing: "var(--ls-wide)",
  },
  ladderHeading: {
    margin: "0 0 12px",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-black)",
    letterSpacing: "0.3em",
    color: GOLD,
    textTransform: "uppercase",
  },
  ladder: {
    display: "grid",
    gap: 7,
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "13px 15px",
    borderRadius: "var(--r-lg)",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    position: "relative",
    overflow: "hidden",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  rowCurrent: {
    border: "1px solid",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  },
  rowLocked: {
    opacity: 0.38,
  },
  rowIcon: { flexShrink: 0 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowNameLine: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },
  rowName: {
    fontSize: "var(--text-md)",
    fontWeight: "var(--fw-black)",
    textTransform: "uppercase",
    letterSpacing: "var(--ls-wide)",
  },
  currentBadge: {
    padding: "2px 8px",
    borderRadius: "var(--r-full)",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-black)",
    color: "#fff",
    letterSpacing: "var(--ls-wider)",
    textTransform: "uppercase",
  },
  lockIcon: { fontSize: 12 },
  rowXP: {
    margin: "3px 0 0",
    fontSize: "var(--text-sm)",
    fontWeight: "var(--fw-bold)",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: "var(--ls-wide)",
  },
  rowProgress: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    background: "rgba(255,255,255,0.06)",
    borderRadius: "0 0 16px 16px",
    overflow: "hidden",
  },
  rowProgressFill: {
    height: "100%",
    transition: "width 700ms ease",
  },
  earnGrid: {
    display: "grid",
    gap: 8,
  },
  earnCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  earnInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
  },
  earnTitle: {
    fontSize: 13,
    fontWeight: 800,
  },
  earnDetail: {
    fontSize: 11,
    color: "rgba(255,255,255,0.38)",
    lineHeight: 1.4,
  },
};
