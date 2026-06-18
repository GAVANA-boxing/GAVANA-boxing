"use client";

import { FIGHTERS } from "@/lib/fighters";
import { FIGHTER_TECHNIQUES } from "@/lib/fighterTechniques";

const TECH_Q = {
  en: (fighter, tech) => `Coach, teach me ${fighter.name}'s "${tech.title}" technique. What are the key points I must focus on?`,
  mn: (fighter, tech) => `Coach, ${fighter.name}-ийн "${tech.title}" техникийг заагаарай. Яг юунд анхаарах ёстой вэ?`,
  ko: (fighter, tech) => `코치님, ${fighter.name}의 "${tech.title}" 기술을 가르쳐주세요. 핵심 포인트는 무엇인가요?`,
};

const SECTION_LABELS = {
  mn: "Техник асуух",
  ko: "기술 질문하기",
  en: "Ask About a Technique",
};

export default function TechniqueQuickAsk({ locale, router }) {
  const qFn = TECH_Q[locale] || TECH_Q.en;
  const cards = (FIGHTERS || []).flatMap((f) =>
    (FIGHTER_TECHNIQUES?.[f.id] || []).slice(0, 2).map((tech) => ({ fighter: f, tech }))
  );

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 10 }}>
        {SECTION_LABELS[locale] || SECTION_LABELS.en}
      </div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
        {cards.map(({ fighter, tech }) => (
          <button
            key={`${fighter.id}-${tech.title}`}
            type="button"
            onClick={() => router.push(`/${locale}/coach/chat?q=${encodeURIComponent(qFn(fighter, tech))}`)}
            style={{
              flexShrink: 0, scrollSnapAlign: "start",
              width: 150, height: 110,
              borderRadius: 14, overflow: "hidden",
              position: "relative", cursor: "pointer",
              border: `1px solid ${fighter.accent}30`,
              background: "#0a0a0c",
            }}
          >
            {fighter.imageUrl && (
              <img
                src={fighter.imageUrl}
                alt={fighter.name}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%" }}
              />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)" }} />
            <div style={{ position: "absolute", inset: 0, background: `${fighter.accent}20` }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 10px" }}>
              <div style={{ fontSize: 7.5, fontWeight: 900, color: fighter.accent, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3, opacity: 0.9 }}>
                {fighter.name}
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#fff", lineHeight: 1.2, textAlign: "left" }}>
                {tech.title}
              </div>
            </div>
            <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: `1px solid ${fighter.accent}55`, borderRadius: 10, padding: "2px 7px", backdropFilter: "blur(4px)" }}>
              <span style={{ fontSize: 7.5, fontWeight: 900, color: fighter.accent }}>ASK →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
