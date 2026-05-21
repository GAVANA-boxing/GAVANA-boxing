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

const LABEL = {
  subscribe: { en: "Subscribe to", mn: "Захиалах:", ko: "구독하기:" },
  loading:   { en: "Redirecting to checkout…", mn: "Уншиж байна…", ko: "로딩 중…" },
  select:    { en: "Select a plan above", mn: "Дээрээс план сонгоно уу", ko: "위에서 플랜을 선택하세요" },
  notConfigured: {
    en: "Stripe is not configured yet — add keys to .env.local to activate payments.",
    mn: "Stripe тохируулагдаагүй байна — .env.local файлд key нэмнэ үү.",
    ko: "Stripe가 설정되지 않았습니다 — .env.local에 키를 추가하세요.",
  },
  error: {
    en: "Could not start checkout. Please try again.",
    mn: "Checkout эхлүүлж чадсангүй. Дахин оролдоно уу.",
    ko: "결제를 시작할 수 없습니다. 다시 시도해주세요.",
  },
};

function l(obj, locale) {
  return obj[locale] || obj.en;
}

export default function SubscriptionTiers({ t, locale }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const stripeReady = !!(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith("pk_")
  );

  const selectedTier = TIERS.find((t) => t.id === selected);

  const handleSubscribe = async () => {
    if (!selected || !user || loading) return;
    setError("");

    if (!stripeReady) {
      setError(l(LABEL.notConfigured, locale));
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tierId: selected }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Show actual server error (e.g. "got prod_... must be price_...")
        setError(data.error || l(LABEL.error, locale));
      }
    } catch (e) {
      setError(e?.message || l(LABEL.error, locale));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {TIERS.map((tier) => {
        const isSelected = selected === tier.id;
        return (
          <div
            key={tier.id}
            onClick={() => { setSelected(isSelected ? null : tier.id); setError(""); }}
            style={{
              position: "relative",
              borderRadius: 16,
              border: `2px solid ${isSelected ? tier.color : "rgba(255,255,255,0.09)"}`,
              background: isSelected
                ? `linear-gradient(145deg, ${tier.color}22, #111)`
                : "rgba(255,255,255,0.03)",
              padding: "14px 16px",
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
              boxShadow: isSelected ? `0 0 18px ${tier.color}33` : "none",
            }}
          >
            {tier.popular && (
              <div style={{
                position: "absolute",
                top: -10,
                left: 14,
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

            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{tier.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: isSelected ? tier.color : "#fff" }}>
                    {t(tier.nameKey)}
                  </div>
                  <div style={{ fontSize: 12, color: isSelected ? tier.color : "rgba(255,255,255,0.45)", marginTop: 1, fontWeight: 700 }}>
                    {t(tier.priceKey)}
                  </div>
                </div>
              </div>
              {/* Selection indicator */}
              <div style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: `2.5px solid ${isSelected ? tier.color : "rgba(255,255,255,0.2)"}`,
                background: isSelected ? tier.color : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s",
              }}>
                {isSelected && <span style={{ fontSize: 11, color: "#000", fontWeight: 900 }}>✓</span>}
              </div>
            </div>

            {/* Perks — always visible */}
            <ul style={{ margin: "10px 0 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
              {tier.perks.map((perkKey) => (
                <li key={perkKey} style={{ fontSize: 11, color: isSelected ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ color: tier.color, fontSize: 10, flexShrink: 0 }}>✦</span>
                  {t(perkKey)}
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {/* Error message */}
      {error && (
        <div style={{
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(255,59,48,0.12)",
          border: "1px solid rgba(255,59,48,0.3)",
          fontSize: 12,
          color: "#ff6b6b",
          lineHeight: 1.5,
        }}>
          {error}
        </div>
      )}

      {/* Sticky CTA */}
      <div style={{
        position: "sticky",
        bottom: "calc(72px + env(safe-area-inset-bottom))",
        zIndex: 10,
        marginTop: 6,
      }}>
        <button
          onClick={handleSubscribe}
          disabled={!selected || loading}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 14,
            border: "none",
            background: selected
              ? loading
                ? "rgba(255,59,48,0.5)"
                : RED
              : "rgba(255,255,255,0.07)",
            color: selected ? "#fff" : "rgba(255,255,255,0.3)",
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: 0.5,
            cursor: selected && !loading ? "pointer" : "default",
            transition: "background 0.15s, color 0.15s",
            boxShadow: selected && !loading ? `0 4px 20px rgba(255,59,48,0.4)` : "none",
          }}
        >
          {loading
            ? l(LABEL.loading, locale)
            : selected
            ? `${l(LABEL.subscribe, locale)} ${t(selectedTier.nameKey)} — ${t(selectedTier.priceKey)}`
            : l(LABEL.select, locale)}
        </button>
      </div>
    </div>
  );
}
