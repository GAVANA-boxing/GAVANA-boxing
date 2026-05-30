"use client";

import { GOLD } from "@/lib/tokens";

export const FILTER_CHIPS = [
  { key: "beginner",      emoji: "🌱", en: "Beginner",     mn: "Анхан шат",       ko: "초급" },
  { key: "footwork",      emoji: "👣", en: "Footwork",     mn: "Хөлний ажил",     ko: "풋워크" },
  { key: "guard",         emoji: "🛡️", en: "Guard",        mn: "Хамгаалалт",      ko: "가드" },
  { key: "power",         emoji: "💥", en: "Power",        mn: "Хүч",             ko: "파워" },
  { key: "defense",       emoji: "🔰", en: "Defense",      mn: "Хамгаалалт",      ko: "방어" },
  { key: "fighter-style", emoji: "⚡", en: "Fighter Style", mn: "Тулаанчийн загвар", ko: "파이터 스타일" },
];

// Exported so KnowledgeLibrary can use the same logic for memoized filtering
export function matchesSearch(lesson, query, filter) {
  if (filter) {
    const haystack = (lesson.id + " " + lesson.title + " " + (lesson.subtitle || "") + " " + (lesson.keywordsMn || []).join(" ")).toLowerCase();
    const ok =
      filter === "beginner"      ? lesson.difficulty === "beginner"
      : filter === "footwork"    ? /footwork/.test(haystack)
      : filter === "guard"       ? /guard/.test(haystack)
      : filter === "power"       ? /cross|hook|power|rotation/.test(haystack) || /cross|hook/.test(lesson.id)
      : filter === "defense"     ? /guard|recovery|defense/.test(haystack)
      : filter === "fighter-style" ? !!lesson.relatedFighter
      : true;
    if (!ok) return false;
  }
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    lesson.title, lesson.subtitle, lesson.relatedFighterName, lesson.animal,
    lesson.concept, lesson.explanation, lesson.commonMistake, lesson.coachCue,
    ...(lesson.keyCues || []),
    ...(lesson.bodyMechanics || []),
    ...(lesson.keywordsMn || []),
  ].some(f => f?.toLowerCase().includes(q));
}

export default function AcademySearchBar({ query, onQuery, activeFilter, onFilter, locale }) {
  const placeholder =
    locale === "mn" ? "Техник, тулаанч, түлхүүр үг хайх…"
    : locale === "ko" ? "기술, 파이터, 키워드 검색…"
    : "Search technique, fighter, keyword…";

  return (
    <div>
      {/* Search input */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 13px", borderRadius: 12,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
        marginBottom: 10,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.28)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="search"
          value={query}
          onChange={e => onQuery(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: "#fff", fontSize: 13, fontWeight: 500,
            WebkitAppearance: "none",
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery("")}
            style={{
              background: "none", border: "none",
              color: "rgba(255,255,255,0.28)", cursor: "pointer",
              padding: "2px 4px", fontSize: 16, lineHeight: 1, flexShrink: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {FILTER_CHIPS.map(chip => {
          const isOn = activeFilter === chip.key;
          const label = chip[locale] || chip.en;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => onFilter(isOn ? null : chip.key)}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "5px 11px", borderRadius: 20,
                background: isOn ? "rgba(245,196,81,0.14)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${isOn ? "rgba(245,196,81,0.42)" : "rgba(255,255,255,0.08)"}`,
                color: isOn ? GOLD : "rgba(255,255,255,0.42)",
                fontSize: 10, fontWeight: 800, cursor: "pointer",
                transition: "background 150ms, border-color 150ms, color 150ms",
              }}
            >
              <span style={{ fontSize: 11 }}>{chip.emoji}</span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
