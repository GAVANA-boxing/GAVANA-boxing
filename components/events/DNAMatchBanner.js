"use client";

import { GOLD } from "@/lib/tokens";
import { TYPE_META, getTypeLabel, isUpcoming } from "@/components/events/eventHelpers";

const DNA_EVENT_MAP = {
  pressure:   ["sparring", "tournament"],
  explosive:  ["sparring", "tournament"],
  outboxer:   ["seminar", "boxing"],
  counter:    ["seminar", "boxing"],
  technician: ["seminar", "boxing"],
};

const DNA_LABELS = {
  pressure:   { en: "Pressure Fighter",   mn: "Дарамтын тулаанч",      ko: "프레셔 파이터" },
  explosive:  { en: "Explosive Fighter",  mn: "Тэсрэлтийн тулаанч",    ko: "폭발적 파이터" },
  outboxer:   { en: "Outboxer",           mn: "Аутбоксер",              ko: "아웃복서" },
  counter:    { en: "Counter Fighter",    mn: "Контр тулаанч",          ko: "카운터 파이터" },
  technician: { en: "Technician",         mn: "Техникч",                ko: "테크니션" },
};

const DNA_COLORS = {
  pressure:   "#EF4444",
  explosive:  "#F59E0B",
  outboxer:   "#3B82F6",
  counter:    "#8B5CF6",
  technician: "#10B981",
};

/**
 * Banner showing upcoming events that match the user's fighter DNA archetype.
 *
 * Props:
 *   userArchetype {string}   – e.g. "pressure"
 *   events        {Array}    – full events array
 *   locale        {string}   – "mn" | "ko" | "en"
 *   onEventClick  {Function} – called with (eventId)
 */
export default function DNAMatchBanner({ userArchetype, events, locale, onEventClick }) {
  if (!userArchetype) return null;

  const recommendedTypes = DNA_EVENT_MAP[userArchetype] || [];
  const matched = events.filter((e) => recommendedTypes.includes(e.eventType) && isUpcoming(e)).slice(0, 2);
  if (matched.length === 0) return null;

  const acc = DNA_COLORS[userArchetype] || GOLD;
  const archLabel = DNA_LABELS[userArchetype]?.[locale] || userArchetype;

  const bannerLabel =
    locale === "mn"
      ? `${archLabel}-Д ТОХИРОХ ЭВЕНТ`
      : locale === "ko"
      ? `${archLabel} 맞춤 이벤트`
      : `EVENTS FOR YOUR DNA · ${archLabel}`;

  return (
    <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 14, background: `${acc}08`, border: `1px solid ${acc}22` }}>
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 8 }}>
        🧬 {bannerLabel}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {matched.map((ev) => {
          const meta = TYPE_META[ev.eventType] || TYPE_META.boxing;
          return (
            <button
              key={ev.id}
              type="button"
              onClick={() => onEventClick(ev.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 10,
                background: `${meta.color}10`, border: `1px solid ${meta.color}28`,
                textAlign: "left", cursor: "pointer", color: "#fff",
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{meta.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ev.title}
                </div>
                <div style={{ fontSize: 9, color: meta.color, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {getTypeLabel(ev.eventType, locale)}
                </div>
              </div>
              <div style={{ fontSize: 16, color: "rgba(255,255,255,0.2)" }}>›</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
