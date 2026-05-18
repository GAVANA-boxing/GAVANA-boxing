"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { RANK_TIERS, calculateUserXP, getFighterRank, getNextRank, getRankProgress } from "@/lib/xp";
import { getLocale, translate } from "@/lib/i18n";
import RankIcon from "@/components/RankIcon";
import BottomNav from "@/components/BottomNav";

const HOW_TO_EARN = [
  {
    icon: "🎯",
    en: "Training session",
    mn: "Дасгалын сесс",
    ko: "훈련 세션",
    detailEn: "score² × 10 XP (max 1,000/day)",
    detailMn: "оноо² × 10 XP (өдөрт хамгийн ихдээ 1,000)",
    detailKo: "점수² × 10 XP (하루 최대 1,000)",
    color: "#D4AF37",
  },
  {
    icon: "⚡",
    en: "Improvement bonus",
    mn: "Дэвшлийн бонус",
    ko: "향상 보너스",
    detailEn: "+200 XP (0.5pt jump) or +400 XP (1pt jump)",
    detailMn: "+200 XP (0.5 оноо) эсвэл +400 XP (1 оноо)",
    detailKo: "+200 XP (0.5점 향상) 또는 +400 XP (1점 향상)",
    color: "#A78BFA",
  },
  {
    icon: "⚔️",
    en: "Challenge",
    mn: "Тэмцээн",
    ko: "챌린지",
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

  const [xp, setXp] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { setXp(0); setDataLoading(false); return; }

    let active = true;
    async function loadXP() {
      try {
        const [feedbackSnap, profileSnap] = await Promise.all([
          getDocs(query(collection(db, "ai_feedback"), where("userId", "==", user.uid))),
          getDoc(doc(db, "users", user.uid)),
        ]);

        const docs = feedbackSnap.docs.map((d) => ({ score: d.data().score, createdAt: d.data().createdAt }));
        const profileData = profileSnap.exists() ? profileSnap.data() : {};
        const storedXP = Number(profileData.xp) || 0;
        const streak = Number(profileData.dailyStreak) || 0;
        const likes = Number(profileData.likesReceived) || 0;
        const aiXP = calculateUserXP({ aiFeedbackDocs: docs, streakDays: streak, likesReceived: likes });

        if (active) {
          setXp(storedXP + aiXP);
          setSessionCount(feedbackSnap.docs.length);
        }
      } catch {
        if (active) setXp(0);
      } finally {
        if (active) setDataLoading(false);
      }
    }

    loadXP();
    return () => { active = false; };
  }, [user?.uid, authLoading]);

  const currentXP = xp ?? 0;
  const fighterRank = getFighterRank(currentXP);
  const nextRank = getNextRank(currentXP);
  const rankProgress = getRankProgress(currentXP);
  const xpToNext = nextRank ? nextRank.minXP - currentXP : 0;
  const tierXPStart = fighterRank.minXP;
  const tierXPEnd = nextRank?.minXP ?? fighterRank.minXP;
  const tierXPDone = currentXP - tierXPStart;
  const tierXPRange = tierXPEnd - tierXPStart;

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <button type="button" style={styles.backBtn} onClick={() => router.back()} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={styles.headerCenter}>
          <p style={styles.eyebrow}>GAVANA BOXING</p>
          <h1 style={styles.title}>{t("rankPageTitle")}</h1>
        </div>
        <div style={{ width: 44 }} />
      </header>

      <div style={styles.content}>

        {/* Current rank card */}
        {dataLoading ? (
          <div style={{ marginBottom: 28 }}>
            <div className="shimmer" style={{ height: 160, borderRadius: 20 }} />
          </div>
        ) : (
          <div style={{
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
          }}>
            <div style={styles.currentTop}>
              <RankIcon rank={fighterRank} size={64} animated />
              <div style={styles.currentInfo}>
                <p style={styles.currentKicker}>{t("rankCurrentLabel")}</p>
                <h2 style={{ ...styles.currentName, color: fighterRank.color }}>
                  {t(fighterRank.key)}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <p style={styles.currentXP}>
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
                <div style={{
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

        <div style={styles.ladder}>
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
    minHeight: "100vh",
    background: "linear-gradient(180deg, #070707 0%, #0A0A0A 100%)",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    paddingBottom: 90,
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
    background: "rgba(7,7,7,0.94)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(212,175,55,0.18)",
  },
  backBtn: {
    border: "1px solid rgba(212,175,55,0.28)",
    background: "transparent",
    color: "#fff",
    borderRadius: 10,
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
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
  },
  title: {
    margin: "4px 0 0",
    fontSize: 26,
    fontWeight: 950,
    lineHeight: 1.1,
  },
  content: {
    maxWidth: 600,
    margin: "0 auto",
    padding: "20px 16px",
  },
  currentCard: {
    padding: "20px 18px",
    borderRadius: 20,
    border: "1px solid",
    marginBottom: 28,
    transition: "box-shadow 0.4s",
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
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 2,
    color: "#888",
    textTransform: "uppercase",
  },
  currentName: {
    margin: "0 0 5px",
    fontSize: 24,
    fontWeight: 1000,
    lineHeight: 1,
    textTransform: "uppercase",
    letterSpacing: -0.3,
  },
  currentXP: {
    margin: 0,
    fontSize: 13,
    color: "#888",
    fontWeight: 700,
  },
  xpBarWrap: {},
  xpTrack: {
    width: "100%",
    height: 7,
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
    fontSize: 11,
    color: "#666",
    textAlign: "right",
    fontWeight: 700,
  },
  ladderHeading: {
    margin: "0 0 12px",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 2.5,
    color: "#D4AF37",
    textTransform: "uppercase",
  },
  ladder: {
    display: "grid",
    gap: 8,
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "13px 15px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    position: "relative",
    overflow: "hidden",
  },
  rowCurrent: {
    border: "1px solid",
  },
  rowLocked: {
    opacity: 0.42,
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
    fontSize: 14,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  currentBadge: {
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 9,
    fontWeight: 900,
    color: "#fff",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  lockIcon: { fontSize: 12 },
  rowXP: {
    margin: "3px 0 0",
    fontSize: 11,
    fontWeight: 700,
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
    padding: "13px 15px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.025)",
    border: "1px solid",
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
    color: "#666",
    lineHeight: 1.4,
  },
};
