"use client";

export default function ReadinessModal({
  locale,
  readinessStep,
  setReadinessStep,
  setReadinessOpen,
  handleStart,
  t,
}) {
  const steps = [
    { icon: "📖", label: t("readinessLearnStep"),    desc: t("readinessLearnDesc") },
    { icon: "🥊", label: t("readinessPracticeStep"), desc: t("readinessPracticeDesc") },
    { icon: "📹", label: t("readinessRecordStep"),   desc: t("readinessRecordDesc") },
  ];
  const step = steps[readinessStep];
  const isLast = readinessStep === steps.length - 1;

  function dismiss() {
    setReadinessOpen(false);
    handleStart();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,0.88)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      {/* Step dots */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === readinessStep ? 20 : 6,
            height: 6, borderRadius: 3,
            background: i <= readinessStep ? "#F5C451" : "rgba(255,255,255,0.15)",
            transition: "width 0.3s ease",
          }} />
        ))}
      </div>

      <div style={{
        width: "100%", maxWidth: 360,
        borderRadius: 20,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "28px 24px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{step.icon}</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 10 }}>{step.label}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 24 }}>{step.desc}</div>

        {isLast ? (
          <button type="button"
            style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#E53E3E,#F5C451)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer", letterSpacing: 0.5 }}
            onClick={dismiss}
          >
            {t("readinessStartBtn")}
          </button>
        ) : (
          <button type="button"
            style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "rgba(245,196,81,0.15)", color: "#F5C451", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
            onClick={() => setReadinessStep(s => s + 1)}
          >
            {locale === "mn" ? "Дараагийн →" : locale === "ko" ? "다음 →" : "Next →"}
          </button>
        )}
      </div>

      <button type="button"
        style={{ marginTop: 20, background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer" }}
        onClick={dismiss}
      >
        {t("readinessSkip")}
      </button>
    </div>
  );
}
