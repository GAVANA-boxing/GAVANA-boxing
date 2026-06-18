"use client";

const COPY = {
  label: {
    mn: (n) => `${n} ӨДРИЙН STREAK АЮУЛД БАЙНА`,
    ko: (n) => `${n}일 스트릭 위험!`,
    en: (n) => `🔥 ${n}-DAY STREAK AT RISK`,
  },
  body: { mn: "Өнөөдөр бэлтгэл хийж streak-ийг аврах", ko: "오늘 훈련하여 스트릭을 지키세요", en: "Train today to protect your streak" },
};

export default function StreakRiskWarning({ locale, userStreak }) {
  const label = (COPY.label[locale] || COPY.label.en)(userStreak);
  return (
    <div style={{ borderRadius: 12, padding: "10px 14px", background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.28)", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>🔥</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: "#FB923C", marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
          {COPY.body[locale] || COPY.body.en}
        </div>
      </div>
    </div>
  );
}
