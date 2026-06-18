"use client";

const TIER_META = {
  fan:      { mn: "Фан",     ko: "팬",   en: "Fan",      color: "#60A5FA" },
  pro:      { mn: "Про",     ko: "프로", en: "Pro",      color: "#F5C451" },
  champion: { mn: "Чемпион", ko: "챔피언", en: "Champion", color: "#EF4444" },
};

/**
 * SubscriptionStatus
 *
 * Props:
 *   tier       – string | null   e.g. "fan" | "pro" | "champion" | null
 *   locale     – string          "mn" | "ko" | "en"
 *   onUpgrade  – () => void      called when the user taps the Upgrade button
 */
export default function SubscriptionStatus({ tier, locale, onUpgrade }) {
  const meta = tier ? TIER_META[tier] : null;
  const label = meta
    ? meta[locale] ?? meta.en
    : locale === "mn" ? "Үнэгүй" : locale === "ko" ? "무료" : "Free";

  const sectionLabel =
    locale === "mn" ? "ЭРХИЙН ТҮВ" : locale === "ko" ? "구독 등급" : "SUBSCRIPTION";
  const upgradeLabel =
    locale === "mn" ? "Про болгох" : locale === "ko" ? "업그레이드" : "Upgrade";
  const activeLabel =
    locale === "mn" ? "Идэвхтэй" : locale === "ko" ? "활성" : "Active";

  return (
    <div
      style={{
        marginBottom: 16,
        padding: "12px 14px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            marginBottom: 4,
          }}
        >
          {sectionLabel}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 900,
            color: meta?.color || "rgba(255,255,255,0.35)",
          }}
        >
          {label}
        </div>
      </div>

      {!meta && (
        <button
          type="button"
          onClick={onUpgrade}
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            background: "linear-gradient(135deg,#F5C451,#D4A017)",
            border: "none",
            color: "#000",
            fontSize: 11,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {upgradeLabel}
        </button>
      )}

      {meta && (
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 8,
            background: `${meta.color}18`,
            border: `1px solid ${meta.color}40`,
            fontSize: 11,
            fontWeight: 900,
            color: meta.color,
          }}
        >
          ✓ {activeLabel}
        </div>
      )}
    </div>
  );
}
