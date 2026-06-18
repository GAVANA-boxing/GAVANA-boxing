"use client";

import { useRouter } from "next/navigation";
import { translate } from "@/lib/i18n";
import { GOLD, redAlpha, goldAlpha, blackAlpha } from "@/lib/tokens";

export default function TodayLessonHero({ todayFocus, locale, onAsk }) {
  const router = useRouter();
  const t = (key) => translate(locale, key);

  return (
    <div style={{
      borderRadius: 18,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.07)",
      background: "#0d0b0e",
    }}>
      {/* Hero visual */}
      <div style={{
        height: 160,
        position: "relative",
        background: `linear-gradient(135deg, ${goldAlpha(0.22)} 0%, ${redAlpha(0.12)} 60%, transparent 100%), #0d0b0e`,
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `repeating-linear-gradient(55deg, rgba(245,196,81,0.06) 0, rgba(245,196,81,0.06) 1px, transparent 0, transparent 22px)`,
        }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, #0d0b0e, transparent)" }} />
        {/* Day badge */}
        <div style={{
          position: "absolute", top: 14, left: 14,
          fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: GOLD,
          background: `${goldAlpha(0.15)}`, border: `1px solid ${goldAlpha(0.3)}`,
          borderRadius: 20, padding: "4px 10px", textTransform: "uppercase",
        }}>
          {todayFocus.day}
        </div>
        <span style={{
          position: "absolute", bottom: 18, left: 16,
          fontSize: 40, filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.9))",
        }}>
          {todayFocus.emoji}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px 16px" }}>
        <p style={{ margin: "0 0 5px", fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
          {todayFocus.focus}
        </p>
        <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "rgba(255,255,255,0.52)", lineHeight: 1.5 }}>
          {todayFocus.desc}
        </p>
        <div style={{ background: blackAlpha(0.35), border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 900, color: GOLD, textTransform: "uppercase", letterSpacing: 1.5 }}>
            {locale === "mn" ? "Дасгал" : "Drill"}
          </p>
          <p style={{ margin: 0, fontSize: 12.5, color: "#fde68a", lineHeight: 1.5 }}>{todayFocus.drill}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onAsk(t("libPromptToday"))}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              background: `${goldAlpha(0.12)}`, border: `1px solid ${goldAlpha(0.28)}`,
              color: GOLD, fontSize: 12, fontWeight: 800, cursor: "pointer",
            }}
          >
            {locale === "mn" ? "Асуух →" : "Ask Coach →"}
          </button>
          <button
            onClick={() => router.push(`/${locale}/train`)}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              background: `${redAlpha(0.14)}`, border: `1px solid ${redAlpha(0.3)}`,
              color: "#ff6b6b", fontSize: 12, fontWeight: 800, cursor: "pointer",
            }}
          >
            {locale === "mn" ? "⚡ Дасгалдах" : "⚡ Train Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
