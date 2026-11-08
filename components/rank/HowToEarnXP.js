"use client";

import { GOLD } from "@/lib/tokens";

// Mirrors the server exactly (lib/xp.js calculateChallengeXP, lib/domain/scoreGuard.js,
// lib/domain/awardXp.js computeMissionProgression, lib/domain/progression.ts). Change both together.
const HOW_TO_EARN = [
  {
    icon: "🎯",
    en: "Every round",
    mn: "Раунд бүр",
    ko: "라운드마다",
    detailEn: "score × 35 XP + grade bonus (S +150, A +80, B +40, C +15). Max 500 per round, 10 rounds a day, at least 3 punches.",
    detailMn: "оноо × 35 XP + зэрэглэлийн бонус (S +150, A +80, B +40, C +15). Раундад ≤500, өдөрт 10 раунд, дор хаяж 3 цохилт.",
    detailKo: "점수 × 35 XP + 등급 보너스 (S +150, A +80, B +40, C +15). 라운드당 최대 500, 하루 10라운드, 펀치 3회 이상.",
    color: GOLD,
  },
  {
    icon: "✅",
    en: "Daily mission",
    mn: "Өдрийн даалгавар",
    ko: "데일리 미션",
    detailEn: "First round of the day: +50 XP. Day 3 of a streak +100, day 7 +250.",
    detailMn: "Өдрийн эхний раунд: +50 XP. Дараалсан 3 дахь өдөр +100, 7 дахь өдөр +250.",
    detailKo: "하루 첫 라운드: +50 XP. 연속 3일째 +100, 7일째 +250.",
    color: "#A78BFA",
  },
  {
    icon: "🔥",
    en: "Daily streak",
    mn: "Дараалсан өдөр",
    ko: "연속 기록",
    detailEn: "+20 XP for each day of your best streak — kept even if the streak breaks.",
    detailMn: "Хамгийн урт дараалсан өдрийн тань өдөр бүрт +20 XP — тасарсан ч хасагдахгүй.",
    detailKo: "최고 연속 기록 하루당 +20 XP — 끊겨도 사라지지 않아요.",
    color: "#FB923C",
  },
];

export default function HowToEarnXP({ locale, t }) {
  const lbl = (mn, ko, en) =>
    locale === "mn" ? mn : locale === "ko" ? ko : en;

  const proNote =
    locale === "mn"
      ? "Pro: сард 2 удаа дараалал хамгаална"
      : locale === "ko"
      ? "Pro: 월 2회 연속 기록 보호"
      : "Pro: 2 streak saves a month";

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 36, marginBottom: 12 }}>
        <h2 style={{ ...styles.heading, marginTop: 0, marginBottom: 0 }}>
          {t("howToEarnXP")}
        </h2>
        <span
          style={{
            fontSize: 11,
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
