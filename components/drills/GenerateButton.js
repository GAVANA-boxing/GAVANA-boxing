"use client";

const LABELS = {
  loading: { mn: "Үүсгэж байна...", en: "Generating..." },
  idle: { mn: "⚡ Дасгал үүсгэх", ko: "⚡ 드릴 생성", en: "⚡ Generate Drills" },
};

/**
 * @param {{ loading: boolean, disabled: boolean, accent: string, locale: string, onClick: () => void }} props
 */
export default function GenerateButton({ loading, disabled, accent, locale, onClick }) {
  const mn = locale === "mn";
  const ko = locale === "ko";

  const label = loading
    ? (mn ? LABELS.loading.mn : LABELS.loading.en)
    : (mn ? LABELS.idle.mn : ko ? LABELS.idle.ko : LABELS.idle.en);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%", padding: "14px 0",
        borderRadius: 13,
        background: loading ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
        border: "none",
        color: loading ? "rgba(255,255,255,0.3)" : "#fff",
        fontSize: 14, fontWeight: 900, cursor: (loading || disabled) ? "not-allowed" : "pointer",
        letterSpacing: 0.3,
        boxShadow: loading ? "none" : `0 4px 20px ${accent}44`,
        transition: "all 200ms ease",
        marginBottom: 28,
      }}
    >
      {label}
    </button>
  );
}
