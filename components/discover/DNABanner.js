"use client";

import { GOLD } from "@/lib/tokens";

const DNA_CONTENT_MAP = {
  pressure:   { keywords: ["pressure", "aggression", "forward", "power", "combinations"], style: "pressure" },
  outboxer:   { keywords: ["footwork", "distance", "jab", "movement", "range"], style: "outboxer" },
  counter:    { keywords: ["counter", "defense", "timing", "patience", "reaction"], style: "counter" },
  explosive:  { keywords: ["speed", "explosive", "fast", "burst", "power"], style: "brawler" },
  technician: { keywords: ["technique", "form", "precision", "fundamentals", "angles"], style: "technical" },
};

const DNA_LABELS = {
  pressure:   { en: "Pressure", mn: "Дарамт", ko: "프레셔" },
  outboxer:   { en: "Outboxer", mn: "Аутбоксер", ko: "아웃복서" },
  counter:    { en: "Counter", mn: "Контр", ko: "카운터" },
  explosive:  { en: "Explosive", mn: "Тэсрэлт", ko: "폭발적" },
  technician: { en: "Technician", mn: "Техник", ko: "기술" },
};

const DNA_COLORS = {
  pressure: "#EF4444", outboxer: "#3B82F6", counter: "#8B5CF6", explosive: "#F59E0B", technician: "#10B981",
};

export default function DNABanner({
  userArchetype,
  forYouReels,
  selectedStyle,
  setSelectedStyle,
  locale,
  router,
}) {
  if (!userArchetype) return null;

  const acc = DNA_COLORS[userArchetype] || GOLD;
  const archLabel = DNA_LABELS[userArchetype]?.[locale] || userArchetype;
  const map = DNA_CONTENT_MAP[userArchetype];
  if (!map) return null;

  const matchedReels = forYouReels.filter((r) =>
    map.keywords.some((kw) =>
      (r.title || "").toLowerCase().includes(kw) ||
      (r.description || "").toLowerCase().includes(kw) ||
      (r.hashtags || []).some((h) => h.toLowerCase().includes(kw))
    )
  ).slice(0, 3);

  if (matchedReels.length === 0) {
    if (selectedStyle === "all" && map.style) {
      return (
        <div style={{ padding: "0 16px 8px" }}>
          <button
            type="button"
            onClick={() => setSelectedStyle(map.style)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: `${acc}12`, border: `1px solid ${acc}30`, color: acc, fontSize: 10, fontWeight: 900, cursor: "pointer" }}
          >
            🧬 {locale === "mn" ? `${archLabel} контент харах →` : locale === "ko" ? `${archLabel} 콘텐츠 보기 →` : `Show ${archLabel} content →`}
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <div style={{ padding: "0 16px 0", marginBottom: 4 }}>
      <div style={{ padding: "10px 14px", borderRadius: 14, background: `${acc}08`, border: `1px solid ${acc}22`, marginBottom: 4 }}>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 6 }}>
          🧬 {locale === "mn" ? `${archLabel} ДНХ-Д ТОХИРОХ КОНТЕНТ` : locale === "ko" ? `${archLabel} DNA 맞춤 콘텐츠` : `FOR YOUR DNA · ${archLabel}`}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {matchedReels.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => router.push(`/${locale}/reels?reelId=${r.id}`)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", textAlign: "left", cursor: "pointer", background: "none", border: "none", color: "#fff" }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 8, background: `${acc}18`, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {r.thumbnailUrl
                  ? <img src={r.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 20 }}>🎬</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.title || r.description?.slice(0, 40) || "Video"}
                </div>
                <div style={{ fontSize: 9, color: acc, fontWeight: 700, marginTop: 1 }}>{archLabel}</div>
              </div>
              <div style={{ fontSize: 16, color: "rgba(255,255,255,0.2)" }}>›</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
