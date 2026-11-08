"use client";

// Locks a GAVANA Pro feature. Every Pro CTA goes to the one Pro page (/pro).
export default function ProGate({ pro, locale, router, children }) {
  if (pro) return children;
  const PG_L = {
    en: { lock: "GAVANA PRO", title: "This is a Pro feature", btn: "See GAVANA Pro" },
    mn: { lock: "GAVANA PRO", title: "Энэ бол Pro боломж", btn: "GAVANA Pro үзэх" },
    ko: { lock: "GAVANA PRO", title: "Pro 기능이에요", btn: "GAVANA Pro 보기" },
  };
  const L = PG_L[locale] || PG_L.en;
  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
      <div aria-hidden="true" style={{ filter: "blur(3px)", pointerEvents: "none", userSelect: "none", opacity: 0.4 }}>{children}</div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(10,10,14,0.78)", backdropFilter: "blur(4px)", borderRadius: 14, border: "1px solid rgba(245,196,81,0.25)", padding: "16px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: "rgba(245,196,81,0.85)", marginBottom: 6 }}>🔒 {L.lock}</div>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: 12 }}>{L.title}</div>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/pro`)}
          style={{ minHeight: 40, padding: "0 20px", borderRadius: 10, background: "linear-gradient(135deg,#F5C451,#D4A017)", border: "none", color: "#000", fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}
        >
          {L.btn}
        </button>
      </div>
    </div>
  );
}
