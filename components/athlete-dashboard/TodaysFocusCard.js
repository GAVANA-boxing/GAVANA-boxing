"use client";

import { loc } from "@/lib/loc";
import { FIGHTERS } from "@/lib/fighters";
import { getPersonalConnection } from "@/lib/fighterPersonalConnection";

export default function TodaysFocusCard({ locale, radarStats, router }) {
  const weakAreas = Object.entries(radarStats).sort(([, a], [, b]) => a - b);
  const miniSnapshot = { weakAreas, radarStats };

  const top = FIGHTERS
    .map((f) => ({ fighter: f, connection: getPersonalConnection(miniSnapshot, f) }))
    .filter((x) => x.connection?.isDirectlyRelevant)
    .sort((a, b) => (b.connection?.relevantWeak?.length || 0) - (a.connection?.relevantWeak?.length || 0))[0];

  if (!top) return null;

  const { fighter, connection } = top;
  const acc = fighter.accent;
  const drill = connection.focusDrills?.[0] || connection.focusStudy?.[0];

  return (
    <div style={{
      position: "relative",
      background: `linear-gradient(135deg, ${acc}12 0%, rgba(0,0,0,0) 100%)`,
      border: `1px solid ${acc}30`,
      borderLeft: `3px solid ${acc}`,
      borderRadius: "3px 16px 16px 3px",
      padding: "14px 14px 12px",
      marginBottom: 20,
    }}>
      <p style={{ margin: "0 0 10px", fontSize: 9, fontWeight: 900, color: acc, letterSpacing: 2.5, textTransform: "uppercase" }}>
        {loc(locale, "⚡ Өнөөдрийн анхаарал", "⚡ 오늘의 집중", "⚡ Today's Focus")}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: drill ? 10 : 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${acc}20`, border: `1px solid ${acc}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
          🥊
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{fighter.name}</div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
            {locale === "mn"
              ? `Таны ${connection.primaryFocus} — ${connection.primaryValue?.toFixed(1)}/10`
              : `Your ${connection.primaryFocus} · ${connection.primaryValue?.toFixed(1)}/10`}
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/fighters/${fighter.id}`)}
          style={{ background: `${acc}22`, border: `1px solid ${acc}45`, borderRadius: 10, padding: "7px 13px", color: acc, fontSize: 11, fontWeight: 900, cursor: "pointer" }}
        >
          {loc(locale, "Үзэх", "보기", "Study")}
        </button>
      </div>
      {drill && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "9px 11px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 }}>
          <svg width="9" height="11" viewBox="0 0 13 16" fill={acc} style={{ marginTop: 1.5, flexShrink: 0 }}>
            <path d="M7 0L0 9h6l-1 7 7-9H6L7 0z"/>
          </svg>
          <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>{drill}</span>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/drills`)}
          style={{ padding: "9px 0", borderRadius: 10, background: `${acc}12`, border: `1px solid ${acc}30`, color: acc, fontSize: 11, fontWeight: 900, cursor: "pointer" }}
        >
          {locale === "mn" ? "⚡ Дасгал" : "⚡ Drills"}
        </button>
        <button
          type="button"
          onClick={() => {
            const area = connection.primaryFocus || weakAreas[0]?.[0] || "Guard";
            const q = locale === "mn"
              ? `Миний ${area} оноог хэрхэн сайжруулах вэ?`
              : `How can I improve my ${area} score?`;
            router.push(`/${locale}/coach/chat?q=${encodeURIComponent(q)}`);
          }}
          style={{ padding: "9px 0", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 900, cursor: "pointer" }}
        >
          {locale === "mn" ? "💬 Coach" : "💬 Ask Coach"}
        </button>
      </div>
    </div>
  );
}
