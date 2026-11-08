"use client";

import { PRO_PERKS, PRO_PRICES, formatMnt } from "@/lib/pro";

// Small Pro teaser for the Fighter DNA page. Perks and price come from lib/pro.js (the one
// definition); buying happens on /pro, which knows whether Pro is on sale yet.
export default function ProUpgradePanel({ locale, router }) {
  const L = (mn, ko, en) => (locale === "mn" ? mn : locale === "ko" ? ko : en);
  const price = formatMnt(PRO_PRICES.monthly.amount);
  return (
    <div style={{ borderRadius: 16, padding: "16px", background: "linear-gradient(160deg, rgba(245,196,81,0.10), rgba(245,196,81,0.02))", border: "1px solid rgba(245,196,81,0.28)", marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: "#F5C451" }}>GAVANA PRO</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>{price} / {L("сар", "월", "month")}</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
        {PRO_PERKS.map((p) => (
          <li key={p.key} style={{ display: "flex", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
            <span aria-hidden="true">{p.icon}</span>
            <span>{p.title[locale] || p.title.en}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => router.push(`/${locale}/pro`)}
        style={{ marginTop: 12, width: "100%", minHeight: 44, borderRadius: 12, border: "1px solid rgba(245,196,81,0.4)", background: "rgba(245,196,81,0.12)", color: "#F5C451", fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}
      >
        {L("Дэлгэрэнгүй →", "자세히 보기 →", "Learn more →")}
      </button>
    </div>
  );
}
