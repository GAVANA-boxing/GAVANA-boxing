"use client";

export default function ProGate({ tier, locale, router, children }) {
  const isPro = tier === "pro" || tier === "champion";
  if (isPro) return children;
  const PG_L = {
    en: { lock: "PRO FEATURE", title: "Unlock Full Access", sub: "Get detailed DNA analytics, comparison tools, and more.", btn: "Upgrade to Pro" },
    mn: { lock: "ПРО БОЛОМЖ", title: "Бүрэн хандалт нээх", sub: "Нарийвчилсан ДНХ шинжилгээ, харьцуулалт болон бусад.", btn: "Про болгох" },
    ko: { lock: "프로 기능", title: "전체 액세스 잠금 해제", sub: "상세 DNA 분석, 비교 도구 등.", btn: "프로로 업그레이드" },
  };
  const L = PG_L[locale] || PG_L.en;
  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ filter: "blur(3px)", pointerEvents: "none", userSelect: "none", opacity: 0.4 }}>{children}</div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(10,10,14,0.75)", backdropFilter: "blur(4px)", borderRadius: 14, border: "1px solid rgba(245,196,81,0.25)", padding: "20px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: "rgba(245,196,81,0.7)", textTransform: "uppercase", marginBottom: 6 }}>{L.lock}</div>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: 6 }}>{L.title}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, marginBottom: 14 }}>{L.sub}</div>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/profile?upgrade=1`)}
          style={{ padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg,#F5C451,#D4A017)", border: "none", color: "#000", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
        >
          {L.btn}
        </button>
      </div>
    </div>
  );
}
