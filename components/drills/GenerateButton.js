"use client";

const LABELS = {
  loading: { mn: "Үүсгэж байна…", ko: "생성 중…", en: "Generating…" },
  idle: { mn: "⚡ Дасгал үүсгэх", ko: "⚡ 드릴 생성", en: "⚡ Generate Drills" },
};

/**
 * @param {{ loading: boolean, disabled: boolean, accent: string, locale: string, onClick: () => void }} props
 */
export default function GenerateButton({ loading, disabled, accent, locale, onClick }) {
  const mn = locale === "mn";
  const ko = locale === "ko";

  const label = loading
    ? (LABELS.loading[locale] || LABELS.loading.en)
    : disabled
      ? (mn ? "Эхлээд чиглэлээ сонго" : ko ? "먼저 영역을 고르세요" : "Pick an area first")
      : (mn ? LABELS.idle.mn : ko ? LABELS.idle.ko : LABELS.idle.en);
  const off = loading || disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%", minHeight: 52, padding: "0 16px",
        borderRadius: 14,
        background: off ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
        border: off ? "1px solid rgba(255,255,255,0.08)" : "none",
        color: off ? "rgba(255,255,255,0.45)" : "#fff",
        fontFamily: "inherit", fontSize: 16, fontWeight: 700, cursor: off ? "default" : "pointer",
        boxShadow: off ? "none" : `0 8px 24px ${accent}44`,
        transition: "all 200ms ease",
        marginBottom: 28,
      }}
    >
      {label}
    </button>
  );
}
