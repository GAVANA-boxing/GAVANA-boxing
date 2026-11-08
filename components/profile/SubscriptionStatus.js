"use client";

// Free / Pro status on the profile edit page. One Pro, one page (/pro) — see lib/pro.js.
export default function SubscriptionStatus({ isPro, locale, onUpgrade }) {
  const L = (mn, ko, en) => (locale === "mn" ? mn : locale === "ko" ? ko : en);
  return (
    <div style={{ marginBottom: 16, borderRadius: 14, border: isPro ? "1px solid rgba(245,196,81,0.35)" : "1px solid rgba(255,255,255,0.09)", background: isPro ? "rgba(245,196,81,0.06)" : "rgba(255,255,255,0.03)", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
          {L("ГИШҮҮНЧЛЭЛ", "멤버십", "MEMBERSHIP")}
        </div>
        <div style={{ fontSize: 15, fontWeight: 900, color: isPro ? "#F5C451" : "#fff" }}>
          {isPro ? "GAVANA Pro" : L("Үнэгүй", "무료", "Free")}
        </div>
      </div>
      <button
        type="button"
        onClick={onUpgrade}
        style={{ minHeight: 40, padding: "0 14px", borderRadius: 10, border: "1px solid rgba(245,196,81,0.4)", background: "rgba(245,196,81,0.1)", color: "#F5C451", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
      >
        {isPro ? L("Удирдах", "관리", "Manage") : L("Pro үзэх", "Pro 보기", "See Pro")}
      </button>
    </div>
  );
}
