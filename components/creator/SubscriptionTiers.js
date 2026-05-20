"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { GOLD, RED } from "@/lib/tokens";

const TIERS = [
  {
    id: "fan",
    emoji: "🥊",
    nameKey: "tierFanName",
    priceKey: "tierFanPrice",
    price: 2.99,
    color: "#60A5FA",
    perks: ["tierFanPerk1", "tierFanPerk2"],
  },
  {
    id: "pro",
    emoji: "🥋",
    nameKey: "tierProName",
    priceKey: "tierProPrice",
    price: 7.99,
    color: GOLD,
    popular: true,
    perks: ["tierProPerk1", "tierProPerk2", "tierProPerk3"],
  },
  {
    id: "champion",
    emoji: "👑",
    nameKey: "tierChampionName",
    priceKey: "tierChampionPrice",
    price: 19.99,
    color: RED,
    perks: ["tierChampionPerk1", "tierChampionPerk2", "tierChampionPerk3", "tierChampionPerk4"],
  },
];

export default function SubscriptionTiers({ t, locale }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const stripeEnabled = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const handleSubscribe = async () => {
    if (!selected || !user || loading) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tierId: selected }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // silent — Stripe may not be configured
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {TIERS.map((tier) => {
        const isSelected = selected === tier.id;
        return (
          <div
            key={tier.id}
            onClick={() => setSelected(isSelected ? null : tier.id)}
            style={{
              position: "relative",
              borderRadius: 16,
              border: `1.5px solid ${isSelected ? tier.color : "rgba(255,255,255,0.08)"}`,
              background: isSelected
                ? `linear-gradient(145deg, ${tier.color}18, #0a0a0a)`
                : "rgba(255,255,255,0.03)",
              padding: "14px 16px",
              cursor: "pointer",
              transition: "border-color 0.2s, background 0.2s",
            }}
          >
            {tier.popular && (
              <div style={{
                position: "absolute",
                top: -10,
                left: 16,
                background: GOLD,
                color: "#000",
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: 1,
                padding: "2px 8px",
                borderRadius: 999,
              }}>
                {locale === "mn" ? "АЛДАРТАЙ" : locale === "ko" ? "인기" : "POPULAR"}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{tier.emoji}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: tier.color }}>
                    {t(tier.nameKey)}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
                    {t(tier.priceKey)}
                  </div>
                </div>
              </div>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: `2px solid ${isSelected ? tier.color : "rgba(255,255,255,0.2)"}`,
                background: isSelected ? tier.color : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                {isSelected && <span style={{ fontSize: 10, color: "#000", fontWeight: 900 }}>✓</span>}
              </div>
            </div>
            {isSelected && (
              <ul style={{ margin: "10px 0 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                {tier.perks.map((perkKey) => (
                  <li key={perkKey} style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: tier.color, fontSize: 10 }}>✦</span>
                    {t(perkKey)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      {selected && (
        <button
          onClick={stripeEnabled ? handleSubscribe : undefined}
          disabled={loading}
          style={{
            marginTop: 4,
            padding: "14px",
            borderRadius: 14,
            border: `1px solid rgba(212,175,55,${stripeEnabled ? "0.4" : "0.2"})`,
            background: stripeEnabled
              ? loading ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.08)"
              : "rgba(212,175,55,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            width: "100%",
            cursor: stripeEnabled && !loading ? "pointer" : "default",
          }}
        >
          <span style={{ fontSize: 12, color: stripeEnabled ? GOLD : "rgba(255,255,255,0.4)", fontWeight: 700 }}>
            {loading
              ? (locale === "mn" ? "Уншиж байна..." : locale === "ko" ? "로딩 중..." : "Loading...")
              : t("tierActivateBtn")}
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 1.5,
            color: GOLD,
            fontFamily: "var(--font-condensed)",
            opacity: stripeEnabled ? 1 : 0.5,
          }}>
            {stripeEnabled ? (locale === "mn" ? "ҮРГЭЛЖЛҮҮЛЭХ →" : locale === "ko" ? "계속하기 →" : "CONTINUE →") : "COMING SOON"}
          </span>
        </button>
      )}
    </div>
  );
}
