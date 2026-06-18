"use client";

export default function ViewAllSessionsButton({ locale, sessionCount, router }) {
  return (
    <button
      type="button"
      onClick={() => router.push(`/${locale}/history`)}
      style={{
        display: "block", width: "100%", marginBottom: 20,
        padding: "10px 0", borderRadius: 12, fontSize: 12, fontWeight: 900,
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.35)", cursor: "pointer",
      }}
    >
      {locale === "mn" ? `📋 Бүх ${sessionCount} дасгал харах` : `📋 View All ${sessionCount} Sessions`}
    </button>
  );
}
