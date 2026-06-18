"use client";

const COPY = {
  heading: { mn: "ЭНЭ ДОЛОО ХОНОГ", ko: "이번 주 실험", en: "THIS WEEK'S EXPERIMENT" },
  cta: {
    mn: (week) => `${week} эхлэх →`,
    ko: (week) => `${week} 시작 →`,
    en: (week) => `Start ${week} →`,
  },
};

export default function FeaturedExperiment({ locale, pkg, fighter, router }) {
  const weekLabel = pkg.week[locale] || pkg.week.en;
  const ctaLabel  = (COPY.cta[locale] || COPY.cta.en)(weekLabel);

  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${pkg.accent}30`, background: `${pkg.accent}08` }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${pkg.accent}88, transparent)` }} />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: pkg.accent, marginBottom: 3 }}>
              {COPY.heading[locale] || COPY.heading.en}
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>
              {weekLabel}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: pkg.accent, fontStyle: "italic", marginTop: 2 }}>
              "{pkg.theme[locale] || pkg.theme.en}"
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${pkg.accent}18`, border: `1px solid ${pkg.accent}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            ⚗️
          </div>
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: 10 }}>
          {pkg.focus[locale] || pkg.focus.en}
        </div>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/fighters/${fighter.id}`)}
          style={{ width: "100%", padding: "9px 0", borderRadius: 10, background: `${pkg.accent}20`, border: `1px solid ${pkg.accent}45`, color: pkg.accent, fontSize: 12, fontWeight: 900, cursor: "pointer" }}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
