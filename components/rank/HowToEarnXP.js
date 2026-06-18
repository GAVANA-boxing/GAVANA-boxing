"use client";

import { GOLD } from "@/lib/tokens";

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
    color: "#A78BFA",
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

export default function HowToEarnXP({ locale, t }) {
  const lbl = (mn, ko, en) =>
    locale === "mn" ? mn : locale === "ko" ? ko : en;

  const proNote =
    locale === "mn"
      ? "Pro гишүүд 2 дахин их XP цуглуулна"
      : locale === "ko"
      ? "Pro 회원은 2배 XP 획득"
      : "Pro members earn 2× XP";

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 36, marginBottom: 12 }}>
        <h2 style={{ ...styles.heading, marginTop: 0, marginBottom: 0 }}>
          {t("howToEarnXP")}
        </h2>
        <span
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: "#F5C451",
            background: "rgba(245,196,81,0.12)",
            border: "1px solid rgba(245,196,81,0.3)",
            borderRadius: 20,
            padding: "3px 9px",
            letterSpacing: 0.3,
            whiteSpace: "nowrap",
          }}
        >
          ⚡ {proNote}
        </span>
      </div>
      <div style={styles.earnGrid}>
        {HOW_TO_EARN.map((item) => (
          <div
            key={item.en}
            style={{ ...styles.earnCard, borderColor: `${item.color}28` }}
          >
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
    </>
  );
}

const styles = {
  heading: {
    margin: "0 0 12px",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-black)",
    letterSpacing: "0.3em",
    color: GOLD,
    textTransform: "uppercase",
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
