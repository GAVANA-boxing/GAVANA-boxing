"use client";

const LABELS = {
  lost:      { mn: "Дохио алдагдлаа",      ko: "신호 손실",    en: "DNA Signal Lost" },
  degrading: { mn: "Дохио буурч байна",     ko: "신호 저하 중", en: "DNA Signal Degrading" },
  weakening: { mn: "Дохио суларч байна",    ko: "신호 약화 중", en: "DNA Signal Weakening" },
};

function getLabel(daysSince, locale) {
  const key = daysSince >= 14 ? "lost" : daysSince >= 8 ? "degrading" : "weakening";
  return LABELS[key][locale] || LABELS[key].en;
}

function getHint(daysSince, locale) {
  if (daysSince >= 14) {
    return locale === "mn"
      ? `${daysSince} хоног дасгал хийгээгүй — дахин эхэл`
      : locale === "ko"
      ? `${daysSince}일 미훈련 — 다시 시작하세요`
      : `${daysSince} days without training — time to restart`;
  }
  return locale === "mn"
    ? `${daysSince} хоног завсарласан. ДНХ сэргээхийн тулд дасгал хий.`
    : locale === "ko"
    ? `${daysSince}일 쉬었습니다. DNA를 복구하세요.`
    : `${daysSince}-day gap. Train to keep your DNA signal strong.`;
}

export default function DNAFreshnessWarning({ daysSince, locale }) {
  const color = daysSince >= 14 ? "#EF4444" : daysSince >= 8 ? "#FB923C" : "#F59E0B";
  const label = getLabel(daysSince, locale);
  const hint  = getHint(daysSince, locale);

  return (
    <div style={{ borderRadius: 12, padding: "10px 14px", background: `${color}0a`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{hint}</div>
      </div>
    </div>
  );
}
