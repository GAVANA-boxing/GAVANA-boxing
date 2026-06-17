"use client";

import { RADIUS, GOLD, whiteAlpha } from "@/lib/tokens";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";

const TAF_L = {
  en: {
    title:      "TRIBE OVERVIEW",
    total:      (n) => `${n} fighter${n !== 1 ? "s" : ""}`,
    userBadge:  "YOU",
    feed:       "RECENT ACTIVITY",
    acts: [
      (arch, n) => `${n} ${arch} fighters in GAVANA`,
      (arch, n) => `${arch} tribe has ${n} member${n !== 1 ? "s" : ""}`,
      (arch, n) => `${n} ${arch} fighter${n !== 1 ? "s" : ""} building DNA`,
    ],
    growing:  (arch) => `${arch} tribe growing`,
    dominant: (arch) => `${arch} is the largest tribe`,
    empty:    "Be the first fighter in this tribe.",
    totalLabel: "total",
  },
  mn: {
    title:      "ОВОГ АЙМГИЙН ТОЙМ",
    total:      (n) => `${n} тулаанч`,
    userBadge:  "ТА",
    feed:       "СҮҮЛИЙН ИДЭВХ",
    acts: [
      (arch, n) => `${n} ${arch} тулаанч GAVANA-д`,
      (arch, n) => `${arch} овог ${n} гишүүнтэй`,
      (arch, n) => `${n} ${arch} тулаанч ДНХ бүрдүүлж байна`,
    ],
    growing:  (arch) => `${arch} овог өсч байна`,
    dominant: (arch) => `${arch} хамгийн том овог`,
    empty:    "Энэ овгийн анхны тулаанч бол.",
    totalLabel: "нийт",
  },
  ko: {
    title:      "부족 현황",
    total:      (n) => `${n}명`,
    userBadge:  "YOU",
    feed:       "최근 활동",
    acts: [
      (arch, n) => `GAVANA에 ${n}명의 ${arch} 파이터`,
      (arch, n) => `${arch} 부족 ${n}명`,
      (arch, n) => `${n}명의 ${arch}이 DNA 구축 중`,
    ],
    growing:  (arch) => `${arch} 부족 성장 중`,
    dominant: (arch) => `${arch}이 가장 큰 부족`,
    empty:    "이 부족의 첫 파이터가 되세요.",
    totalLabel: "전체",
  },
};

const ARCH_DISPLAY = {
  en: { pressure: "Pressure", outboxer: "Outboxer", counter: "Counter", explosive: "Explosive", technician: "Technician" },
  mn: { pressure: "Дарамт", outboxer: "Аутбоксер", counter: "Контр", explosive: "Тэсрэлт", technician: "Техникч" },
  ko: { pressure: "프레셔", outboxer: "아웃복서", counter: "카운터", explosive: "폭발적", technician: "테크니션" },
};

export default function TribeActivityFeed({ allTribeCounts, userArchetype, locale }) {
  if (!allTribeCounts) return null;
  const L  = TAF_L[locale]  || TAF_L.en;
  const AD = ARCH_DISPLAY[locale] || ARCH_DISPLAY.en;
  const ARCH_KEYS = ["pressure", "outboxer", "counter", "explosive", "technician"];

  const total = ARCH_KEYS.reduce((s, k) => s + (allTribeCounts[k] || 0), 0);
  const sorted = [...ARCH_KEYS].sort((a, b) => (allTribeCounts[b] || 0) - (allTribeCounts[a] || 0));
  const maxCount = allTribeCounts[sorted[0]] || 1;
  const dominant = sorted[0];

  // Deterministic activity items using day seed
  const daySeed = Math.floor(Date.now() / 86400000);
  const feedItems = sorted.filter((k) => (allTribeCounts[k] || 0) > 0).slice(0, 3).map((arch, i) => {
    const n = allTribeCounts[arch] || 0;
    const actIdx = (daySeed + i) % L.acts.length;
    return { arch, text: L.acts[actIdx](AD[arch], n) };
  });

  // Dominant tribe notice
  const dominantNote = total > 0 ? (dominant === userArchetype ? L.growing(AD[dominant]) : L.dominant(AD[dominant])) : null;

  return (
    <div style={{ borderRadius: RADIUS.lg, overflow: "hidden", border: `1px solid ${whiteAlpha(0.07)}`, background: whiteAlpha(0.015), marginBottom: 8 }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${whiteAlpha(0.12)}, transparent)` }} />
      <div style={{ padding: "14px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.28), textTransform: "uppercase" }}>
            {L.title}
          </span>
          <span style={{ fontSize: 9, fontWeight: 900, color: whiteAlpha(0.28), fontFamily: "monospace" }}>
            {total} {L.totalLabel}
          </span>
        </div>

        {/* Archetype bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {sorted.map((arch) => {
            const n   = allTribeCounts[arch] || 0;
            const pct = maxCount > 0 ? (n / maxCount) * 100 : 0;
            const acc = ARCH_TRAINING_COLORS[arch] || GOLD;
            const isUser = arch === userArchetype;
            return (
              <div key={arch} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 72, fontSize: 9, fontWeight: 900, letterSpacing: 0.8,
                  textTransform: "uppercase", flexShrink: 0, textAlign: "right",
                  color: isUser ? acc : whiteAlpha(0.32),
                }}>
                  {AD[arch]}
                </span>
                <div style={{ flex: 1, height: 5, background: whiteAlpha(0.05), borderRadius: 3, overflow: "hidden", position: "relative" }}>
                  <div style={{
                    width: `${pct}%`, height: "100%", borderRadius: 3,
                    background: isUser ? acc : whiteAlpha(0.18),
                    boxShadow: isUser ? `0 0 8px ${acc}55` : "none",
                    transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)",
                  }} />
                </div>
                <span style={{ width: 28, textAlign: "right", fontSize: 10, fontWeight: 900, color: isUser ? acc : whiteAlpha(0.3), fontFamily: "monospace", flexShrink: 0 }}>
                  {n}
                </span>
                {isUser && (
                  <span style={{ fontSize: 7.5, fontWeight: 900, color: acc, background: `${acc}18`, border: `1px solid ${acc}35`, borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>
                    {L.userBadge}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Activity feed */}
        {feedItems.length > 0 && (
          <div style={{ borderTop: `1px solid ${whiteAlpha(0.05)}`, paddingTop: 12 }}>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.2), textTransform: "uppercase", marginBottom: 8 }}>
              {L.feed}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {feedItems.map(({ arch, text }, i) => {
                const acc = ARCH_TRAINING_COLORS[arch] || GOLD;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: acc, flexShrink: 0, boxShadow: `0 0 5px ${acc}66` }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: whiteAlpha(0.48), lineHeight: 1.3 }}>
                      {text}
                    </span>
                  </div>
                );
              })}
              {dominantNote && (
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, flexShrink: 0, boxShadow: `0 0 5px ${GOLD}55` }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: whiteAlpha(0.38), lineHeight: 1.3 }}>
                    {dominantNote}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {total === 0 && (
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: whiteAlpha(0.3), textAlign: "center", padding: "8px 0" }}>
            {L.empty}
          </p>
        )}
      </div>
    </div>
  );
}
